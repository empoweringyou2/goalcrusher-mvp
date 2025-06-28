import React from 'react';

interface DebugOverlayProps {
  loading: boolean;
  isAuthenticated: boolean;
  userId?: string;
  authReady: boolean;
  session?: any;
}

export const DebugOverlay: React.FC<DebugOverlayProps> = ({
  loading,
  isAuthenticated,
  userId,
  authReady,
  session
}) => {
  // Only show in development mode
  if (!import.meta.env.DEV) {
    return null;
  }

  return (
    <div className="fixed top-2 left-2 bg-gray-900 text-white text-xs p-3 rounded-md z-50 border border-gray-700 shadow-lg max-w-xs">
      <div className="font-bold text-yellow-400 mb-2">🔧 Auth Debug</div>
      <div className="space-y-1">
        <div className="flex justify-between">
          <span className="text-gray-400">Loading:</span>
          <span className={loading ? 'text-yellow-400' : 'text-green-400'}>
            {loading ? 'true' : 'false'}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Authenticated:</span>
          <span className={isAuthenticated ? 'text-green-400' : 'text-red-400'}>
            {isAuthenticated ? 'true' : 'false'}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Auth Ready:</span>
          <span className={authReady ? 'text-green-400' : 'text-yellow-400'}>
            {authReady ? 'true' : 'false'}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">User ID:</span>
          <span className="text-blue-400 truncate ml-2" title={userId}>
            {userId ? userId.substring(0, 8) + '...' : 'null'}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Session:</span>
          <span className={session ? 'text-green-400' : 'text-red-400'}>
            {session ? 'exists' : 'null'}
          </span>
        </div>
        <div className="text-gray-500 text-[10px] mt-2 pt-2 border-t border-gray-700">
          Dev Mode Only
        </div>
      </div>
    </div>
  );
};