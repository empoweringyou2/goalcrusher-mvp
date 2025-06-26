import { useState, useEffect } from 'react'
import { User as SupabaseUser } from '@supabase/supabase-js'
import { supabase, getUserProfile, createUserProfile, createUserSettings } from '../lib/supabase'
import { User } from '../types/user'

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null)
  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        console.log('[useAuth] Checking for existing session...')
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('[useAuth] Error getting session:', error)
          setError(error.message)
        } else if (session?.user) {
          console.log('[useAuth] Found existing session for:', session.user.email)
          setSupabaseUser(session.user)
          await loadUserProfile(session.user.id)
        } else {
          console.log('[useAuth] No existing session found')
        }
        
      } catch (err) {
        console.error('[useAuth] Error in getInitialSession:', err)
        setError('Failed to load session')
      } finally {
        setLoading(false)
      }
    }

    getInitialSession()

    // Listen for auth changes - this will handle session establishment from EmailVerificationHandler
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('[useAuth] Auth state change:', event, session?.user?.email)
        
        if (session?.user) {
          setSupabaseUser(session.user)
          
          if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
            console.log('[useAuth] Processing sign-in for:', session.user.email)
            await loadUserProfile(session.user.id)
          }
        } else {
          setSupabaseUser(null)
          
          if (event === 'SIGNED_OUT') {
            console.log('[useAuth] User signed out')
            setUser(null)
          }
        }
        
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const loadUserProfile = async (userId: string) => {
    try {
      setError(null)
      console.log('[useAuth] Loading user profile for:', userId)
      
      // Try to get existing user profile
      const { data: existingUser, error: fetchError } = await getUserProfile(userId)
      
      if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('[useAuth] Error fetching user profile:', fetchError)
        setError('Failed to load user profile')
        return
      }

      if (existingUser) {
        // User profile exists, use it
        console.log('[useAuth] Found existing user profile:', existingUser.name)
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
      } else {
        // User profile doesn't exist, create it
        const supabaseUserData = supabaseUser
        if (!supabaseUserData) return

        console.log('[useAuth] Creating new user profile for:', supabaseUserData.email)

        const name = supabaseUserData.user_metadata?.name || 
                    supabaseUserData.user_metadata?.full_name || 
                    supabaseUserData.email?.split('@')[0] || 
                    'Goal Crusher'

        const { data: newUser, error: createError } = await createUserProfile(
          userId,
          supabaseUserData.email!,
          name,
          supabaseUserData.user_metadata?.avatar_url
        )

        if (createError) {
          console.error('[useAuth] Error creating user profile:', createError)
          setError('Failed to create user profile')
          return
        }

        // Create default user settings
        await createUserSettings(userId)

        if (newUser) {
          console.log('[useAuth] Created new user profile:', newUser.name)
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
      }
    } catch (err) {
      console.error('[useAuth] Error in loadUserProfile:', err)
      setError('Failed to load user data')
    }
  }

  const refreshUser = async () => {
    if (supabaseUser) {
      await loadUserProfile(supabaseUser.id)
    }
  }

  return {
    user,
    supabaseUser,
    loading,
    error,
    refreshUser,
    isAuthenticated: !!user
  }
}