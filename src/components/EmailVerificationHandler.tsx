import React, { useEffect, useState } from 'react';
import { CheckCircle, AlertCircle, Loader2, Mail, RefreshCw } from 'lucide-react';
import { supabase } from '../lib/supabase';

export const EmailVerificationHandler: React.FC = () => {
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [message, setMessage] = useState('Verifying your email...');

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        setMessage('Processing email verification...');
        
        // Extract the verification code from URL
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        
        console.log('[EmailVerification] URL params:', Object.fromEntries(urlParams));
        console.log('[EmailVerification] Verification code found:', !!code);

        if (!code) {
          console.error('[EmailVerification] Missing verification code in URL');
          setStatus('error');
          setMessage('Missing verification code. Please check your email for a valid confirmation link.');
          // Redirect to home after showing error
          setTimeout(() => {
            window.location.href = '/';
          }, 3000);
          return;
        }

        setMessage('Exchanging verification code...');
        console.log('[EmailVerification] Attempting to exchange code for session...');
        
        const { data, error } = await supabase.auth.exchangeCodeForSession(code);
        
        if (error) {
          console.error('[EmailVerification] Verification failed:', error.message);
          setStatus('error');
          
          // Check if it's an expired token error
          if (error.message.includes('expired') || error.message.includes('invalid')) {
            setMessage('This verification link has expired. Please request a new verification email.');
          } else {
            setMessage('Verification failed. Please try again or request a new verification link.');
          }
          
          // Redirect to home after showing error
          setTimeout(() => {
            window.location.href = '/';
          }, 3000);
          return;
        }

        if (data.session) {
          console.log('[EmailVerification] Email verification successful:', data.session.user.email);
          setStatus('success');
          setMessage('Email verified successfully! Welcome to GoalCrusher!');
          
          // Clean up URL and redirect to dashboard
          setTimeout(() => {
            window.history.replaceState({}, '', '/');
            window.location.href = '/';
          }, 2000);
        } else {
          console.error('[EmailVerification] No session returned after code exchange');
          setStatus('error');
          setMessage('Verification completed but no session was created. Please try signing in manually.');
          
          // Redirect to home after showing error
          setTimeout(() => {
            window.location.href = '/';
          }, 3000);
        }

      } catch (err: any) {
        console.error('[EmailVerification] Unexpected error:', err.message);
        setStatus('error');
        setMessage('Something went wrong during verification. Please try again.');
        
        // Redirect to home after showing error
        setTimeout(() => {
          window.location.href = '/';
        }, 3000);
      }
    };

    verifyEmail();
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
      </div>
    </div>
  );
};