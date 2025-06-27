import { useState, useEffect } from 'react'
import { User as SupabaseUser } from '@supabase/supabase-js'
import { supabase, getUserProfile, createUserProfile, createUserSettings, updateUserProfileIdByEmail, getUserSettings } from '../lib/supabase'
import { User } from '../types/user'

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null)
  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Timeout utility function
  const withTimeout = <T>(promise: Promise<T>, timeoutMs: number, operation: string): Promise<T> => {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        console.error(`[useAuth] Timeout: ${operation} took longer than ${timeoutMs}ms`);
        reject(new Error(`Operation timed out: ${operation}`));
      }, timeoutMs);
    });

    return Promise.race([promise, timeoutPromise]);
  };

  useEffect(() => {
    console.log('[useAuth] Hook initialized, starting authentication check...')
    
    // Get initial session with timeout
    const getInitialSession = async () => {
      console.log('[useAuth] getInitialSession function started')
      
      try {
        console.log('[useAuth] About to call supabase.auth.getSession()...')
        
        // Wrap the session check with timeout
        const sessionPromise = supabase.auth.getSession();
        const { data: { session }, error } = await withTimeout(
          sessionPromise, 
          10000, // 10 second timeout
          'getSession'
        );
        
        console.log('[useAuth] getSession() completed. Session:', !!session, 'Error:', !!error)
        
        if (error) {
          console.error('[useAuth] Error getting session:', error)
          setError(error.message)
        } else if (session?.user) {
          console.log('[useAuth] Found existing session for:', session.user.email)
          setSupabaseUser(session.user)
          
          // Load user profile with timeout
          try {
            await withTimeout(
              loadUserProfile(session.user.id, session.user),
              15000, // 15 second timeout for profile loading
              'loadUserProfile (initial session)'
            );
          } catch (timeoutError) {
            console.error('[useAuth] Profile loading timed out:', timeoutError);
            setError('Failed to load user profile - please try refreshing the page');
          }
        } else {
          console.log('[useAuth] No existing session found')
        }
        
      } catch (err: any) {
        console.error('[useAuth] Error in getInitialSession:', err)
        if (err.message?.includes('timed out')) {
          setError('Authentication is taking longer than expected. Please refresh the page and try again.');
        } else {
          setError('Failed to load session')
        }
      } finally {
        console.log('[useAuth] getInitialSession finally block - setting loading to false')
        setLoading(false)
      }
    }

    getInitialSession()

    // Listen for auth changes with timeout protection
    console.log('[useAuth] Setting up auth state change listener...')
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('[useAuth] Auth state change callback triggered:', event, session?.user?.email)
        
        if (session?.user) {
          setSupabaseUser(session.user)
          
          if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
            console.log('[useAuth] Processing sign-in for:', session.user.email)
            
            try {
              // Load user profile with timeout for auth state changes
              await withTimeout(
                loadUserProfile(session.user.id, session.user),
                15000, // 15 second timeout
                `loadUserProfile (${event})`
              );
            } catch (timeoutError) {
              console.error('[useAuth] Profile loading timed out during auth state change:', timeoutError);
              setError('Failed to load user profile - please try refreshing the page');
            }
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
      const profilePromise = getUserProfile(userId);
      const { data: existingUser, error: fetchError } = await withTimeout(
        profilePromise,
        8000, // 8 second timeout for profile fetch
        'getUserProfile'
      );
      
      console.log('[useAuth] getUserProfile result - data:', !!existingUser, 'error:', !!fetchError)
      
      if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('[useAuth] Error fetching user profile:', fetchError)
        
        // If it's a permission error, try to create the user
        if (fetchError.code === 'PGRST301' || fetchError.message?.includes('RLS')) {
          console.log('[useAuth] RLS error detected, attempting to create user profile...')
          await withTimeout(
            createUserProfileFromOAuth(userId, supabaseUserData),
            10000, // 10 second timeout for profile creation
            'createUserProfileFromOAuth (RLS error)'
          );
          return
        }
        
        setError('Failed to load user profile')
        return
      }

      if (existingUser) {
        // User profile exists with correct ID, use it
        console.log('[useAuth] Found existing user profile:', existingUser.name)
        await withTimeout(
          ensureUserSettingsExist(existingUser.id),
          5000, // 5 second timeout for settings
          'ensureUserSettingsExist (existing user)'
        );
        
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
        return
      }

      // Step 2: No profile found, create new one
      console.log('[useAuth] No existing profile found, creating new user...')
      await withTimeout(
        createUserProfileFromOAuth(userId, supabaseUserData),
        10000, // 10 second timeout for new user creation
        'createUserProfileFromOAuth (new user)'
      );
      
    } catch (err: any) {
      console.error('[useAuth] Error in loadUserProfile:', err)
      if (err.message?.includes('timed out')) {
        setError('User profile loading is taking longer than expected. Please refresh the page and try again.');
      } else {
        setError('Failed to load user data')
      }
    }
    
    console.log('[useAuth] loadUserProfile completed')
  }

  const createUserProfileFromOAuth = async (userId: string, supabaseUserData: SupabaseUser) => {
    console.log('[useAuth] Creating user profile from OAuth data...')
    
    if (!supabaseUserData) {
      console.error('[useAuth] No supabaseUserData provided for profile creation')
      setError('Missing user data for profile creation')
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
      const createPromise = createUserProfile(
        userId,
        supabaseUserData.email!,
        name,
        avatar
      );
      
      const { data: newUser, error: createError } = await withTimeout(
        createPromise,
        8000, // 8 second timeout for user creation
        'createUserProfile'
      );
      
      console.log('[useAuth] createUserProfile result - data:', !!newUser, 'error:', !!createError)

      if (createError) {
        // If creation failed due to duplicate email, try to update existing user's ID
        if (createError.code === '23505' && createError.message?.includes('users_email_key')) {
          console.log('[useAuth] Duplicate email detected, attempting to update existing user ID...')
          
          const updatePromise = updateUserProfileIdByEmail(
            supabaseUserData.email!,
            userId
          );
          
          const { data: updatedUser, error: updateError } = await withTimeout(
            updatePromise,
            8000, // 8 second timeout for ID update
            'updateUserProfileIdByEmail'
          );
          
          if (updateError) {
            console.error('[useAuth] Error updating user profile ID:', updateError)
            setError('Failed to synchronize user profile')
            return
          }

          if (updatedUser) {
            console.log('[useAuth] Successfully updated user profile ID:', updatedUser.name)
            await withTimeout(
              ensureUserSettingsExist(updatedUser.id),
              5000, // 5 second timeout for settings
              'ensureUserSettingsExist (updated user)'
            );
            
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
        return
      }

      if (newUser) {
        console.log('[useAuth] Created new user profile:', newUser.name)
        await withTimeout(
          ensureUserSettingsExist(newUser.id),
          5000, // 5 second timeout for settings
          'ensureUserSettingsExist (new user)'
        );
        
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
    } catch (err: any) {
      console.error('[useAuth] Error in createUserProfileFromOAuth:', err)
      if (err.message?.includes('timed out')) {
        setError('User profile creation is taking longer than expected. Please refresh the page and try again.');
      } else {
        setError('Failed to create user profile')
      }
    }
  }

  const ensureUserSettingsExist = async (userId: string) => {
    console.log('[useAuth] Checking if user settings exist for:', userId)
    
    try {
      const settingsPromise = getUserSettings(userId);
      const settings = await withTimeout(
        settingsPromise,
        5000, // 5 second timeout for settings check
        'getUserSettings'
      );
      
      if (!settings) {
        console.log('[useAuth] No user settings found, creating default settings...')
        await withTimeout(
          createUserSettings(userId),
          5000, // 5 second timeout for settings creation
          'createUserSettings'
        );
        console.log('[useAuth] Default user settings created')
      } else {
        console.log('[useAuth] User settings already exist')
      }
    } catch (err: any) {
      console.error('[useAuth] Error ensuring user settings exist:', err)
      // Don't fail the entire auth process if settings creation fails
      if (err.message?.includes('timed out')) {
        console.warn('[useAuth] Settings operation timed out, but continuing with auth process');
      }
    }
  }

  const refreshUser = async () => {
    console.log('[useAuth] refreshUser called')
    if (supabaseUser) {
      try {
        await withTimeout(
          loadUserProfile(supabaseUser.id, supabaseUser),
          15000, // 15 second timeout for refresh
          'loadUserProfile (refresh)'
        );
      } catch (timeoutError) {
        console.error('[useAuth] User refresh timed out:', timeoutError);
        setError('Failed to refresh user data - please try again');
      }
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