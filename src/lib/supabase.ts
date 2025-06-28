import { createClient } from '@supabase/supabase-js'
import type { UserSettings } from './taskUtils'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

let supabase: any

// Add explicit logging to check if Supabase is configured
console.log('[Supabase] Environment check:', {
  hasUrl: !!supabaseUrl,
  hasKey: !!supabaseAnonKey,
  url: supabaseUrl ? `${supabaseUrl.substring(0, 20)}...` : 'MISSING',
  keyLength: supabaseAnonKey ? supabaseAnonKey.length : 0
});

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('[Supabase] Environment variables are missing. Using demo mode.')
  console.warn('[Supabase] Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env file')
  
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
  console.log('[Supabase] Using mock client - no real database operations will work')
} else {
  console.log('[Supabase] Creating real Supabase client')
  supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      // Configure auth settings for better email verification handling
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      flowType: 'pkce'
      // Reverted back to default localStorage for proper PKCE flow
    }
  })
  console.log('[Supabase] Real Supabase client created successfully with localStorage (default)')
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
  
  console.log('[signUpWithEmail] Starting signup process for:', email);
  console.log('[signUpWithEmail] Redirect URL will be:', `${window.location.origin}/auth/callback`);
  
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name: name,
        full_name: name,
        avatar: '🧙‍♂️'
      },
      emailRedirectTo: `${window.location.origin}/auth/callback`
    }
  })
  
  console.log('[signUpWithEmail] Supabase response:', { data: !!data, error: !!error });
  if (error) {
    console.error('[signUpWithEmail] Error details:', error);
  }
  if (data) {
    console.log('[signUpWithEmail] Success data:', {
      user: !!data.user,
      session: !!data.session,
      userId: data.user?.id,
      userEmail: data.user?.email,
      emailConfirmed: data.user?.email_confirmed_at
    });
  }
  
  return { data, error }
}

export const signInWithEmail = async (email: string, password: string) => {
  if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
    return { data: null, error: { message: 'Supabase not configured. Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env file.' } }
  }
  
  console.log('[signInWithEmail] Starting signin process for:', email);
  
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  })
  
  console.log('[signInWithEmail] Supabase response:', { data: !!data, error: !!error });
  if (error) {
    console.error('[signInWithEmail] Error details:', error);
  }
  
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

// Database helper functions
export const updateUserProfileIdByEmail = async (email: string, newUserId: string) => {
  console.log('[updateUserProfileIdByEmail] Function called with:', { email, newUserId });

  if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
    console.warn('[updateUserProfileIdByEmail] Supabase not configured, returning mock error');
    return { data: null, error: { message: 'Supabase not configured' } }
  }

  try {
    console.log('[updateUserProfileIdByEmail] Attempting to update user ID for email:', email);
    
    const { data, error } = await supabase
      .from('users')
      .update({ id: newUserId })
      .eq('email', email)
      .select()
      .single();

    console.log('[updateUserProfileIdByEmail] Update result:', {
      success: !!data,
      hasError: !!error,
      errorCode: error?.code,
      errorMessage: error?.message,
      errorDetails: error?.details,
      errorHint: error?.hint,
      updatedData: data ? {
        id: data.id,
        email: data.email,
        name: data.name
      } : null
    });

    if (error) {
      console.error('[updateUserProfileIdByEmail] Error details:', error);
    }

    return { data, error };

  } catch (err: any) {
    console.error('[updateUserProfileIdByEmail] Unexpected error:', err);
    return { 
      data: null, 
      error: { 
        message: `Unexpected error: ${err?.message || 'Unknown error'}`,
        originalError: err
      } 
    };
  }
}

export const getUserProfile = async (userId: string) => {
  console.log('[getUserProfile] Function called for userId:', userId);

  if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
    console.warn('[getUserProfile] Supabase not configured, returning mock error');
    return { data: null, error: { message: 'Supabase not configured' } }
  }

  try {
    console.log('[getUserProfile] Attempting to fetch user profile...');
    
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    console.log('[getUserProfile] Query result:', {
      success: !!data,
      hasError: !!error,
      errorCode: error?.code,
      errorMessage: error?.message,
      errorDetails: error?.details,
      errorHint: error?.hint,
      userData: data ? {
        id: data.id,
        email: data.email,
        name: data.name,
        plan: data.plan,
        avatar: data.avatar,
        created_at: data.created_at
      } : null
    });

    if (error) {
      console.error('[getUserProfile] Error details:', error);
    }

    return { data, error };

  } catch (err: any) {
    console.error('[getUserProfile] Unexpected error:', err);
    return { 
      data: null, 
      error: { 
        message: `Unexpected error: ${err?.message || 'Unknown error'}`,
        originalError: err
      } 
    };
  }
}

export const getUserSettings = async (userId: string): Promise<UserSettings | null> => {
  try {
    console.log('[getUserSettings] Function called for userId:', userId);
    
    if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
      console.log('[getUserSettings] Supabase not configured, returning default settings');
      // Return default settings for demo mode
      return {
        accountability_type: 'self',
        completion_method_setting: 'user',
        default_proof_time_minutes: 10,
        has_created_first_goal: false
      };
    }

    const { data, error } = await supabase
      .from('user_settings')
      .select('accountability_type, completion_method_setting, default_proof_time_minutes, has_created_first_goal')
      .eq('user_id', userId)
      .maybeSingle();

    console.log('[getUserSettings] Query result:', {
      hasData: !!data,
      hasError: !!error,
      errorCode: error?.code,
      errorMessage: error?.message,
      settings: data
    });

    if (error) {
      console.error('[getUserSettings] Error fetching user settings:', error);
      return null;
    }

    // If no settings found, return default settings
    if (!data) {
      console.log('[getUserSettings] No settings found, returning defaults');
      return {
        accountability_type: 'self',
        completion_method_setting: 'user',
        default_proof_time_minutes: 10,
        has_created_first_goal: false
      };
    }

    console.log('[getUserSettings] Returning user settings:', data);
    return data;
  } catch (err) {
    console.error('[getUserSettings] Error in getUserSettings:', err);
    return null;
  }
};

export const updateUserSettings = async (userId: string, settings: Partial<UserSettings>): Promise<boolean> => {
  try {
    console.log('[updateUserSettings] Function called for userId:', userId, 'with settings:', settings);
    
    if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
      // For demo mode, just return success
      console.log('[updateUserSettings] Demo mode: would update settings for user', userId, 'with', settings);
      return true;
    }

    const { error } = await supabase
      .from('user_settings')
      .update({
        ...settings,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId);

    console.log('[updateUserSettings] Update result:', {
      hasError: !!error,
      errorCode: error?.code,
      errorMessage: error?.message
    });

    if (error) {
      console.error('[updateUserSettings] Error updating user settings:', error);
      return false;
    }

    console.log('[updateUserSettings] Successfully updated user settings');
    return true;
  } catch (err) {
    console.error('[updateUserSettings] Error in updateUserSettings:', err);
    return false;
  }
};

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