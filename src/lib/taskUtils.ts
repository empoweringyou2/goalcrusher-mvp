import { getUserSettings, updateUserSettings } from './supabase';

// App data version for localStorage management
const APP_DATA_VERSION = "v1.2";

// User settings interface definition (moved from supabase.ts)
export interface UserSettings {
  accountability_type: 'self' | 'ai' | 'partner' | 'group';
  completion_method_setting: 'user' | 'ai' | 'external';
  default_proof_time_minutes: number;
  has_created_first_goal: boolean;
}

export type { UserSettings };

// Robust localStorage helper functions with versioning
const getVersionedLocalStorage = (key: string, defaultValue: any = null) => {
  try {
    const stored = localStorage.getItem(key);
    if (!stored) return defaultValue;
    
    const parsed = JSON.parse(stored);
    
    // Check if the stored data has a version
    if (parsed && typeof parsed === 'object' && parsed.version) {
      if (parsed.version === APP_DATA_VERSION) {
        return parsed.data;
      } else {
        console.log(`[taskUtils] Removing outdated localStorage key: ${key}`);
        localStorage.removeItem(key);
        return defaultValue;
      }
    } else {
      // Legacy data without version, remove it
      console.log(`[taskUtils] Removing legacy localStorage key: ${key}`);
      localStorage.removeItem(key);
      return defaultValue;
    }
  } catch (error) {
    console.error(`[taskUtils] Error reading localStorage key ${key}:`, error);
    localStorage.removeItem(key);
    return defaultValue;
  }
};

const setVersionedLocalStorage = (key: string, value: any) => {
  try {
    const versionedData = {
      version: APP_DATA_VERSION,
      data: value,
      timestamp: Date.now()
    };
    localStorage.setItem(key, JSON.stringify(versionedData));
  } catch (error) {
    console.error(`[taskUtils] Error setting localStorage key ${key}:`, error);
  }
};

export const scheduleFollowUpEvent = async (
  userId: string, 
  taskId: string, 
  taskTitle: string, 
  proofTimeMinutes: number,
  accountabilityType: string
): Promise<boolean> => {
  try {
    if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
      // For demo mode, just log the action
      console.log(`Would schedule follow-up event for task ${taskId} in ${proofTimeMinutes} minutes`);
      return true;
    }

    const { supabase } = await import('./supabase');
    const followUpTime = new Date();
    followUpTime.setMinutes(followUpTime.getMinutes() + proofTimeMinutes);

    const eventTitle = accountabilityType === 'ai' ? 'Submit Proof' : 'Check-In';
    const eventDescription = `Follow up on task: ${taskTitle}`;

    const { error } = await supabase
      .from('calendar_events')
      .insert([
        {
          user_id: userId,
          task_id: taskId,
          title: eventTitle,
          description: eventDescription,
          start_time: followUpTime.toISOString(),
          end_time: new Date(followUpTime.getTime() + 15 * 60 * 1000).toISOString(), // 15 minutes duration
          all_day: false,
          event_type: 'task'
        }
      ]);

    if (error) {
      console.error('Error scheduling follow-up event:', error);
      return false;
    }

    return true;
  } catch (err) {
    console.error('Error in scheduleFollowUpEvent:', err);
    return false;
  }
};

export const getTaskCompletionModalType = (settings: UserSettings): 'user' | 'ai' | 'external' => {
  return settings.completion_method_setting;
};

export const shouldScheduleFollowUp = (accountabilityType: string): boolean => {
  return accountabilityType !== 'self';
};

// Enhanced getUserSettings with localStorage fallback and versioning
export const getUserSettingsWithFallback = async (userId: string): Promise<UserSettings> => {
  try {
    // First try to get from database
    const dbSettings = await getUserSettings(userId);
    if (dbSettings) {
      // Cache the settings in localStorage with versioning
      setVersionedLocalStorage(`user_settings_${userId}`, dbSettings);
      return dbSettings;
    }

    // Fallback to localStorage with versioning
    const cachedSettings = getVersionedLocalStorage(`user_settings_${userId}`, null);
    if (cachedSettings) {
      console.log('[taskUtils] Using cached user settings');
      return cachedSettings;
    }

    // Final fallback to default settings
    const defaultSettings: UserSettings = {
      accountability_type: 'self',
      completion_method_setting: 'user',
      default_proof_time_minutes: 10,
      has_created_first_goal: false
    };

    // Cache the default settings
    setVersionedLocalStorage(`user_settings_${userId}`, defaultSettings);
    return defaultSettings;

  } catch (error) {
    console.error('[taskUtils] Error getting user settings:', error);
    
    // Return cached settings if available
    const cachedSettings = getVersionedLocalStorage(`user_settings_${userId}`, null);
    if (cachedSettings) {
      return cachedSettings;
    }

    // Final fallback
    return {
      accountability_type: 'self',
      completion_method_setting: 'user',
      default_proof_time_minutes: 10,
      has_created_first_goal: false
    };
  }
};

// Enhanced updateUserSettings with localStorage caching
export const updateUserSettingsWithCache = async (userId: string, settings: Partial<UserSettings>): Promise<boolean> => {
  try {
    // Update in database
    const success = await updateUserSettings(userId, settings);
    
    if (success) {
      // Update localStorage cache
      const currentSettings = getVersionedLocalStorage(`user_settings_${userId}`, {
        accountability_type: 'self',
        completion_method_setting: 'user',
        default_proof_time_minutes: 10,
        has_created_first_goal: false
      });
      
      const updatedSettings = { ...currentSettings, ...settings };
      setVersionedLocalStorage(`user_settings_${userId}`, updatedSettings);
    }
    
    return success;
  } catch (error) {
    console.error('[taskUtils] Error updating user settings:', error);
    return false;
  }
};

// Re-export the original functions from supabase.ts
export { getUserSettings, updateUserSettings };