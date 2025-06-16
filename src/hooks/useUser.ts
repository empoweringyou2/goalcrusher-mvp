import { useState, useEffect } from 'react';
import { User, AppConfig } from '../types/user';

export const useUser = () => {
  const [user, setUser] = useState<User>({
    id: '1',
    name: 'Goal Crusher',
    email: 'user@goalcrusher.app',
    plan: 'free', // Default to free plan
    avatar: '🧙‍♂️',
    level: 12,
    xp: 2450,
    joinDate: new Date('2024-01-01')
  });

  const [appConfig, setAppConfig] = useState<AppConfig>({
    betaAccess: true, // Currently in beta - all features available
    version: '1.0.0-beta'
  });

  // Simulate user plan management
  const upgradeToPro = () => {
    setUser(prev => ({ ...prev, plan: 'pro' }));
  };

  const downgradeToFree = () => {
    setUser(prev => ({ ...prev, plan: 'free' }));
  };

  // Simulate beta ending
  const endBeta = () => {
    setAppConfig(prev => ({ ...prev, betaAccess: false }));
  };

  return {
    user,
    appConfig,
    upgradeToPro,
    downgradeToFree,
    endBeta,
    setUser,
    setAppConfig
  };
};