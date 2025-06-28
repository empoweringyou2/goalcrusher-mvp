import React from 'react';
import { Crown, Sparkles, Lock, Zap, Unlock } from 'lucide-react';

interface ProFeatureGateProps {
  isProFeature: boolean;
  userPlan: 'free' | 'pro';
  betaAccess: boolean;
  children: React.ReactNode;
  featureName: string;
  description?: string;
  showUpgradePrompt?: boolean;
  className?: string;
}

export const ProFeatureGate: React.FC<ProFeatureGateProps> = ({
  isProFeature,
  userPlan,
  betaAccess,
  children,
  featureName,
  description,
  showUpgradePrompt = true,
  className = ''
}) => {
  const hasAccess = !isProFeature || userPlan === 'pro' || betaAccess;

  if (hasAccess) {
    return (
      <div className={`relative ${className}`}>
        {children}
        {/* Removed ProBadge - no more beta symbols */}
      </div>
    );
  }

  if (!showUpgradePrompt) {
    return (
      <div className={`relative opacity-50 pointer-events-none ${className}`}>
        {children}
        <div className="absolute inset-0 bg-gray-900/80 flex items-center justify-center rounded-lg">
          <div className="text-center">
            <Lock className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-400 font-medium">Pro Feature</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <div className="opacity-30 pointer-events-none">
        {children}
      </div>
      <div className="absolute inset-0 bg-gradient-to-br from-purple-900/90 to-blue-900/90 flex items-center justify-center rounded-lg border-2 border-purple-500/50">
        <div className="text-center p-4">
          <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-3">
            <Crown className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-white font-bold mb-2">{featureName}</h3>
          {description && (
            <p className="text-gray-300 text-sm mb-3">{description}</p>
          )}
          <button className="bg-gradient-to-r from-yellow-400 to-purple-600 text-white px-6 py-2 rounded-lg font-bold hover:from-yellow-300 hover:to-purple-500 transition-all transform hover:scale-105 flex items-center gap-2 mx-auto">
            <Crown className="w-4 h-4" />
            Upgrade to Pro
          </button>
          <p className="text-xs text-gray-400 mt-2">
            Free during beta • Unlock after launch
          </p>
        </div>
      </div>
    </div>
  );
};

// Removed ProBadge component entirely - no more beta symbols

export const ProTooltip: React.FC<{ featureName: string; children: React.ReactNode }> = ({ featureName, children }) => (
  <div className="group relative">
    {children}
    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
      <div className="bg-gray-900 text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap border border-gray-700 shadow-lg">
        <div className="flex items-center gap-2">
          <Crown className="w-3 h-3 text-yellow-400" />
          <span>{featureName} - Pro Feature</span>
        </div>
        <div className="text-gray-400 text-xs mt-1">Free during beta</div>
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
      </div>
    </div>
  </div>
);