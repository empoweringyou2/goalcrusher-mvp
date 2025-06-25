import React, { useEffect, useState } from 'react';
import { CheckCircle, AlertCircle, Loader2, Mail, RefreshCw } from 'lucide-react';
import { supabase } from '../lib/supabase';

export const EmailVerificationHandler: React.FC = () => {
  const [status, setStatus] = useState<'verifying' | 'success' | 'error' | 'expired'>('verifying');
  const [message, setMessage] = useState('Verifying your email...');
  const [debugInfo, setDebugInfo] = useState<any>(null);

  useEffect(() => {
    const handleEmailVerification = async () => {
      try {
        setMessage('Processing email verification...');
        
        // Get URL parameters from both search and hash
        const urlParams = new URLSearchParams(window.location.search);
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        
        // Extract all possible auth parameters
        const accessToken = urlParams.get('access_token') || hashParams.get('access_token');
        const refreshToken = urlParams.get('refresh_token') || hashParams.get('refresh_token');
        const tokenType = urlParams.get('token_type') || hashParams.get('token_type');
        const type = urlParams.get('type') || hashParams.get('type');
        const code = urlParams.get('code') || hashParams.get('code');
        const error = urlParams.get('error') || hashParams.get('error');
        const errorDescription = urlParams.get('error_description') || hashParams.get('error_description');

        const allParams = {
          search: Object.fromEntries(urlParams),
          hash: Object.fromEntries(hashParams),
          extracted: { accessToken: !!accessToken, refreshToken: !!refreshToken, type, code: !!code, error }
        };

        console.log('Email verification parameters:', allParams);
        setDebugInfo(allParams);

        // Handle errors first
        if (error) {
          console.error('Verification error from URL:', error, errorDescription);
          setStatus('error');
          setMessage(`Verification failed: ${errorDescription || error}`);
          // Redirect to home after showing error
          setTimeout(() => {
            window.location.href = '/';
          }, 3000);
          return;
        }

        // Handle OAuth code exchange
        if (code) {
          setMessage('Exchanging verification code...');
          
          const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          
          if (exchangeError) {
            console.error('Code exchange error:', exchangeError);
            setStatus('error');
            setMessage('Failed to verify email. The verification link may be expired.');
            // Redirect to home after showing error
            setTimeout(() => {
              window.location.href = '/';
            }, 3000);
            return;
          }

          if (data.session) {
            console.log('Email verification successful via code exchange:', data.session.user.email);
            setStatus('success');
            setMessage('Email verified successfully! Welcome to GoalCrusher!');
            // Clean up URL and redirect to home
            setTimeout(() => {
              window.history.replaceState({}, '', '/');
              window.location.href = '/';
            }, 2000);
            return;
          }
        }

        // Handle direct token verification
        if (accessToken && refreshToken) {
          setMessage('Confirming email verification...');
          
          const { data, error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          });

          if (sessionError) {
            console.error('Session error:', sessionError);
            
            // Check if it's an expired token error
            if (sessionError.message.includes('expired') || sessionError.message.includes('invalid')) {
              setStatus('expired');
              setMessage('This verification link has expired. Please request a new verification email.');
            } else {
              setStatus('error');
              setMessage('Failed to verify email. Please try again or request a new verification link.');
            }
            // Redirect to home after showing error
            setTimeout(() => {
              window.location.href = '/';
            }, 3000);
            return;
          }

          if (data.session) {
            console.log('Email verification successful via token:', data.session.user.email);
            setStatus('success');
            setMessage('Email verified successfully! Your account is now active.');
            // Clean up URL and redirect to home
            setTimeout(() => {
              window.history.replaceState({}, '', '/');
              window.location.href = '/';
            }, 2000);
            return;
          }
        }

        // Handle signup confirmation type
        if (type === 'signup' || type === 'email_confirmation') {
          setMessage('Confirming email address...');
          
          // Check if we already have a session
          const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
          
          if (sessionError) {
            console.error('Session check error:', sessionError);
            setStatus('error');
            setMessage('Failed to confirm email. Please try signing in again.');
            // Redirect to home after showing error
            setTimeout(() => {
              window.location.href = '/';
            }, 3000);
            return;
          }

          if (sessionData.session) {
            console.log('Email confirmation successful:', sessionData.session.user.email);
            setStatus('success');
            setMessage('Email confirmed successfully! Your account is ready.');
            // Clean up URL and redirect to home
            setTimeout(() => {
              window.history.replaceState({}, '', '/');
              window.location.href = '/';
            }, 2000);
            return;
          }
        }

        // If we get here, no valid verification parameters were found
        console.warn('No valid verification parameters found');
        setStatus('error');
        setMessage('Invalid verification link. Please check your email for a valid confirmation link.');
        // Redirect to home after showing error
        setTimeout(() => {
          window.location.href = '/';
        }, 3000);

      } catch (err) {
        console.error('Verification error:', err);
        setStatus('error');
        setMessage('An unexpected error occurred during verification.');
        // Redirect to home after showing error
        setTimeout(() => {
          window.location.href = '/';
        }, 3000);
      }
    };

    handleEmailVerification();
  }, []);

  const handleManualRedirect = () => {
    window.location.href = '/';
  };

  const handleRetry = () => {
    setStatus('verifying');
    setMessage('Retrying verification...');
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
      <div className="text-center max-w-md mx-auto">
        {status === 'verifying' && (
          <>
            <Loader2 className="w-16 h-16 animate-spin text-yellow-400 mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-white mb-4">Verifying Email</h2>
            <p className="text-gray-400 mb-6">{message}</p>
            <div className="bg-gray-900 rounded-lg p-4 border border-gray-800">
              <p className="text-sm text-gray-500">
                This may take a few moments. Please don't close this window.
              </p>
            </div>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-white mb-4">Email Verified!</h2>
            <p className="text-gray-400 mb-6">{message}</p>
            
            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 mb-6">
              <p className="text-green-400 text-sm mb-2">
                🎉 Welcome to GoalCrusher! Your account is now active.
              </p>
              <p className="text-gray-400 text-xs">
                Redirecting to dashboard...
              </p>
            </div>

            <button
              onClick={handleManualRedirect}
              className="bg-yellow-400 text-black px-6 py-3 rounded-lg font-semibold hover:bg-yellow-300 transition-colors"
            >
              Continue to Dashboard
            </button>
          </>
        )}

        {status === 'error' && (
          <>
            <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-white mb-4">Verification Failed</h2>
            <p className="text-gray-400 mb-6">{message}</p>
            
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-6">
              <h3 className="text-red-400 font-medium mb-2">What you can try:</h3>
              <ul className="text-gray-400 text-sm space-y-1 text-left">
                <li>• Check if you've already verified this email</li>
                <li>• Look for a newer verification email in your inbox</li>
                <li>• Check your spam/junk folder</li>
                <li>• Try signing in if you've already verified</li>
                <li>• Request a new verification email from the login page</li>
              </ul>
            </div>

            <div className="space-y-3">
              <button
                onClick={handleManualRedirect}
                className="w-full bg-yellow-400 text-black px-6 py-3 rounded-lg font-semibold hover:bg-yellow-300 transition-colors"
              >
                Back to Login
              </button>
              
              <button
                onClick={handleRetry}
                className="w-full bg-gray-800 text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-700 transition-colors border border-gray-700 flex items-center gap-2 justify-center"
              >
                <RefreshCw className="w-4 h-4" />
                Try Again
              </button>
            </div>
          </>
        )}

        {status === 'expired' && (
          <>
            <Mail className="w-16 h-16 text-orange-400 mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-white mb-4">Link Expired</h2>
            <p className="text-gray-400 mb-6">This verification link has expired. Please request a new one from the login page.</p>
            
            <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-4 mb-6">
              <p className="text-orange-400 text-sm">
                📧 Verification links expire for security. You can request a new one by trying to sign in again.
              </p>
            </div>
            
            <button
              onClick={handleManualRedirect}
              className="bg-yellow-400 text-black px-6 py-3 rounded-lg font-semibold hover:bg-yellow-300 transition-colors"
            >
              Request New Link
            </button>
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