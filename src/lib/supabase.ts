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
      resetPasswordForEmail: () => Promise.resolve({ data: null, error: { message: 'Supabase not configured' } }),
      setSession: () => Promise.resolve({ data: { session: null }, error: { message: 'Supabase not configured' } }),
      exchangeCodeForSession: () => Promise.resolve({ data: { session: null }, error: { message: 'Supabase not configured' } })
    },
    from: () => ({
      insert: () => ({ select: () => ({ single: () => Promise.resolve({ data: null, error: { message: 'Supabase not configured' } }) }) }),
      select: () => ({ eq: () => ({ single: () => Promise.resolve({ data: null, error: { message: 'Supabase not configured' } }) }) }),
      update: () => ({ eq: () => ({ select: () => ({ single: () => Promise.resolve({ data: null, error: { message: 'Supabase not configured' } }) }) }) })
    })
  }
  
  supabase = mockClient
} else {
  supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      // Configure auth settings for better email verification handling
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      flowType: 'pkce'
    }
  })
}

export { supabase }

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
      },
      emailRedirectTo: `${window.location.origin}/verify`
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

// Guest user functions
export const continueAsGuest = async () => {
  if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
    // Mock guest user for demo mode
    const mockGuestUser = {
      id: `guest-${Date.now()}`,
      email: `guest-${Date.now()}@goalcrusher.app`,
      name: 'Guest User',
      avatar: '👤',
      plan: 'free',
      user_type: 'guest',
      created_at: new Date().toISOString()
    }
    localStorage.setItem('guest_user_id', mockGuestUser.id)
    return { data: mockGuestUser, error: null }
  }
  
  // Generate unique guest ID
  const guestId = `guest-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  const guestEmail = `guest-${Date.now()}@goalcrusher.app`
  
  const { data, error } = await supabase
    .from('users')
    .insert([
      {
        email: guestEmail,
        name: 'Guest User',
        avatar: '👤',
        plan: 'free',
        user_type: 'guest'
      }
    ])
    .select()
    .single()

  if (data && !error) {
    // Store guest user ID in localStorage
    localStorage.setItem('guest_user_id', data.id)
  }

  return { data, error }
}

export const getGuestUser = async (guestUserId: string) => {
  if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
    // Mock guest user for demo mode
    const mockGuestUser = {
      id: guestUserId,
      email: `guest-${Date.now()}@goalcrusher.app`,
      name: 'Guest User',
      avatar: '👤',
      plan: 'free',
      user_type: 'guest',
      created_at: new Date().toISOString()
    }
    return { data: mockGuestUser, error: null }
  }
  
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', guestUserId)
    .eq('user_type', 'guest')
    .single()

  return { data, error }
}

export const clearGuestUser = () => {
  localStorage.removeItem('guest_user_id')
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
        beta_access: true
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

// Task management functions
export const markTaskComplete = async (taskId: string) => {
  if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
    // For demo mode, just return success
    return { data: { id: taskId, completed: true, xp_gained: 25 }, error: null }
  }
  
  const { data, error } = await supabase
    .from('tasks')
    .update({ 
      status: 'completed',
      completed_at: new Date().toISOString()
    })
    .eq('id', taskId)
    .select()
    .single()

  return { data, error }
}

export const markTaskIncomplete = async (taskId: string) => {
  if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
    // For demo mode, just return success
    return { data: { id: taskId, completed: false }, error: null }
  }
  
  const { data, error } = await supabase
    .from('tasks')
    .update({ 
      status: 'pending',
      completed_at: null
    })
    .eq('id', taskId)
    .select()
    .single()

  return { data, error }
}