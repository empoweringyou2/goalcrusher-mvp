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
    // Get initial session - simplified to only check existing session
    const getInitialSession = async () => {
      try {
        console.log('Checking for existing session...')
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Error getting session:', error)
          setError(error.message)
        } else if (session?.user) {
          console.log('Found existing session')
          setSupabaseUser(session.user)
          await loadUserProfile(session.user.id)
        } else {
          console.log('No existing session found')
        }
        
      } catch (err) {
        console.error('Error in getInitialSession:', err)
        setError('Failed to load session')
      } finally {
        setLoading(false)
      }
    }

    getInitialSession()

    // Listen for auth changes - this will handle session establishment from EmailVerificationHandler
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('[Auth Change]', event, session?.user?.id)
        
        if (session?.user) {
          setSupabaseUser(session.user)
          
          if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
            await loadUserProfile(session.user.id)
          }
        } else {
          setSupabaseUser(null)
          
          if (event === 'SIGNED_OUT') {
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
      
      // Try to get existing user profile
      const { data: existingUser, error: fetchError } = await getUserProfile(userId)
      
      if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Error fetching user profile:', fetchError)
        setError('Failed to load user profile')
        return
      }

      if (existingUser) {
        // User profile exists, use it
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
          console.error('Error creating user profile:', createError)
          setError('Failed to create user profile')
          return
        }

        // Create default user settings
        await createUserSettings(userId)

        if (newUser) {
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
      console.error('Error in loadUserProfile:', err)
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