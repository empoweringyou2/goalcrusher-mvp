import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Target, Trophy, BarChart3, Settings, Wand2, LogOut } from 'lucide-react';
import { Screen } from '../App';
import { User, AppConfig } from '../types/user';
import { UserSettings } from '../lib/taskUtils';
import { signOut } from '../lib/supabase';

interface NavigationProps {
  currentScreen: Screen;
  onNavigate: (screen: Screen) => void;
  user: User;
  appConfig: AppConfig;
  userSettings: UserSettings | null;
}

export const Navigation: React.FC<NavigationProps> = ({ 
  currentScreen, 
  onNavigate, 
  user, 
  appConfig, 
  userSettings 
}) => {
  const navigate = useNavigate();
  
  const navItems = [
    { id: 'dashboard', icon: Calendar, label: 'Dashboard', path: '/' },
    { id: 'goal-wizard', icon: Wand2, label: 'Goal Wizard', path: '/goal-wizard' },
    { id: 'gamification', icon: Trophy, label: 'Achievements', path: '/gamification' },
    { id: 'analytics', icon: BarChart3, label: 'Analytics', path: '/analytics' },
    { id: 'settings', icon: Settings, label: 'Settings', path: '/settings' },
  ];

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/', { replace: true });
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleNavigation = (item: any) => {
    onNavigate(item.id as Screen);
    navigate(item.path);
  };

  // Check if we should show the glow effect for Goal Wizard
  const shouldShowGlow = userSettings && !userSettings.has_created_first_goal;

  return (
    <>
      {/* Mobile Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800 z-50">
        <div className="flex">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentScreen === item.id;
            const isGoalWizard = item.id === 'goal-wizard';
            
            return (
              <button
                key={item.id}
                onClick={() => handleNavigation(item)}
                className={`flex-1 p-3 flex flex-col items-center gap-1 transition-colors relative ${
                  isActive 
                    ? 'text-yellow-400 bg-gray-800' 
                    : 'text-gray-400 hover:text-white'
                } ${isGoalWizard && shouldShowGlow ? 'glow-effect' : ''}`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-xs">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* Desktop Navigation */}
      <nav className="hidden md:block fixed left-0 top-0 bottom-0 w-64 bg-gray-900 border-r border-gray-800 p-6">
        <div className="mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-400 rounded-lg flex items-center justify-center">
              <Target className="w-6 h-6 text-black" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">GoalCrusher</h1>
              <p className="text-xs text-gray-400">Goal Achievement Platform</p>
            </div>
          </div>
        </div>

        <div className="space-y-2 mb-8">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentScreen === item.id;
            const isGoalWizard = item.id === 'goal-wizard';
            
            return (
              <button
                key={item.id}
                onClick={() => handleNavigation(item)}
                className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors relative ${
                  isActive 
                    ? 'bg-yellow-400 text-black font-semibold' 
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                } ${isGoalWizard && shouldShowGlow ? 'glow-effect' : ''}`}
              >
                <Icon className="w-5 h-5" />
                {item.label}
              </button>
            );
          })}
        </div>

        {/* Sign Out Button */}
        <div className="mb-8">
          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 p-3 rounded-lg text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </div>

        {/* User Profile */}
        <div className="absolute bottom-6 left-6 right-6">
          <div className="bg-gray-800 rounded-lg p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center text-lg">
                {user.avatar}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium truncate">{user.name}</p>
                <p className="text-gray-400 text-sm truncate">{user.email}</p>
              </div>
            </div>
            
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">Level {user.level}</span>
              <div className="flex items-center gap-2">
                <span className="text-sm text-yellow-400 font-semibold">{user.xp?.toLocaleString()} XP</span>
                {/* Removed beta badge - no more beta symbols */}
              </div>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-yellow-400 to-yellow-500 h-2 rounded-full transition-all duration-300" 
                style={{ width: '75%' }}
              ></div>
            </div>
            <p className="text-xs text-gray-400 mt-1">550 XP to next level</p>
            
            {/* Plan indicator - simplified without beta symbols */}
            <div className="mt-3 pt-3 border-t border-gray-700">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">Plan:</span>
                <span className={`text-xs font-medium ${
                  user.plan === 'pro' ? 'text-purple-400' : 'text-gray-300'
                }`}>
                  {user.plan === 'pro' ? '👑 Pro' : '🆓 Free'}
                </span>
              </div>
              {/* Removed beta access indicator */}
            </div>
          </div>
        </div>
      </nav>
    </>
  );
};