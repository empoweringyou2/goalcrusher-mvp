import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

let supabase: any

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase environment variables are missing. Using demo mode.')
  // Create a mock client for development when Supabase is not configured
  const mockClient = {
    auth: {
      getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      signInWithOAuth: () => Promise.resolve({ data: null, error: { message: 'Supabase not configured' } }),
      signUp: () => Promise.resolve({ data: null, error: { message: 'Supabase not configured' } }),
      signInWithPassword: () => Promise.resolve({ data: null, error: { message: 'Supabase not configured' } }),
      signOut: () => Promise.resolve({ error: null }),
      resetPasswordForEmail: () => Promise.resolve({ data: null, error: { message: 'Supabase not configured' } })
    },
    from: () => ({
      insert: () => ({ select: () => ({ single: () => Promise.resolve({ data: null, error: { message: 'Supabase not configured' } }) }) }),
      select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: null, error: { message: 'Supabase not configured' } }) }) })
    })
  }
  
  supabase = mockClient
} else {
  supabase = createClient(supabaseUrl, supabaseAnonKey)
}

export { supabase }

// Task completion helper function
export const markTaskComplete = async (taskId: string, userId: string, reflection?: string) => {
  if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
    console.log('Demo mode: Simulating task completion')
    // For demo mode, return a mock success response
    return { 
      data: { 
        success: true, 
        task: { id: taskId, completed: true, completed_at: new Date().toISOString() },
        xp_gained: 25,
        streak_updated: true,
        message: 'Task completed successfully (demo mode)'
      }, 
      error: null 
    }
  }

  try {
    console.log('Marking task complete:', { taskId, userId, reflection })
    
    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/mark_task_complete`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        task_id: taskId,
        user_id: userId,
        reflection: reflection || null,
        completion_method: 'manual'
      }),
    })

    const result = await response.json()
    
    if (!response.ok) {
      console.error('Error from mark_task_complete function:', result)
      return { data: null, error: result }
    }

    console.log('Task completion response:', result)
    return { data: result, error: null }
  } catch (error) {
    console.error('Error calling mark_task_complete function:', error)
    return { data: null, error: { message: 'Failed to mark task complete' } }
  }
}

// Guest user helper functions
export const continueAsGuest = async () => {
  if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
    console.log('Demo mode: Creating mock guest user')
    // For demo mode, create a mock guest user
    const guestId = `guest-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const mockGuestUser = {
      id: guestId,
      email: `guest-${Date.now()}@goalcrusher.app`,
      name: 'Guest User',
      user_type: 'guest',
      plan: 'free',
      avatar: '👤',
      beta_access: true,
      created_at: new Date().toISOString()
    }
    
    localStorage.setItem('guest_user_id', mockGuestUser.id)
    localStorage.setItem('guest_user_data', JSON.stringify(mockGuestUser))
    
    console.log('Mock guest user created:', mockGuestUser)
    return { data: mockGuestUser, error: null }
  }

  try {
    console.log('Creating real guest user via Supabase...')
    // Generate a unique email for the guest user
    const timestamp = Date.now()
    const randomId = Math.random().toString(36).substr(2, 9)
    const guestEmail = `guest-${timestamp}-${randomId}@goalcrusher.app`
    
    console.log('Attempting to insert guest user with email:', guestEmail)
    
    const { data, error } = await supabase
      .from('users')
      .insert([
        {
          email: guestEmail,
          name: 'Guest User',
          user_type: 'guest',
          plan: 'free',
          avatar: '👤',
          beta_access: true
        }
      ])
      .select()
      .single()

    if (error) {
      console.error('Supabase error creating guest user:', error)
      
      // Fallback to local storage if Supabase fails
      console.log('Falling back to local storage guest user')
      const fallbackGuestUser = {
        id: `guest-${timestamp}-${randomId}`,
        email: guestEmail,
        name: 'Guest User',
        user_type: 'guest',
        plan: 'free',
        avatar: '👤',
        beta_access: true,
        created_at: new Date().toISOString()
      }
      
      localStorage.setItem('guest_user_id', fallbackGuestUser.id)
      localStorage.setItem('guest_user_data', JSON.stringify(fallbackGuestUser))
      
      return { data: fallbackGuestUser, error: null }
    }

    console.log('Guest user created successfully:', data)
    // Store guest user ID in localStorage
    localStorage.setItem('guest_user_id', data.id)
    
    return { data, error: null }
  } catch (err) {
    console.error('Error creating guest user:', err)
    
    // Fallback to local storage
    console.log('Exception occurred, falling back to local storage guest user')
    const timestamp = Date.now()
    const randomId = Math.random().toString(36).substr(2, 9)
    const fallbackGuestUser = {
      id: `guest-${timestamp}-${randomId}`,
      email: `guest-${timestamp}-${randomId}@goalcrusher.app`,
      name: 'Guest User',
      user_type: 'guest',
      plan: 'free',
      avatar: '👤',
      beta_access: true,
      created_at: new Date().toISOString()
    }
    
    localStorage.setItem('guest_user_id', fallbackGuestUser.id)
    localStorage.setItem('guest_user_data', JSON.stringify(fallbackGuestUser))
    
    return { data: fallbackGuestUser, error: null }
  }
}

export const getGuestUser = async (guestUserId: string) => {
  if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
    // For demo mode, return mock guest user from localStorage
    const guestUserData = localStorage.getItem('guest_user_data')
    if (guestUserData) {
      return { data: JSON.parse(guestUserData), error: null }
    }
    return { data: null, error: { message: 'Guest user not found' } }
  }

  try {
    // First try to get from Supabase
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', guestUserId)
      .eq('user_type', 'guest')
      .single()

    if (error || !data) {
      // Fallback to localStorage
      const guestUserData = localStorage.getItem('guest_user_data')
      if (guestUserData) {
        const localData = JSON.parse(guestUserData)
        if (localData.id === guestUserId) {
          return { data: localData, error: null }
        }
      }
      return { data: null, error: error || { message: 'Guest user not found' } }
    }

    return { data, error: null }
  } catch (err) {
    console.error('Error fetching guest user:', err)
    
    // Fallback to localStorage
    const guestUserData = localStorage.getItem('guest_user_data')
    if (guestUserData) {
      const localData = JSON.parse(guestUserData)
      if (localData.id === guestUserId) {
        return { data: localData, error: null }
      }
    }
    
    return { data: null, error: err }
  }
}

export const clearGuestUser = () => {
  localStorage.removeItem('guest_user_id')
  localStorage.removeItem('guest_user_data')
}

// Auth helper functions
export const signInWithGoogle = async () => {
  if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
    return { data: null, error: { message: 'Supabase not configured. Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env file.' } }
  }
  
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      }
    }
  })
  return { data, error }
}

export const signInWithApple = async () => {
  if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
    return { data: null, error: { message: 'Supabase not configured. Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env file.' } }
  }
  
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'apple',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`
    }
  })
  return { data, error }
}

export const signUpWithEmail = async (email: string, password: string, name: string) => {
  if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
    return { data: null, error: { message: 'Supabase not configured. Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env file.' } }
  }
  
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name: name,
        avatar: '🧙‍♂️'
      }
    }
  })
  return { data, error }
}

export const signInWithEmail = async (email: string, password: string) => {
  if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
    return { data: null, error: { message: 'Supabase not configured. Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env file.' } }
  }
  
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  })
  return { data, error }
}

export const signOut = async () => {
  // Clear guest user data on sign out
  clearGuestUser()
  
  const { error } = await supabase.auth.signOut()
  return { error }
}

export const resetPassword = async (email: string) => {
  if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
    return { data: null, error: { message: 'Supabase not configured. Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env file.' } }
  }
  
  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/auth/reset-password`
  })
  return { data, error }
}

// Database helper functions
export const createUserProfile = async (userId: string, email: string, name: string, avatar?: string) => {
  if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
    return { data: null, error: { message: 'Supabase not configured' } }
  }
  
  const { data, error } = await supabase
    .from('users')
    .insert([
      {
        id: userId,
        email,
        name,
        avatar: avatar || '🧙‍♂️',
        plan: 'free',
        beta_access: true,
        user_type: 'registered'
      }
    ])
    .select()
    .single()

  return { data, error }
}

export const getUserProfile = async (userId: string) => {
  if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
    return { data: null, error: { message: 'Supabase not configured' } }
  }
  
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single()

  return { data, error }
}

export const createUserSettings = async (userId: string) => {
  if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
    return { data: null, error: { message: 'Supabase not configured' } }
  }
  
  const { data, error } = await supabase
    .from('user_settings')
    .insert([
      {
        user_id: userId,
        dark_mode: true,
        notifications_enabled: true,
        sound_enabled: true,
        gamification_enabled: true,
        achievements_enabled: true,
        crushion_voice_style: 'friendly',
        data_training_consent: false,
        email_frequency: 'daily'
      }
    ])
    .select()
    .single()

  return { data, error }
}