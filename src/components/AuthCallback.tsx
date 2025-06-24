import React, { useEffect, useState } from 'react';
import { Loader2, AlertCircle, CheckCircle, ArrowLeft, Mail } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface AuthCallbackProps {
  onSuccess: () => void;
  onError: (error: string) => void;
}

export const AuthCallback: React.FC<AuthCallbackProps> = ({ onSuccess, onError }) => {
  const [statusMessage, setStatusMessage] = useState('Processing authentication...');
  const [isError, setIsError] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        setStatusMessage('Checking authentication parameters...');
        
        // Get URL parameters from both search and hash
        const urlParams = new URLSearchParams(window.location.search);
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        
        // Log for debugging
        const currentUrl = window.location.href;
        console.log('Auth callback URL:', currentUrl);
        
        const allParams = {
          search: Object.fromEntries(urlParams),
          hash: Object.fromEntries(hashParams)
        };
        
        console.log('Auth callback parameters:', allParams);
        setDebugInfo(prev => ({ ...prev, currentUrl, allParams }));

        // Check for OAuth callback parameters
        const code = urlParams.get('code') || hashParams.get('code');
        const accessToken = urlParams.get('access_token') || hashParams.get('access_token');
        const refreshToken = urlParams.get('refresh_token') || hashParams.get('refresh_token');
        const error = urlParams.get('error') || hashParams.get('error');
        const errorDescription = urlParams.get('error_description') || hashParams.get('error_description');
        const type = urlParams.get('type') || hashParams.get('type');

        // Handle OAuth errors
        if (error) {
          console.error('OAuth error:', error, errorDescription);
          setIsError(true);
          setStatusMessage(`Authentication failed: ${errorDescription || error}`);
          onError(errorDescription || error);
          return;
        }

        // Handle email verification
        if (type === 'signup' || type === 'email_confirmation' || accessToken) {
          setStatusMessage('Verifying email confirmation...');
          
          if (accessToken && refreshToken) {
            // Set session with tokens
            const { data, error: sessionError } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken
            });

            if (sessionError) {
              console.error('Session error:', sessionError);
              setIsError(true);
              setStatusMessage(`Email verification failed: ${sessionError.message}`);
              onError(sessionError.message);
              return;
            }

            if (data.session) {
              console.log('Email verified successfully for:', data.session.user.email);
              setIsSuccess(true);
              setStatusMessage('Email verified successfully! Welcome to GoalCrusher!');
              
              // Start countdown
              const timer = setInterval(() => {
                setCountdown(prev => {
                  if (prev <= 1) {
                    clearInterval(timer);
                    onSuccess();
                    return 0;
                  }
                  return prev - 1;
                });
              }, 1000);

              return;
            }
          }
        }

        // Handle OAuth code exchange
        if (code) {
          setStatusMessage('Exchanging authorization code...');
          
          const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          
          if (exchangeError) {
            console.error('Code exchange error:', exchangeError);
            setIsError(true);
            setStatusMessage(`Authentication failed: ${exchangeError.message}`);
            onError(exchangeError.message);
            return;
          }

          if (data.session) {
            console.log('OAuth authentication successful for:', data.session.user.email);
            setIsSuccess(true);
            setStatusMessage('Authentication successful! Redirecting...');
            
            setTimeout(() => {
              onSuccess();
            }, 1000);
            return;
          }
        }

        // Check current session as fallback
        setStatusMessage('Checking current session...');
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        
        console.log('Current session check:', sessionData, sessionError);
        setDebugInfo(prev => ({ 
          ...prev, 
          sessionData,
          sessionError
        }));
        
        if (sessionError) {
          console.error('Session check error:', sessionError);
          setIsError(true);
          setStatusMessage(`Session error: ${sessionError.message}`);
          onError(sessionError.message);
          return;
        }

        if (sessionData.session) {
          setIsSuccess(true);
          setStatusMessage('Authentication successful! Redirecting...');
          setTimeout(() => {
            onSuccess();
          }, 1000);
        } else {
          setIsError(true);
          setStatusMessage('No valid session found. Please try signing in again.');
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

  const handleManualContinue = () => {
    if (isSuccess) {
      onSuccess();
    } else {
      handleGoBack();
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        {!isError && !isSuccess && (
          <>
            <Loader2 className="w-12 h-12 animate-spin text-yellow-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Completing authentication...</h2>
            <p className="text-gray-400 mb-4">{statusMessage}</p>
            <div className="bg-gray-900 rounded-lg p-3 border border-gray-800">
              <p className="text-xs text-gray-500">
                Please wait while we complete your authentication...
              </p>
            </div>
          </>
        )}

        {isSuccess && (
          <>
            <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2 text-green-400">Authentication Successful!</h2>
            <p className="text-gray-300 mb-4">{statusMessage}</p>
            
            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 mb-4">
              <p className="text-green-400 text-sm mb-2">
                🎉 Welcome to GoalCrusher! Your account is ready.
              </p>
              <p className="text-gray-400 text-xs">
                Redirecting in {countdown} second{countdown !== 1 ? 's' : ''}...
              </p>
            </div>

            <button
              onClick={handleManualContinue}
              className="bg-yellow-400 text-black px-6 py-2 rounded-lg font-semibold hover:bg-yellow-300 transition-colors"
            >
              Continue to Dashboard
            </button>
          </>
        )}

        {isError && (
          <>
            <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2 text-red-400">Authentication Issue</h2>
            <p className="text-gray-300 mb-4">{statusMessage}</p>
            
            <div className="text-left bg-gray-900 p-4 rounded-lg mb-4 text-sm border border-gray-800">
              <p className="text-gray-400 mb-2">Possible solutions:</p>
              <ul className="text-gray-300 space-y-1 text-xs">
                <li>• Try signing in again from the main page</li>
                <li>• Check if you need to verify your email first</li>
                <li>• Clear your browser cache and cookies</li>
                <li>• Make sure you're using the latest verification link</li>
              </ul>
            </div>
            
            <div className="space-y-3">
              <button
                onClick={handleGoBack}
                className="w-full bg-yellow-400 text-black px-6 py-2 rounded-lg font-semibold hover:bg-yellow-300 transition-colors flex items-center gap-2 justify-center"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Login
              </button>
              
              <button
                onClick={() => window.location.reload()}
                className="w-full bg-gray-800 text-white px-6 py-2 rounded-lg font-medium hover:bg-gray-700 transition-colors border border-gray-700"
              >
                Try Again
              </button>
            </div>
          </>
        )}
        
        {/* Debug Information (only in development) */}
        {import.meta.env.DEV && debugInfo && (
          <details className="mt-6 text-left">
            <summary className="text-gray-400 text-sm cursor-pointer hover:text-white">
              Debug Information (Dev Only)
            </summary>
            <pre className="text-xs text-gray-500 bg-gray-900 p-3 rounded mt-2 overflow-auto max-h-40 border border-gray-800">
              {JSON.stringify(debugInfo, null, 2)}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
};