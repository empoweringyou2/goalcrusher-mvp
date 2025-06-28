import { useState, useEffect } from 'react'
import { User as SupabaseUser } from '@supabase/supabase-js'
import { supabase, getUserProfile, updateUserProfileIdByEmail, getUserSettings } from '../lib/supabase'
import { User } from '../types/user'

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null)
  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null)
  const [session, setSession] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    console.log('[useAuth] Hook initialized, starting authentication check...')
    
    // Get initial session
    const getInitialSession = async () => {
      console.log('[useAuth] getInitialSession function started')
      
      try {
        console.log('[useAuth] About to call supabase.auth.getSession()...')
        const { data: { session }, error } = await supabase.auth.getSession()
        console.log('[useAuth] getSession() completed. Session:', !!session, 'Error:', !!error)
        
        if (error) {
          console.error('[useAuth] Error getting session:', error)
          setError(error.message)
          setUser(null)
          setSession(null)
        } else if (session?.user) {
          console.log('[useAuth] Found existing session for:', session.user.email)
          setSupabaseUser(session.user)
          setSession(session)
          await loadUserProfile(session.user.id, session.user)
        } else {
          console.log('[useAuth] No existing session found')
          setUser(null)
          setSession(null)
        }
        
      } catch (err) {
        console.error('[useAuth] Error in getInitialSession:', err)
        setError('Failed to load session')
        setUser(null)
        setSession(null)
      } finally {
        console.log('[useAuth] getInitialSession finally block - setting loading to false')
        setLoading(false)
      }
    }

    getInitialSession()

    // Listen for auth changes
    console.log('[useAuth] Setting up auth state change listener...')
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('[useAuth] Auth state change callback triggered:', event, session?.user?.email)
        
        setSession(session)
        
        if (session?.user) {
          setSupabaseUser(session.user)
          
          if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
            console.log('[useAuth] Processing sign-in for:', session.user.email)
            await loadUserProfile(session.user.id, session.user)
          }
        } else {
          setSupabaseUser(null)
          
          if (event === 'SIGNED_OUT') {
            console.log('[useAuth] User signed out')
            setUser(null)
          }
        }
        
        console.log('[useAuth] Auth state change callback - setting loading to false')
        setLoading(false)
      }
    )

    return () => {
      console.log('[useAuth] Cleaning up auth state change subscription')
      subscription.unsubscribe()
    }
  }, [])

  // Session retry logic - retry after 2-3 seconds if auth failed
  useEffect(() => {
    let retryTimeout: NodeJS.Timeout

    // Only retry if we're not loading, not authenticated, and don't have a session
    if (!loading && !user && !session) {
      console.log('[useAuth] Setting up session retry in 3 seconds...')
      
      retryTimeout = setTimeout(async () => {
        console.log('[useAuth] Retrying session fetch...')
        try {
          const { data: { session }, error } = await supabase.auth.getSession()
          console.log('[useAuth] Retry session result:', !!session, !!error)
          
          if (session?.user && !error) {
            console.log('[useAuth] Retry successful, processing session...')
            setSession(session)
            setSupabaseUser(session.user)
            await loadUserProfile(session.user.id, session.user)
          }
        } catch (err) {
          console.error('[useAuth] Session retry failed:', err)
        }
      }, 3000) // 3 second delay
    }

    return () => {
      if (retryTimeout) {
        clearTimeout(retryTimeout)
      }
    }
  }, [loading, user, session])

  const loadUserProfile = async (userId: string, supabaseUserData: SupabaseUser) => {
    console.log('[useAuth] loadUserProfile started for userId:', userId)
    console.log('[useAuth] supabaseUserData:', {
      hasUserData: !!supabaseUserData,
      email: supabaseUserData?.email,
      emailConfirmed: !!supabaseUserData?.email_confirmed_at,
      hasMetadata: !!supabaseUserData?.user_metadata,
      metadataKeys: supabaseUserData?.user_metadata ? Object.keys(supabaseUserData.user_metadata) : []
    })
    
    try {
      setError(null)
      console.log('[useAuth] Loading user profile for:', userId)
      
      // The database trigger should have already created the user profile
      // We just need to fetch it with retries for eventual consistency
      let retryCount = 0
      const maxRetries = 5
      let existingUser = null
      
      while (retryCount < maxRetries && !existingUser) {
        console.log(`[useAuth] Attempt ${retryCount + 1} to fetch user profile...`)
        
        const { data, error: fetchError } = await getUserProfile(userId)
        
        console.log(`[useAuth] getUserProfile attempt ${retryCount + 1} result:`, {
          hasData: !!data,
          hasError: !!fetchError,
          errorCode: fetchError?.code,
          errorMessage: fetchError?.message,
          userData: data ? {
            id: data.id,
            email: data.email,
            name: data.name,
            plan: data.plan
          } : null
        })
        
        if (fetchError) {
          console.error(`[useAuth] Error fetching user profile (attempt ${retryCount + 1}):`, fetchError)
          
          // If it's an RLS error and this is the first attempt, try to handle ID synchronization
          if ((fetchError.code === 'PGRST301' || fetchError.message?.includes('RLS')) && retryCount === 0) {
            console.log('[useAuth] RLS error detected, attempting ID synchronization...')
            try {
              const { data: updatedUser, error: updateError } = await updateUserProfileIdByEmail(
                supabaseUserData.email!,
                userId
              )
              
              console.log('[useAuth] ID synchronization result:', {
                hasUpdatedUser: !!updatedUser,
                hasUpdateError: !!updateError,
                updateErrorCode: updateError?.code,
                updateErrorMessage: updateError?.message
              })
              
              if (updateError) {
                console.error('[useAuth] Error updating user profile ID:', updateError)
              } else if (updatedUser) {
                console.log('[useAuth] Successfully updated user profile ID')
                existingUser = updatedUser
                break
              }
            } catch (err) {
              console.error('[useAuth] Error in ID synchronization:', err)
            }
          }
        } else if (data) {
          console.log(`[useAuth] Successfully found user profile on attempt ${retryCount + 1}:`, {
            id: data.id,
            email: data.email,
            name: data.name
          })
          existingUser = data
          break
        } else {
          console.log(`[useAuth] No data returned on attempt ${retryCount + 1}`)
        }
        
        retryCount++
        if (retryCount < maxRetries) {
          // Wait before retrying (exponential backoff)
          const delay = Math.min(1000 * Math.pow(2, retryCount), 5000)
          console.log(`[useAuth] Waiting ${delay}ms before retry...`)
          await new Promise(resolve => setTimeout(resolve, delay))
        }
      }

      if (existingUser) {
        console.log('[useAuth] Found user profile after', retryCount + 1, 'attempts:', existingUser.name)
        
        // Ensure user settings exist (they should be created by the trigger)
        await ensureUserSettingsExist(existingUser.id)
        
        const userObject = {
          id: existingUser.id,
          name: existingUser.name,
          email: existingUser.email,
          plan: existingUser.plan,
          avatar: existingUser.avatar,
          level: 1,
          xp: 0,
          joinDate: new Date(existingUser.created_at)
        }
        
        console.log('[useAuth] Setting user object:', userObject)
        setUser(userObject)
      } else {
        console.error('[useAuth] Could not load user profile after all retries. Total attempts:', retryCount)
        setError('Failed to load user profile. The database trigger may not have completed yet. Please try refreshing the page.')
        setUser(null)
      }
      
    } catch (err) {
      console.error('[useAuth] Error in loadUserProfile:', err)
      setError('Failed to load user data: ' + (err as Error).message)
      setUser(null)
    }
    
    console.log('[useAuth] loadUserProfile completed')
  }

  const ensureUserSettingsExist = async (userId: string) => {
    console.log('[useAuth] Checking if user settings exist for:', userId)
    
    try {
      const settings = await getUserSettings(userId)
      
      console.log('[useAuth] User settings check result:', {
        hasSettings: !!settings,
        settings: settings
      })
      
      if (!settings) {
        console.log('[useAuth] No user settings found - this should not happen with the trigger')
        // The trigger should have created settings, but if they don't exist, 
        // we'll let the app continue and the settings will use defaults
      } else {
        console.log('[useAuth] User settings exist')
      }
    } catch (err) {
      console.error('[useAuth] Error checking user settings:', err)
      // Don't fail the entire auth process if settings check fails
    }
  }

  const refreshUser = async () => {
    console.log('[useAuth] refreshUser called')
    if (supabaseUser) {
      await loadUserProfile(supabaseUser.id, supabaseUser)
    }
  }

  console.log('[useAuth] Hook render - loading:', loading, 'user:', !!user, 'error:', !!error, 'session:', !!session)

  return {
    user,
    supabaseUser,
    session,
    loading,
    error,
    refreshUser,
    isAuthenticated: !!user
  }
}