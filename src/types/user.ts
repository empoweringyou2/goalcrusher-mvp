export interface User {
  id: string;
  name: string;
  email: string;
  plan: 'free' | 'pro';
  avatar?: string;
  level?: number;
  xp?: number;
  joinDate: Date;
}

export interface AppConfig {
  betaAccess: boolean;
  version: string;
}

export const isProFeatureAvailable = (userPlan: 'free' | 'pro', betaAccess: boolean): boolean => {
  return userPlan === 'pro' || betaAccess === true;
};