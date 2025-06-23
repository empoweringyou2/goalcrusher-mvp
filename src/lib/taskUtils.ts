import { supabase } from './supabase';

export interface UserSettings {
  accountability_type: 'self' | 'ai' | 'partner' | 'group';
  completion_method_setting: 'user' | 'ai' | 'external';
  default_proof_time_minutes: number;
}

export const getUserSettings = async (userId: string): Promise<UserSettings | null> => {
  try {
    if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
      // Fallback to localStorage for demo mode
      const savedSettings = localStorage.getItem(`accountability_settings_${userId}`);
      if (savedSettings) {
        return JSON.parse(savedSettings);
      }
      return {
        accountability_type: 'self',
        completion_method_setting: 'user',
        default_proof_time_minutes: 10
      };
    }

    const { data, error } = await supabase
      .from('user_settings')
      .select('accountability_type, completion_method_setting, default_proof_time_minutes')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.error('Error fetching user settings:', error);
      return null;
    }

    // If no settings found, return default settings
    if (!data) {
      return {
        accountability_type: 'self',
        completion_method_setting: 'user',
        default_proof_time_minutes: 10
      };
    }

    return data;
  } catch (err) {
    console.error('Error in getUserSettings:', err);
    return null;
  }
};

export const updateUserSettings = async (userId: string, settings: Partial<UserSettings>): Promise<boolean> => {
  try {
    if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
      // Fallback to localStorage for demo mode
      const currentSettings = await getUserSettings(userId);
      const updatedSettings = { ...currentSettings, ...settings };
      localStorage.setItem(`accountability_settings_${userId}`, JSON.stringify(updatedSettings));
      return true;
    }

    const { error } = await supabase
      .from('user_settings')
      .update({
        ...settings,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId);

    if (error) {
      console.error('Error updating user settings:', error);
      return false;
    }

    return true;
  } catch (err) {
    console.error('Error in updateUserSettings:', err);
    return false;
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