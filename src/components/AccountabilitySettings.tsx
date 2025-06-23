import React, { useState, useEffect } from 'react';
import { Shield, Users, MessageCircle, Clock, AlertCircle, CheckCircle } from 'lucide-react';

interface AccountabilitySettingsProps {
  userId: string;
  onSettingsChange?: (settings: AccountabilitySettings) => void;
}

interface AccountabilitySettings {
  accountability_type: 'self' | 'ai' | 'partner' | 'group';
  completion_method_setting: 'user' | 'ai' | 'external';
  default_proof_time_minutes: number;
}

export const AccountabilitySettings: React.FC<AccountabilitySettingsProps> = ({
  userId,
  onSettingsChange
}) => {
  const [settings, setSettings] = useState<AccountabilitySettings>({
    accountability_type: 'self',
    completion_method_setting: 'user',
    default_proof_time_minutes: 10
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load current settings on component mount
  useEffect(() => {
    loadCurrentSettings();
  }, [userId]);

  const loadCurrentSettings = async () => {
    try {
      // In a real implementation, this would fetch from Supabase
      // For now, we'll use localStorage as a fallback
      const savedSettings = localStorage.getItem(`accountability_settings_${userId}`);
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        setSettings(parsed);
      }
    } catch (err) {
      console.error('Failed to load settings:', err);
    }
  };

  const saveSettings = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // In a real implementation, this would call the Supabase edge function
      // For now, we'll save to localStorage
      localStorage.setItem(`accountability_settings_${userId}`, JSON.stringify(settings));
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2000);
      
      if (onSettingsChange) {
        onSettingsChange(settings);
      }
    } catch (err) {
      setError('Failed to save settings. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSettingChange = (key: keyof AccountabilitySettings, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
    setIsSaved(false);
  };

  const getAccountabilityTypeDescription = () => {
    switch (settings.accountability_type) {
      case 'self':
        return 'You are responsible for tracking your own progress and staying motivated.';
      case 'ai':
        return 'Crushion will provide smart reminders, check-ins, and motivational support.';
      case 'partner':
        return 'A trusted friend, family member, or mentor will help keep you accountable.';
      case 'group':
        return 'Your team or group will provide collective accountability and support.';
      default:
        return '';
    }
  };

  const getCompletionMethodDescription = () => {
    switch (settings.completion_method_setting) {
      case 'user':
        return 'You can mark tasks as complete yourself with optional reflection and proof.';
      case 'ai':
        return 'Crushion will verify your task completion using submitted evidence and AI analysis.';
      case 'external':
        return settings.accountability_type === 'partner' 
          ? 'Your accountability partner must verify and approve your task completions.'
          : 'Your group leader or team must verify and approve your task completions.';
      default:
        return '';
    }
  };

  return (
    <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
      <div className="flex items-center gap-3 mb-6">
        <Shield className="w-6 h-6 text-yellow-400" />
        <h3 className="text-xl font-semibold text-white">Accountability Settings</h3>
      </div>

      <div className="space-y-6">
        {/* Accountability Type */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-3">
            How would you like to be held accountable?
          </label>
          <select
            value={settings.accountability_type}
            onChange={(e) => handleSettingChange('accountability_type', e.target.value)}
            className="w-full bg-gray-800 text-white px-3 py-2 rounded-lg border border-gray-700 focus:border-yellow-400 focus:outline-none"
          >
            <option value="self">Myself</option>
            <option value="ai">Crushion (AI)</option>
            <option value="partner">Accountability Partner</option>
            <option value="group">Group/Team</option>
          </select>
          <p className="text-gray-400 text-sm mt-2">{getAccountabilityTypeDescription()}</p>
        </div>

        {/* Completion Method */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-3">
            Who should verify when you complete tasks?
          </label>
          <select
            value={settings.completion_method_setting}
            onChange={(e) => handleSettingChange('completion_method_setting', e.target.value)}
            className="w-full bg-gray-800 text-white px-3 py-2 rounded-lg border border-gray-700 focus:border-yellow-400 focus:outline-none"
          >
            <option value="user">I'll confirm it myself</option>
            <option value="ai">Crushion (AI) should verify with proof</option>
            <option value="external">
              My {settings.accountability_type === 'partner' ? 'partner' : 'group leader'} will verify
            </option>
          </select>
          <p className="text-gray-400 text-sm mt-2">{getCompletionMethodDescription()}</p>
        </div>

        {/* Proof Time */}
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-3">
            How much time do you need after a task to check in or submit evidence?
          </label>
          <div className="flex items-center gap-3">
            <input
              type="number"
              min="1"
              max="60"
              value={settings.default_proof_time_minutes}
              onChange={(e) => handleSettingChange('default_proof_time_minutes', parseInt(e.target.value))}
              className="w-20 bg-gray-800 text-white px-3 py-2 rounded-lg border border-gray-700 focus:border-yellow-400 focus:outline-none text-center"
            />
            <span className="text-gray-400">minutes</span>
          </div>
          <p className="text-gray-400 text-sm mt-2">
            This determines when follow-up reminders and check-ins are scheduled.
          </p>
        </div>

        {/* Group Warning */}
        {settings.accountability_type === 'group' && (
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-yellow-400 font-medium mb-1">Group Accountability Notice</p>
                <p className="text-gray-300 text-sm">
                  When using group accountability, your task completions and progress may be visible 
                  to other group members in the public group feed. Group leaders will be responsible 
                  for verification and can approve or request additional evidence.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* AI Verification Info */}
        {settings.completion_method_setting === 'ai' && (
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <MessageCircle className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-blue-400 font-medium mb-1">AI Verification</p>
                <p className="text-gray-300 text-sm">
                  Crushion will analyze your submitted proof (photos, documents, descriptions) to verify 
                  task completion. If the evidence is unclear, you'll be prompted to provide additional details.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* External Verification Info */}
        {settings.completion_method_setting === 'external' && (
          <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Users className="w-5 h-5 text-purple-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-purple-400 font-medium mb-1">External Verification</p>
                <p className="text-gray-300 text-sm">
                  Your {settings.accountability_type === 'partner' ? 'accountability partner' : 'group leader'} will 
                  receive notifications when you submit tasks for verification. Only they can mark your tasks as complete.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {/* Save Button */}
        <div className="flex items-center gap-3 pt-4 border-t border-gray-800">
          <button
            onClick={saveSettings}
            disabled={isLoading}
            className="bg-yellow-400 text-black px-6 py-2 rounded-lg font-semibold hover:bg-yellow-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                Saving...
              </>
            ) : isSaved ? (
              <>
                <CheckCircle className="w-4 h-4" />
                Saved!
              </>
            ) : (
              'Save Settings'
            )}
          </button>
          
          {isSaved && (
            <p className="text-green-400 text-sm">
              Your accountability preferences have been updated.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};