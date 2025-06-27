import { getUserSettings, updateUserSettings, UserSettings } from './supabase';

export { UserSettings };

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

// Re-export the functions from supabase.ts
export { getUserSettings, updateUserSettings };