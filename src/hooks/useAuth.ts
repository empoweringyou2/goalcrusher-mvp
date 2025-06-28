import { useState, useEffect } from 'react'
import { User as SupabaseUser } from '@supabase/supabase-js'
import { supabase, getUserProfile, createUserProfile, createUserSettings, updateUserProfileIdByEmail, getUserSettings } from '../lib/supabase'
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
          setUser(null) // Explicitly set user to null on session error
          setSession(null)
        } else if (session?.user) {
          console.log('[useAuth] Found existing session for:', session.user.email)
          setSupabaseUser(session.user)
          setSession(session)
          await loadUserProfile(session.user.id, session.user)
        } else {
          console.log('[useAuth] No existing session found')
          setUser(null) // Explicitly set user to null when no session
          setSession(null)
        }
        
      } catch (err) {
        console.error('[useAuth] Error in getInitialSession:', err)
        setError('Failed to load session')
        setUser(null) // Explicitly set user to null on unexpected error
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
      hasMetadata: !!supabaseUserData?.user_metadata,
      metadataKeys: supabaseUserData?.user_metadata ? Object.keys(supabaseUserData.user_metadata) : []
    })
    
    try {
      setError(null)
      console.log('[useAuth] Loading user profile for:', userId)
      
      // Step 1: Try to get existing user profile by auth.uid()
      console.log('[useAuth] Calling getUserProfile...')
      const { data: existingUser, error: fetchError } = await getUserProfile(userId)
      console.log('[useAuth] getUserProfile result - data:', !!existingUser, 'error:', !!fetchError)
      
      if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('[useAuth] Error fetching user profile:', fetchError)
        
        // If it's a permission error, try to create the user
        if (fetchError.code === 'PGRST301' || fetchError.message?.includes('RLS')) {
          console.log('[useAuth] RLS error detected, attempting to create user profile...')
          // Do NOT return here. Let the function continue to try and create the user,
          // and then let the outer try/catch handle any errors.
          await createUserProfileFromOAuth(userId, supabaseUserData)
          // After attempting creation, the flow should continue to check if a user was set.
          // If createUserProfileFromOAuth succeeded, it would have called setUser.
          // If it failed, setUser would not have been called, and an error would be set.
        } else {
          // For other fetch errors, set error and ensure user is null
          setError('Failed to load user profile: ' + fetchError.message)
          setUser(null) // Explicitly set user to null on error
          return // Exit early if a non-RLS fetch error occurs and we can't proceed
        }
      }

      if (existingUser) {
        // User profile exists with correct ID, use it
        console.log('[useAuth] Found existing user profile:', existingUser.name)
        await ensureUserSettingsExist(existingUser.id)
        setUser({
          id: existingUser.id,
          name: existingUser.name,
          email: existingUser.email,
          plan: existingUser.plan,
          avatar: existingUser.avatar,
          level: 1,
          xp: 0,
          joinDate: new Date(existingUser.created_at)
        })
      } else if (!fetchError || fetchError.code === 'PGRST116') {
        // If no existing user was found (or no rows returned), try to create
        console.log('[useAuth] No existing profile found, creating new user...')
        await createUserProfileFromOAuth(userId, supabaseUserData)
        // createUserProfileFromOAuth will call setUser if successful.
        // If it fails, it will set an error and setUser(null).
      }
      
    } catch (err) {
      console.error('[useAuth] Error in loadUserProfile:', err)
      setError('Failed to load user data: ' + (err as Error).message)
      setUser(null) // Ensure user is null if an unexpected error occurs
    }
    
    console.log('[useAuth] loadUserProfile completed')
  }

  const createUserProfileFromOAuth = async (userId: string, supabaseUserData: SupabaseUser) => {
    console.log('[useAuth] Creating user profile from OAuth data...')
    
    if (!supabaseUserData) {
      console.error('[useAuth] No supabaseUserData provided for profile creation')
      setError('Missing user data for profile creation')
      setUser(null) // Explicitly set user to null on error
      return
    }

    // Extract name from various possible sources
    const name = supabaseUserData.user_metadata?.full_name || 
                supabaseUserData.user_metadata?.name || 
                supabaseUserData.email?.split('@')[0] || 
                'Goal Crusher'

    // Extract avatar from OAuth provider
    const avatar = supabaseUserData.user_metadata?.avatar_url || 
                  supabaseUserData.user_metadata?.picture || 
                  '🧙‍♂️'

    console.log('[useAuth] Extracted user data:', { name, email: supabaseUserData.email, avatar })

    try {
      console.log('[useAuth] Calling createUserProfile...')
      const { data: newUser, error: createError } = await createUserProfile(
        userId,
        supabaseUserData.email!,
        name,
        avatar
      )
      
      console.log('[useAuth] createUserProfile result - data:', !!newUser, 'error:', !!createError)

      if (createError) {
        // If creation failed due to duplicate email, try to update existing user's ID
        if (createError.code === '23505' && createError.message?.includes('users_email_key')) {
          console.log('[useAuth] Duplicate email detected, attempting to update existing user ID...')
          
          const { data: updatedUser, error: updateError } = await updateUserProfileIdByEmail(
            supabaseUserData.email!,
            userId
          )
          
          if (updateError) {
            console.error('[useAuth] Error updating user profile ID:', updateError)
            setError('Failed to synchronize user profile')
            setUser(null) // Explicitly set user to null on error
            return
          }

          if (updatedUser) {
            console.log('[useAuth] Successfully updated user profile ID:', updatedUser.name)
            await ensureUserSettingsExist(updatedUser.id)
            setUser({
              id: updatedUser.id,
              name: updatedUser.name,
              email: updatedUser.email,
              plan: updatedUser.plan,
              avatar: updatedUser.avatar,
              level: 1,
              xp: 0,
              joinDate: new Date(updatedUser.created_at)
            })
            return
          }
        }

        console.error('[useAuth] Error creating user profile:', createError)
        setError(`Failed to create user profile: ${createError.message}`)
        setUser(null) // Explicitly set user to null on error
        return
      }

      if (newUser) {
        console.log('[useAuth] Created new user profile:', newUser.name)
        await ensureUserSettingsExist(newUser.id)
        setUser({
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          plan: newUser.plan,
          avatar: newUser.avatar,
          level: 1,
          xp: 0,
          joinDate: new Date(newUser.created_at)
        })
      } else {
        // If no user was created and no error, something unexpected happened
        console.error('[useAuth] No user created and no error returned')
        setError('Failed to create user profile: Unknown error')
        setUser(null) // Explicitly set user to null
      }
    } catch (err) {
      console.error('[useAuth] Error in createUserProfileFromOAuth:', err)
      setError('Failed to create user profile')
      setUser(null) // Explicitly set user to null on error
    }
  }

  const ensureUserSettingsExist = async (userId: string) => {
    console.log('[useAuth] Checking if user settings exist for:', userId)
    
    try {
      const settings = await getUserSettings(userId)
      
      if (!settings) {
        console.log('[useAuth] No user settings found, creating default settings...')
        await createUserSettings(userId)
        console.log('[useAuth] Default user settings created')
      } else {
        console.log('[useAuth] User settings already exist')
      }
    } catch (err) {
      console.error('[useAuth] Error ensuring user settings exist:', err)
      // Don't fail the entire auth process if settings creation fails
      // Just log the error and continue
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