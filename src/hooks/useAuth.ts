import { useState, useEffect } from 'react'
import { User as SupabaseUser } from '@supabase/supabase-js'
import { supabase, getUserProfile, createUserProfile, createUserSettings, updateUserProfileIdByEmail, getUserSettings } from '../lib/supabase'
import { User } from '../types/user'

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null)
  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null)
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
        } else if (session?.user) {
          console.log('[useAuth] Found existing session for:', session.user.email)
          setSupabaseUser(session.user)
          await loadUserProfile(session.user.id, session.user)
        } else {
          console.log('[useAuth] No existing session found')
        }
        
      } catch (err) {
        console.error('[useAuth] Error in getInitialSession:', err)
        setError('Failed to load session')
      } finally {
        console.log('[useAuth] getInitialSession finally block - setting loading to false')
        setLoading(false)
      }
    }

    getInitialSession()

    // Listen for auth changes - this will handle session establishment from EmailVerificationHandler
    console.log('[useAuth] Setting up auth state change listener...')
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('[useAuth] Auth state change callback triggered:', event, session?.user?.email)
        
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

  const loadUserProfile = async (userId: string, supabaseUserData: SupabaseUser) => {
    console.log('[useAuth] loadUserProfile started for userId:', userId)
    console.log('[useAuth] supabaseUserData available:', {
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
        setError('Failed to load user profile')
        return
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
          level: 1, // You might want to calculate this from user_stats table
          xp: 0, // You might want to get this from user_stats table
          joinDate: new Date(existingUser.created_at)
        })
        return
      }

      // Step 2: No profile found with auth.uid(), try to create new profile
      if (!supabaseUserData) {
        console.error('[useAuth] No supabaseUserData provided for profile creation')
        setError('Missing user data for profile creation')
        return
      }

      console.log('[useAuth] Creating new user profile for:', supabaseUserData.email)
      console.log('[useAuth] Available user metadata:', supabaseUserData.user_metadata)

      const name = supabaseUserData.user_metadata?.name || 
                  supabaseUserData.user_metadata?.full_name || 
                  supabaseUserData.email?.split('@')[0] || 
                  'Goal Crusher'

      console.log('[useAuth] Extracted name for new user:', name)
      console.log('[useAuth] Calling createUserProfile...')
      
      const { data: newUser, error: createError } = await createUserProfile(
        userId,
        supabaseUserData.email!,
        name,
        supabaseUserData.user_metadata?.avatar_url
      )
      console.log('[useAuth] createUserProfile result - data:', !!newUser, 'error:', !!createError)

      if (createError) {
        // Step 3: If creation failed due to duplicate email, try to update existing user's ID
        if (createError.code === '23505' && createError.message?.includes('users_email_key')) {
          console.log('[useAuth] Duplicate email detected, attempting to update existing user ID...')
          
          const { data: updatedUser, error: updateError } = await updateUserProfileIdByEmail(
            supabaseUserData.email!,
            userId
          )
          
          if (updateError) {
            console.error('[useAuth] Error updating user profile ID:', updateError)
            setError('Failed to synchronize user profile')
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
        setError('Failed to create user profile')
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
      }
    } catch (err) {
      console.error('[useAuth] Error in loadUserProfile:', err)
      setError('Failed to load user data')
    }
    
    console.log('[useAuth] loadUserProfile completed')
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
    }
  }

  const refreshUser = async () => {
    console.log('[useAuth] refreshUser called')
    if (supabaseUser) {
      await loadUserProfile(supabaseUser.id, supabaseUser)
    }
  }

  console.log('[useAuth] Hook render - loading:', loading, 'user:', !!user, 'error:', !!error)

  return {
    user,
    supabaseUser,
    loading,
    error,
    refreshUser,
    isAuthenticated: !!user
  }
}