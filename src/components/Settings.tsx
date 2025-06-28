import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  Moon, 
  Sun, 
  Volume2, 
  VolumeX, 
  Shield, 
  User, 
  Calendar, 
  Smartphone,
  Mail,
  Lock,
  Globe,
  Users,
  Trophy,
  Target,
  Zap,
  Crown,
  UserPlus,
  Settings as SettingsIcon,
  ChevronRight,
  MessageCircle,
  Gamepad2,
  Heart,
  HelpCircle,
  Book,
  AlertCircle,
  CheckCircle,
  Loader2,
  Construction
} from 'lucide-react';
import { HelpCenter } from './HelpCenter';
import { AccountabilitySettings } from './AccountabilitySettings';
import { User as UserType, AppConfig } from '../types/user';
import { getUserSettings, updateUserSettings } from '../lib/supabase';
import type { UserSettings } from '../lib/taskUtils';

interface SettingsProps {
  onStartTutorial: () => void;
  user: UserType;
  appConfig: AppConfig;
  onUpgradeToPro: () => void;
  onDowngradeToFree: () => void;
  onEndBeta: () => void;
}

// App data version for localStorage management
const APP_DATA_VERSION = "v1.2";

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
        console.log(`[Settings] Removing outdated localStorage key: ${key}`);
        localStorage.removeItem(key);
        return defaultValue;
      }
    } else {
      // Legacy data without version, remove it
      console.log(`[Settings] Removing legacy localStorage key: ${key}`);
      localStorage.removeItem(key);
      return defaultValue;
    }
  } catch (error) {
    console.error(`[Settings] Error reading localStorage key ${key}:`, error);
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
    console.error(`[Settings] Error setting localStorage key ${key}:`, error);
  }
};

export const Settings: React.FC<SettingsProps> = ({ 
  onStartTutorial, 
  user, 
  appConfig, 
  onUpgradeToPro, 
  onDowngradeToFree, 
  onEndBeta 
}) => {
  // State for all settings
  const [darkMode, setDarkMode] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [dataTrainingConsent, setDataTrainingConsent] = useState(false);
  const [crushionVoice, setCrushionVoice] = useState('friendly');
  const [achievementsEnabled, setAchievementsEnabled] = useState(true);
  const [gamificationEnabled, setGamificationEnabled] = useState(true);
  const [goalDeadlinesEnabled, setGoalDeadlinesEnabled] = useState(true);
  const [textToSpeechEnabled, setTextToSpeechEnabled] = useState(true);
  const [emailFrequency, setEmailFrequency] = useState('daily');
  const [themeColor, setThemeColor] = useState('gold');
  
  // UI state
  const [activeTab, setActiveTab] = useState<'settings' | 'teams' | 'friends' | 'accountability' | 'information'>('settings');
  const [showHelpCenter, setShowHelpCenter] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  // Load user settings on component mount
  useEffect(() => {
    loadUserSettings();
  }, [user.id]);

  const loadUserSettings = async () => {
    try {
      setIsLoading(true);
      
      // Try to load from database first
      // In a real implementation, this would fetch all settings from the database
      // For now, we'll use localStorage as a fallback for demo purposes
      const savedSettings = getVersionedLocalStorage(`user_settings_${user.id}`, null);
      
      if (savedSettings) {
        setDarkMode(savedSettings.darkMode ?? true);
        setNotificationsEnabled(savedSettings.notificationsEnabled ?? true);
        setSoundEnabled(savedSettings.soundEnabled ?? true);
        setDataTrainingConsent(savedSettings.dataTrainingConsent ?? false);
        setCrushionVoice(savedSettings.crushionVoice ?? 'friendly');
        setAchievementsEnabled(savedSettings.achievementsEnabled ?? true);
        setGamificationEnabled(savedSettings.gamificationEnabled ?? true);
        setGoalDeadlinesEnabled(savedSettings.goalDeadlinesEnabled ?? true);
        setTextToSpeechEnabled(savedSettings.textToSpeechEnabled ?? true);
        setEmailFrequency(savedSettings.emailFrequency ?? 'daily');
        setThemeColor(savedSettings.themeColor ?? 'gold');
      }
    } catch (error) {
      console.error('Failed to load user settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveUserSettings = async (newSettings: any) => {
    try {
      setSaveStatus('saving');
      
      // Save to localStorage with versioning
      const allSettings = {
        darkMode,
        notificationsEnabled,
        soundEnabled,
        dataTrainingConsent,
        crushionVoice,
        achievementsEnabled,
        gamificationEnabled,
        goalDeadlinesEnabled,
        textToSpeechEnabled,
        emailFrequency,
        themeColor,
        ...newSettings
      };
      
      setVersionedLocalStorage(`user_settings_${user.id}`, allSettings);
      
      // In a real implementation, this would also call updateUserSettings
      // await updateUserSettings(user.id, newSettings);
      
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (error) {
      console.error('Failed to save settings:', error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

  const handleToggleSetting = (settingName: string, currentValue: boolean, setter: (value: boolean) => void) => {
    const newValue = !currentValue;
    setter(newValue);
    saveUserSettings({ [settingName]: newValue });
  };

  const handleSelectSetting = (settingName: string, value: string, setter: (value: string) => void) => {
    setter(value);
    saveUserSettings({ [settingName]: value });
  };

  const handleEditProfile = () => {
    // For now, just show an alert - in the future this could open a profile editing modal
    alert('Profile editing coming soon! You can update your basic info here.');
  };

  const handleComingSoonFeature = (featureName: string) => {
    alert(`${featureName} is coming soon! We're working hard to bring you this feature.`);
  };

  // Mock data for friends and accountability partners (keeping existing data)
  const friends = [
    { id: 1, name: 'Sarah Chen', avatar: '👩‍💼', level: 15, xp: 15420, status: 'online', mutualGoals: 3, lastActive: '2 minutes ago', streak: 89 },
    { id: 2, name: 'Marcus Johnson', avatar: '👨‍🎨', level: 14, xp: 14850, status: 'offline', mutualGoals: 1, lastActive: '1 hour ago', streak: 67 },
    { id: 3, name: 'Emma Rodriguez', avatar: '👩‍🔬', level: 12, xp: 11890, status: 'online', mutualGoals: 2, lastActive: 'Just now', streak: 34 },
    { id: 4, name: 'Alex Kim', avatar: '👨‍💻', level: 10, xp: 10550, status: 'away', mutualGoals: 4, lastActive: '30 minutes ago', streak: 28 },
  ];

  const friendRequests = [
    { id: 1, name: 'John Smith', avatar: '👨‍💼', mutualFriends: 2, message: 'Hey! Would love to be accountability partners!' },
    { id: 2, name: 'Lisa Wang', avatar: '👩‍🎓', mutualFriends: 1, message: 'Saw your fitness goals, let\'s motivate each other!' },
  ];

  const accountabilityPartners = [
    { id: 1, name: 'Sarah Chen', avatar: '👩‍💼', type: 'partner', activeCommitments: 3, successRate: 94 },
    { id: 2, name: 'Productivity Ninjas', avatar: '🥷', type: 'team', activeCommitments: 5, successRate: 89 },
  ];

  const settingSections = [
    {
      title: 'Account',
      icon: User,
      settings: [
        { 
          label: 'Profile Information', 
          action: 'navigate', 
          icon: User,
          onClick: () => handleComingSoonFeature('Profile Information')
        },
        { 
          label: 'Email Preferences', 
          action: 'navigate', 
          icon: Mail,
          onClick: () => handleComingSoonFeature('Email Preferences')
        },
        { 
          label: 'Privacy & Security', 
          action: 'navigate', 
          icon: Lock,
          onClick: () => handleComingSoonFeature('Privacy & Security')
        },
      ]
    },
    {
      title: 'Gamification',
      icon: Trophy,
      settings: [
        { 
          label: 'Enable Achievements', 
          action: 'toggle', 
          icon: Trophy,
          enabled: achievementsEnabled,
          onChange: () => handleToggleSetting('achievementsEnabled', achievementsEnabled, setAchievementsEnabled),
          description: 'Show achievement badges and unlock rewards'
        },
        { 
          label: 'Enable Gamification', 
          action: 'toggle', 
          icon: Zap,
          enabled: gamificationEnabled,
          onChange: () => handleToggleSetting('gamificationEnabled', gamificationEnabled, setGamificationEnabled),
          description: 'Show XP, levels, streaks, and leaderboards'
        },
        { 
          label: 'Reset Progress', 
          action: 'navigate', 
          icon: Target, 
          danger: true,
          onClick: () => {
            if (confirm('Are you sure you want to reset all your progress? This action cannot be undone.')) {
              handleComingSoonFeature('Progress Reset');
            }
          }
        },
      ]
    },
    {
      title: 'Notifications',
      icon: Bell,
      settings: [
        { 
          label: 'Push Notifications', 
          action: 'toggle', 
          icon: Smartphone,
          enabled: notificationsEnabled,
          onChange: () => handleToggleSetting('notificationsEnabled', notificationsEnabled, setNotificationsEnabled)
        },
        { 
          label: 'Email Reminders', 
          action: 'select', 
          icon: Mail, 
          value: emailFrequency,
          options: ['never', 'daily', 'weekly'],
          onChange: (value: string) => handleSelectSetting('emailFrequency', value, setEmailFrequency)
        },
        { 
          label: 'Goal Deadlines', 
          action: 'toggle', 
          icon: Calendar, 
          enabled: goalDeadlinesEnabled,
          onChange: () => handleToggleSetting('goalDeadlinesEnabled', goalDeadlinesEnabled, setGoalDeadlinesEnabled)
        },
        { 
          label: 'Achievement Alerts', 
          action: 'toggle', 
          icon: Trophy, 
          enabled: achievementsEnabled && gamificationEnabled, 
          disabled: !achievementsEnabled || !gamificationEnabled,
          onChange: () => {
            if (achievementsEnabled && gamificationEnabled) {
              // This would toggle achievement alerts specifically
              handleComingSoonFeature('Achievement Alert Settings');
            }
          }
        },
      ]
    },
    {
      title: 'Appearance',
      icon: darkMode ? Moon : Sun,
      settings: [
        { 
          label: 'Dark Mode', 
          action: 'toggle', 
          icon: darkMode ? Moon : Sun,
          enabled: darkMode,
          onChange: () => handleToggleSetting('darkMode', darkMode, setDarkMode)
        },
        { 
          label: 'Theme Color', 
          action: 'select', 
          icon: Globe, 
          value: themeColor,
          options: ['gold', 'blue', 'green', 'purple', 'red'],
          onChange: (value: string) => handleSelectSetting('themeColor', value, setThemeColor)
        },
      ]
    },
    {
      title: 'Audio & Voice',
      icon: soundEnabled ? Volume2 : VolumeX,
      settings: [
        { 
          label: 'Sound Effects', 
          action: 'toggle', 
          icon: soundEnabled ? Volume2 : VolumeX,
          enabled: soundEnabled,
          onChange: () => handleToggleSetting('soundEnabled', soundEnabled, setSoundEnabled)
        },
        { 
          label: 'Crushion Voice Style', 
          action: 'select', 
          icon: Volume2, 
          value: crushionVoice,
          options: ['friendly', 'motivational', 'professional', 'casual'],
          onChange: (value: string) => handleSelectSetting('crushionVoice', value, setCrushionVoice)
        },
        { 
          label: 'Text-to-Speech', 
          action: 'toggle', 
          icon: Volume2, 
          enabled: textToSpeechEnabled,
          onChange: () => handleToggleSetting('textToSpeechEnabled', textToSpeechEnabled, setTextToSpeechEnabled)
        },
      ]
    },
    {
      title: 'AI & Privacy',
      icon: Shield,
      settings: [
        { 
          label: 'Allow AI Training', 
          action: 'toggle', 
          icon: Shield,
          enabled: dataTrainingConsent,
          onChange: () => handleToggleSetting('dataTrainingConsent', dataTrainingConsent, setDataTrainingConsent),
          description: 'Help improve Crushion by allowing anonymous data usage'
        },
        { 
          label: 'Data Export', 
          action: 'navigate', 
          icon: Shield,
          onClick: () => handleComingSoonFeature('Data Export')
        },
        { 
          label: 'Delete Account', 
          action: 'navigate', 
          icon: Shield, 
          danger: true,
          onClick: () => {
            if (confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
              handleComingSoonFeature('Account Deletion');
            }
          }
        },
      ]
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-400';
      case 'away': return 'bg-yellow-400';
      case 'offline': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'online': return 'Online';
      case 'away': return 'Away';
      case 'offline': return 'Offline';
      default: return 'Unknown';
    }
  };

  // Teams Tab Content - Coming Soon
  const TeamsTab = () => (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="text-center max-w-md">
        <div className="w-24 h-24 bg-yellow-400/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <Construction className="w-12 h-12 text-yellow-400" />
        </div>
        <h3 className="text-2xl font-bold text-white mb-4">Teams Coming Soon!</h3>
        <p className="text-gray-400 mb-6 leading-relaxed">
          We're building an amazing team collaboration feature that will let you:
        </p>
        <div className="space-y-3 mb-8">
          <div className="flex items-center gap-3 text-gray-300">
            <div className="w-2 h-2 bg-yellow-400 rounded-full flex-shrink-0"></div>
            <span className="text-sm">Join goal-focused teams</span>
          </div>
          <div className="flex items-center gap-3 text-gray-300">
            <div className="w-2 h-2 bg-yellow-400 rounded-full flex-shrink-0"></div>
            <span className="text-sm">Collaborate on shared objectives</span>
          </div>
          <div className="flex items-center gap-3 text-gray-300">
            <div className="w-2 h-2 bg-yellow-400 rounded-full flex-shrink-0"></div>
            <span className="text-sm">Compete in team challenges</span>
          </div>
          <div className="flex items-center gap-3 text-gray-300">
            <div className="w-2 h-2 bg-yellow-400 rounded-full flex-shrink-0"></div>
            <span className="text-sm">Share accountability and motivation</span>
          </div>
        </div>
        <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
          <p className="text-gray-400 text-sm">
            🚀 <strong className="text-white">Coming in the next update!</strong> Stay tuned for team-based goal crushing.
          </p>
        </div>
      </div>
    </div>
  );

  // Information Tab Content (keeping existing implementation)
  const InformationTab = () => (
    <div className="space-y-6">
      {/* Help & Support */}
      <div className="bg-gray-900 rounded-xl p-4 md:p-6 border border-gray-800">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-blue-400" />
          Help & Support
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
          <button
            onClick={() => setShowHelpCenter(true)}
            className="flex items-center gap-3 p-3 md:p-4 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors text-left"
          >
            <div className="w-8 md:w-10 h-8 md:h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <Book className="w-4 md:w-5 h-4 md:h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-white font-medium text-sm md:text-base">Help Center</h4>
              <p className="text-gray-400 text-xs md:text-sm">Browse guides, FAQs, and tutorials</p>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
          </button>
          
          <button
            onClick={onStartTutorial}
            className="flex items-center gap-3 p-3 md:p-4 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors text-left"
          >
            <div className="w-8 md:w-10 h-8 md:h-10 bg-yellow-600 rounded-lg flex items-center justify-center">
              <Target className="w-4 md:w-5 h-4 md:h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-white font-medium text-sm md:text-base">Tutorial</h4>
              <p className="text-gray-400 text-xs md:text-sm">Interactive walkthrough of features</p>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
          </button>
          
          <button 
            onClick={() => handleComingSoonFeature('Contact Support')}
            className="flex items-center gap-3 p-3 md:p-4 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors text-left"
          >
            <div className="w-8 md:w-10 h-8 md:h-10 bg-green-600 rounded-lg flex items-center justify-center">
              <MessageCircle className="w-4 md:w-5 h-4 md:h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-white font-medium text-sm md:text-base">Contact Support</h4>
              <p className="text-gray-400 text-xs md:text-sm">Get help from our team</p>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
          </button>
          
          <button 
            onClick={() => handleComingSoonFeature('Community')}
            className="flex items-center gap-3 p-3 md:p-4 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors text-left"
          >
            <div className="w-8 md:w-10 h-8 md:h-10 bg-purple-600 rounded-lg flex items-center justify-center">
              <Users className="w-4 md:w-5 h-4 md:h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-white font-medium text-sm md:text-base">Community</h4>
              <p className="text-gray-400 text-xs md:text-sm">Connect with other users</p>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
          </button>
        </div>
      </div>

      {/* Quick Tips */}
      <div className="bg-gray-900 rounded-xl p-4 md:p-6 border border-gray-800">
        <h3 className="text-lg font-semibold text-white mb-4">Quick Tips</h3>
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-white text-xs font-bold">1</span>
            </div>
            <div>
              <h4 className="text-white font-medium mb-1">Start with One Goal</h4>
              <p className="text-gray-300 text-sm">Focus on one meaningful goal to build momentum and establish the habit of success.</p>
            </div>
          </div>
          
          <div className="flex items-start gap-3 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
            <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-white text-xs font-bold">2</span>
            </div>
            <div>
              <h4 className="text-white font-medium mb-1">Use Accountability</h4>
              <p className="text-gray-300 text-sm">Set up accountability partners to increase your success rate by up to 95%.</p>
            </div>
          </div>
          
          <div className="flex items-start gap-3 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
            <div className="w-6 h-6 bg-yellow-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-black text-xs font-bold">3</span>
            </div>
            <div>
              <h4 className="text-white font-medium mb-1">Track Daily Progress</h4>
              <p className="text-gray-300 text-sm">Small daily actions compound into massive results. Use the dashboard to stay on track.</p>
            </div>
          </div>
        </div>
      </div>

      {/* App Information */}
      <div className="bg-gray-900 rounded-xl p-4 md:p-6 border border-gray-800">
        <h3 className="text-lg font-semibold text-white mb-4">About GoalCrusher</h3>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Version</span>
            <span className="text-white font-medium">{appConfig.version}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Data Version</span>
            <span className="text-white font-medium">{APP_DATA_VERSION}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Last Updated</span>
            <span className="text-white font-medium">January 2024</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Platform</span>
            <span className="text-white font-medium">Web Application</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-400">Developer</span>
            <span className="text-white font-medium">Empowering You 2</span>
          </div>
        </div>
        
        <div className="mt-6 pt-4 border-t border-gray-800">
          <div className="flex flex-wrap justify-center gap-4 md:gap-6 text-sm">
            <button 
              onClick={() => handleComingSoonFeature('Terms of Service')}
              className="text-yellow-400 hover:text-yellow-300 transition-colors"
            >
              Terms of Service
            </button>
            <button 
              onClick={() => handleComingSoonFeature('Privacy Policy')}
              className="text-yellow-400 hover:text-yellow-300 transition-colors"
            >
              Privacy Policy
            </button>
            <button 
              onClick={() => handleComingSoonFeature('Licenses')}
              className="text-yellow-400 hover:text-yellow-300 transition-colors"
            >
              Licenses
            </button>
          </div>
        </div>
      </div>

      {/* Feature Highlights */}
      <div className="bg-gray-900 rounded-xl p-4 md:p-6 border border-gray-800">
        <h3 className="text-lg font-semibold text-white mb-4">What's New</h3>
        <div className="space-y-3">
          <div className="flex items-center gap-3 p-3 bg-gray-800 rounded-lg">
            <div className="w-2 h-2 bg-green-400 rounded-full flex-shrink-0"></div>
            <div className="min-w-0">
              <h4 className="text-white font-medium text-sm">Enhanced Caching System</h4>
              <p className="text-gray-400 text-xs">Improved development experience with versioned localStorage</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-gray-800 rounded-lg">
            <div className="w-2 h-2 bg-blue-400 rounded-full flex-shrink-0"></div>
            <div className="min-w-0">
              <h4 className="text-white font-medium text-sm">Session State Management</h4>
              <p className="text-gray-400 text-xs">Robust handling of authentication and user preferences</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-gray-800 rounded-lg">
            <div className="w-2 h-2 bg-purple-400 rounded-full flex-shrink-0"></div>
            <div className="min-w-0">
              <h4 className="text-white font-medium text-sm">Development Tools</h4>
              <p className="text-gray-400 text-xs">Dev reset button and improved debugging capabilities</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Friends Tab Content (keeping existing implementation)
  const FriendsTab = () => (
    <div className="space-y-6">
      {/* Add Friend */}
      <div>
        <h4 className="text-white font-medium mb-3">Add Friends</h4>
        <div className="flex flex-col md:flex-row gap-2">
          <input
            type="text"
            placeholder="Enter username or email"
            className="flex-1 bg-gray-800 text-white px-3 py-2 rounded border border-gray-700 focus:border-yellow-400 focus:outline-none"
          />
          <button 
            onClick={() => handleComingSoonFeature('Friend Invites')}
            className="bg-yellow-400 text-black px-4 py-2 rounded-lg font-medium hover:bg-yellow-300 transition-colors"
          >
            Send Invite
          </button>
        </div>
      </div>

      {/* Friend Requests */}
      {friendRequests.length > 0 && (
        <div>
          <h4 className="text-white font-medium mb-3">Friend Requests ({friendRequests.length})</h4>
          <div className="space-y-3">
            {friendRequests.map((request) => (
              <div key={request.id} className="p-3 bg-gray-800 rounded-lg">
                <div className="flex flex-col md:flex-row md:items-start justify-between mb-2 gap-3">
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">{request.avatar}</div>
                    <div>
                      <h5 className="text-white font-medium">{request.name}</h5>
                      <p className="text-sm text-gray-400">{request.mutualFriends} mutual friends</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleComingSoonFeature('Accept Friend Request')}
                      className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
                    >
                      Accept
                    </button>
                    <button 
                      onClick={() => handleComingSoonFeature('Decline Friend Request')}
                      className="px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700 transition-colors"
                    >
                      Decline
                    </button>
                  </div>
                </div>
                {request.message && (
                  <p className="text-sm text-gray-300 bg-gray-700 p-2 rounded italic">
                    "{request.message}"
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* My Friends */}
      <div>
        <h4 className="text-white font-medium mb-3">My Friends ({friends.length})</h4>
        <div className="space-y-3">
          {friends.map((friend) => (
            <div key={friend.id} className="flex flex-col md:flex-row md:items-center justify-between p-3 bg-gray-800 rounded-lg gap-3">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <div className="text-2xl">{friend.avatar}</div>
                  <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-gray-800 ${getStatusColor(friend.status)}`} />
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h5 className="text-white font-medium">{friend.name}</h5>
                    {gamificationEnabled && (
                      <span className="text-xs bg-yellow-400 text-black px-2 py-0.5 rounded-full font-medium">
                        Lv.{friend.level}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-2 md:gap-4 text-sm text-gray-400">
                    <span className={getStatusColor(friend.status).replace('bg-', 'text-')}>
                      {getStatusText(friend.status)}
                    </span>
                    {gamificationEnabled && (
                      <>
                        <span>{friend.xp.toLocaleString()} XP</span>
                        <span>🔥 {friend.streak} days</span>
                      </>
                    )}
                    <span>{friend.mutualGoals} mutual goals</span>
                  </div>
                  <p className="text-xs text-gray-500">Last active: {friend.lastActive}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => handleComingSoonFeature('Message Friend')}
                  className="p-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors" 
                  title="Message"
                >
                  <MessageCircle className="w-4 h-4" />
                </button>
                {gamificationEnabled && (
                  <button 
                    onClick={() => handleComingSoonFeature('Challenge Friend')}
                    className="p-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 transition-colors" 
                    title="Challenge"
                  >
                    <Gamepad2 className="w-4 h-4" />
                  </button>
                )}
                <button 
                  onClick={() => handleComingSoonFeature('Accountability Partner')}
                  className="p-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors" 
                  title="Accountability Partner"
                >
                  <Shield className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Friend Suggestions */}
      <div className="border-t border-gray-800 pt-4">
        <h4 className="text-white font-medium mb-3">Suggested Friends</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="p-3 bg-gray-800 rounded-lg">
            <div className="flex items-center gap-3 mb-2">
              <div className="text-xl">👩‍🏫</div>
              <div className="min-w-0">
                <h5 className="text-white font-medium text-sm">Dr. Jennifer Lee</h5>
                <p className="text-xs text-gray-400">2 mutual friends</p>
              </div>
            </div>
            <button 
              onClick={() => handleComingSoonFeature('Add Friend')}
              className="w-full bg-gray-700 hover:bg-gray-600 text-white text-sm py-1 rounded transition-colors"
            >
              Add Friend
            </button>
          </div>
          
          <div className="p-3 bg-gray-800 rounded-lg">
            <div className="flex items-center gap-3 mb-2">
              <div className="text-xl">👨‍🚀</div>
              <div className="min-w-0">
                <h5 className="text-white font-medium text-sm">Captain Mike</h5>
                <p className="text-xs text-gray-400">In Productivity Ninjas</p>
              </div>
            </div>
            <button 
              onClick={() => handleComingSoonFeature('Add Friend')}
              className="w-full bg-gray-700 hover:bg-gray-600 text-white text-sm py-1 rounded transition-colors"
            >
              Add Friend
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  // Accountability Tab Content - Using the AccountabilitySettings component
  const AccountabilityTab = () => (
    <div className="space-y-6">
      {/* Accountability Settings Component */}
      <AccountabilitySettings 
        userId={user.id}
        onSettingsChange={(settings) => {
          console.log('Accountability settings updated:', settings);
        }}
      />

      {/* Current Partners */}
      <div>
        <h4 className="text-white font-medium mb-3">Active Accountability Partners</h4>
        <div className="space-y-3">
          {accountabilityPartners.map((partner) => (
            <div key={partner.id} className="flex flex-col md:flex-row md:items-center justify-between p-3 bg-gray-800 rounded-lg gap-3">
              <div className="flex items-center gap-3">
                <div className="text-2xl">{partner.avatar}</div>
                <div className="min-w-0">
                  <h5 className="text-white font-medium">{partner.name}</h5>
                  <div className="flex flex-wrap items-center gap-2 md:gap-4 text-sm text-gray-400">
                    <span className="capitalize">{partner.type}</span>
                    <span>{partner.activeCommitments} active commitments</span>
                    <span className="text-green-400">{partner.successRate}% success rate</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => handleComingSoonFeature('View Partner Details')}
                  className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                >
                  View Details
                </button>
                <button 
                  onClick={() => handleComingSoonFeature('Remove Partner')}
                  className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add New Partner */}
      <div className="border-t border-gray-800 pt-4">
        <h4 className="text-white font-medium mb-3">Add Accountability Partner</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <button 
            onClick={() => handleComingSoonFeature('Invite Friend as Partner')}
            className="p-4 bg-gray-800 hover:bg-gray-700 rounded-lg text-left transition-colors"
          >
            <div className="flex items-center gap-3 mb-2">
              <UserPlus className="w-5 h-5 text-blue-400" />
              <span className="text-white font-medium">Invite Friend</span>
            </div>
            <p className="text-sm text-gray-400">Ask a friend to be your accountability partner</p>
          </button>
          
          <button 
            onClick={() => handleComingSoonFeature('Join Team')}
            className="p-4 bg-gray-800 hover:bg-gray-700 rounded-lg text-left transition-colors"
          >
            <div className="flex items-center gap-3 mb-2">
              <Users className="w-5 h-5 text-purple-400" />
              <span className="text-white font-medium">Join Team</span>
            </div>
            <p className="text-sm text-gray-400">Get accountability from a goal team</p>
          </button>
          
          <button 
            onClick={() => handleComingSoonFeature('Public Commitment')}
            className="p-4 bg-gray-800 hover:bg-gray-700 rounded-lg text-left transition-colors"
          >
            <div className="flex items-center gap-3 mb-2">
              <Globe className="w-5 h-5 text-yellow-400" />
              <span className="text-white font-medium">Public Commitment</span>
            </div>
            <p className="text-sm text-gray-400">Share your goals publicly for social accountability</p>
          </button>
          
          <button 
            onClick={() => handleComingSoonFeature('AI Accountability')}
            className="p-4 bg-gray-800 hover:bg-gray-700 rounded-lg text-left transition-colors"
          >
            <div className="flex items-center gap-3 mb-2">
              <Zap className="w-5 h-5 text-green-400" />
              <span className="text-white font-medium">AI Accountability</span>
            </div>
            <p className="text-sm text-gray-400">Let Crushion be your AI accountability partner</p>
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-4 md:p-6 pb-20 md:pb-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">Settings</h1>
        <p className="text-gray-400">Customize your GoalCrusher experience</p>
        {import.meta.env.DEV && (
          <p className="text-xs text-gray-500 mt-1">Dev mode: v{APP_DATA_VERSION}</p>
        )}
      </div>

      {/* Save Status Indicator */}
      {saveStatus !== 'idle' && (
        <div className="mb-4">
          {saveStatus === 'saving' && (
            <div className="flex items-center gap-2 text-blue-400 text-sm">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Saving settings...</span>
            </div>
          )}
          {saveStatus === 'saved' && (
            <div className="flex items-center gap-2 text-green-400 text-sm">
              <CheckCircle className="w-4 h-4" />
              <span>Settings saved successfully!</span>
            </div>
          )}
          {saveStatus === 'error' && (
            <div className="flex items-center gap-2 text-red-400 text-sm">
              <AlertCircle className="w-4 h-4" />
              <span>Failed to save settings. Please try again.</span>
            </div>
          )}
        </div>
      )}

      {/* User Profile Card */}
      <div className="bg-gray-900 rounded-xl p-4 md:p-6 border border-gray-800 mb-6">
        <div className="flex flex-col md:flex-row items-center gap-4">
          <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center text-2xl">
            {user.avatar}
          </div>
          <div className="flex-1 text-center md:text-left">
            <h3 className="text-xl font-semibold text-white">{user.name}</h3>
            {gamificationEnabled && (
              <>
                <p className="text-gray-400">Level {user.level} • {user.xp?.toLocaleString()} XP</p>
                <p className="text-sm text-gray-500">Member since {user.joinDate.toLocaleDateString()}</p>
              </>
            )}
            {!gamificationEnabled && (
              <p className="text-gray-400">Member since {user.joinDate.toLocaleDateString()}</p>
            )}
          </div>
          <button 
            onClick={handleEditProfile}
            className="bg-yellow-400 text-black px-4 py-2 rounded-lg font-medium hover:bg-yellow-300 transition-colors"
          >
            Edit Profile
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex bg-gray-800 rounded-lg p-1 mb-6 overflow-x-auto">
        {(['settings', 'teams', 'friends', 'accountability', 'information'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 px-3 md:px-4 py-2 rounded-md text-sm font-medium capitalize transition-colors whitespace-nowrap ${
              activeTab === tab
                ? 'bg-yellow-400 text-black'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            {tab === 'accountability' ? 'Accountability' : tab}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'settings' && (
        <div className="space-y-6">
          {/* Gamification Disabled Warning */}
          {!gamificationEnabled && (
            <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-4 mb-6">
              <div className="flex items-start gap-3">
                <Trophy className="w-5 h-5 text-orange-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <h3 className="text-orange-400 font-medium mb-2">Gamification Disabled</h3>
                  <p className="text-gray-300 text-sm mb-3">
                    You've disabled gamification features. You can still access core functionality through these quick actions:
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    <button 
                      onClick={() => handleComingSoonFeature('View Goals')}
                      className="bg-gray-800 hover:bg-gray-700 text-white px-3 py-2 rounded text-sm transition-colors flex items-center gap-2"
                    >
                      <Target className="w-4 h-4" />
                      View Goals
                    </button>
                    <button 
                      onClick={() => handleComingSoonFeature('Schedule Tasks')}
                      className="bg-gray-800 hover:bg-gray-700 text-white px-3 py-2 rounded text-sm transition-colors flex items-center gap-2"
                    >
                      <Calendar className="w-4 h-4" />
                      Schedule Tasks
                    </button>
                    <button 
                      onClick={() => setActiveTab('teams')}
                      className="bg-gray-800 hover:bg-gray-700 text-white px-3 py-2 rounded text-sm transition-colors flex items-center gap-2"
                    >
                      <Users className="w-4 h-4" />
                      Manage Teams
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Settings Sections */}
          {settingSections.map((section) => {
            const SectionIcon = section.icon;
            return (
              <div key={section.title} className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
                <div className="p-4 border-b border-gray-800">
                  <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                    <SectionIcon className="w-5 h-5 text-yellow-400" />
                    {section.title}
                  </h3>
                </div>
                
                <div className="divide-y divide-gray-800">
                  {section.settings.map((setting, index) => {
                    const SettingIcon = setting.icon;
                    const isDisabled = setting.disabled;
                    
                    return (
                      <div key={index} className={`p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 transition-colors ${
                        isDisabled ? 'opacity-50' : 'hover:bg-gray-800/50'
                      }`}>
                        <div className="flex items-center gap-3 min-w-0">
                          <SettingIcon className={`w-5 h-5 flex-shrink-0 ${setting.danger ? 'text-red-400' : isDisabled ? 'text-gray-600' : 'text-gray-400'}`} />
                          <div className="min-w-0">
                            <p className={`font-medium ${setting.danger ? 'text-red-400' : isDisabled ? 'text-gray-500' : 'text-white'}`}>
                              {setting.label}
                            </p>
                            {setting.description && (
                              <p className="text-sm text-gray-400 mt-1">{setting.description}</p>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {setting.action === 'toggle' && (
                            <button
                              onClick={() => !isDisabled && setting.onChange && setting.onChange()}
                              disabled={isDisabled}
                              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                                isDisabled ? 'bg-gray-700 cursor-not-allowed' :
                                setting.enabled ? 'bg-yellow-400' : 'bg-gray-600'
                              }`}
                            >
                              <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                  setting.enabled ? 'translate-x-6' : 'translate-x-1'
                                }`}
                              />
                            </button>
                          )}
                          
                          {setting.action === 'select' && (
                            <select 
                              className="bg-gray-800 text-white px-3 py-1 rounded border border-gray-700 focus:border-yellow-400 focus:outline-none"
                              value={setting.value}
                              onChange={(e) => setting.onChange && setting.onChange(e.target.value)}
                            >
                              {setting.options ? setting.options.map((option: string) => (
                                <option key={option} value={option} className="capitalize">
                                  {option}
                                </option>
                              )) : (
                                <>
                                  <option value="daily">Daily</option>
                                  <option value="weekly">Weekly</option>
                                  <option value="never">Never</option>
                                </>
                              )}
                            </select>
                          )}
                          
                          {setting.action === 'navigate' && (
                            <button 
                              onClick={setting.onClick}
                              className="text-gray-400 hover:text-white transition-colors p-1"
                            >
                              <ChevronRight className="w-5 h-5" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {activeTab === 'teams' && <TeamsTab />}
      {activeTab === 'friends' && <FriendsTab />}
      {activeTab === 'accountability' && <AccountabilityTab />}
      {activeTab === 'information' && <InformationTab />}

      {/* Help Center Modal */}
      {showHelpCenter && (
        <HelpCenter 
          onStartTutorial={onStartTutorial}
          onClose={() => setShowHelpCenter(false)}
        />
      )}
    </div>
  );
};