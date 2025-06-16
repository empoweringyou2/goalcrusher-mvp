import React, { useEffect, useState } from 'react';
import { Loader2, AlertCircle, CheckCircle, ArrowLeft } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface AuthCallbackProps {
  onSuccess: () => void;
  onError: (error: string) => void;
}

export const AuthCallback: React.FC<AuthCallbackProps> = ({ onSuccess, onError }) => {
  const [statusMessage, setStatusMessage] = useState('Processing authentication...');
  const [isError, setIsError] = useState(false);
  const [debugInfo, setDebugInfo] = useState<any>(null);

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        setStatusMessage('Checking URL parameters...');
        
        // Log the current URL for debugging
        const currentUrl = window.location.href;
        console.log('Current URL:', currentUrl);
        setDebugInfo(prev => ({ ...prev, currentUrl }));

        // Check for URL fragments (hash parameters)
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const searchParams = new URLSearchParams(window.location.search);
        
        console.log('Hash params:', Object.fromEntries(hashParams));
        console.log('Search params:', Object.fromEntries(searchParams));
        setDebugInfo(prev => ({ 
          ...prev, 
          hashParams: Object.fromEntries(hashParams),
          searchParams: Object.fromEntries(searchParams)
        }));

        setStatusMessage('Retrieving session from Supabase...');
        
        const { data, error } = await supabase.auth.getSession();
        
        console.log('Session data:', data);
        console.log('Session error:', error);
        setDebugInfo(prev => ({ 
          ...prev, 
          sessionData: data,
          sessionError: error
        }));
        
        if (error) {
          console.error('Auth callback error:', error);
          setIsError(true);
          setStatusMessage(`Authentication error: ${error.message}`);
          onError(error.message);
          return;
        }

        if (data.session) {
          setStatusMessage('Authentication successful! Redirecting...');
          console.log('Session found, calling onSuccess');
          setTimeout(() => {
            onSuccess();
          }, 1000);
        } else {
          setIsError(true);
          setStatusMessage('No session found. This might be because:');
          onError('No session found after authentication');
        }
      } catch (err) {
        console.error('Unexpected error in auth callback:', err);
        setIsError(true);
        setStatusMessage(`Unexpected error: ${err instanceof Error ? err.message : 'Unknown error'}`);
        setDebugInfo(prev => ({ ...prev, unexpectedError: err }));
        onError('An unexpected error occurred');
      }
    };

    handleAuthCallback();
  }, [onSuccess, onError]);

  const handleGoBack = () => {
    window.history.replaceState({}, '', '/');
    onError('User cancelled authentication');
  };

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        {!isError ? (
          <>
            <Loader2 className="w-12 h-12 animate-spin text-yellow-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Completing sign in...</h2>
            <p className="text-gray-400 mb-4">{statusMessage}</p>
          </>
        ) : (
          <>
            <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2 text-red-400">Authentication Issue</h2>
            <p className="text-gray-300 mb-4">{statusMessage}</p>
            
            {statusMessage.includes('No session found') && (
              <div className="text-left bg-gray-900 p-4 rounded-lg mb-4 text-sm">
                <p className="text-gray-400 mb-2">Possible reasons:</p>
                <ul className="text-gray-300 space-y-1 text-xs">
                  <li>• The email confirmation link has expired</li>
                  <li>• You've already used this confirmation link</li>
                  <li>• There's a mismatch in the redirect URL configuration</li>
                  <li>• The email confirmation process hasn't completed yet</li>
                </ul>
              </div>
            )}
            
            <button
              onClick={handleGoBack}
              className="bg-yellow-400 text-black px-6 py-2 rounded-lg font-semibold hover:bg-yellow-300 transition-colors flex items-center gap-2 mx-auto"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Login
            </button>
          </>
        )}
        
        {/* Debug Information (only in development) */}
        {import.meta.env.DEV && debugInfo && (
          <details className="mt-6 text-left">
            <summary className="text-gray-400 text-sm cursor-pointer hover:text-white">
              Debug Information (Dev Only)
            </summary>
            <pre className="text-xs text-gray-500 bg-gray-900 p-3 rounded mt-2 overflow-auto max-h-40">
              {JSON.stringify(debugInfo, null, 2)}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
};