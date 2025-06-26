import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle, AlertCircle, Loader2, RefreshCw } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';

export const EmailVerificationHandler: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isAuthenticated, user, loading } = useAuth();
  const [status, setStatus] = useState<'verifying' | 'success' | 'error' | 'waiting-for-auth'>('verifying');
  const [message, setMessage] = useState('Verifying your email...');

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        setMessage('Processing email verification...');
        
        // Extract the verification code from URL
        const code = searchParams.get('code');
        
        console.log('[EmailVerification] URL params:', Object.fromEntries(searchParams));
        console.log('[EmailVerification] Verification code found:', !!code);

        if (!code) {
          console.error('[EmailVerification] Missing verification code in URL');
          setStatus('error');
          setMessage('Missing verification code. Please check your email for a valid confirmation link.');
          return;
        }

        setMessage('Exchanging verification code...');
        console.log('[EmailVerification] Attempting to exchange code for session...');
        
        // Exchange the code for a session
        const { data, error } = await supabase.auth.exchangeCodeForSession(code);
        console.log('[Exchange Result]', data, error);
        
        if (error) {
          console.error('[EmailVerification] Verification failed:', error.message);
          setStatus('error');
          
          // Check if it's an expired token error
          if (error.message.includes('expired') || error.message.includes('invalid')) {
            setMessage('This verification link has expired. Please request a new verification email.');
          } else {
            setMessage('Verification failed. Please try again or request a new verification link.');
          }
          return;
        }

        if (data.session) {
          console.log('[EmailVerification] Session established:', data.session.user.email);
          
          // Check session immediately after exchange
          const sessionResponse = await supabase.auth.getSession();
          console.log('[Post-Exchange Session]', sessionResponse.data.session);
          
          // Check localStorage directly
          const storedToken = localStorage.getItem('supabase.auth.token');
          console.log('[Local Storage Token]', !!storedToken);
          
          setStatus('waiting-for-auth');
          setMessage('Email verified! Setting up your account...');
          
        } else {
          console.error('[EmailVerification] No session returned after code exchange');
          setStatus('error');
          setMessage('Verification completed but no session was created. Please try signing in manually.');
        }

      } catch (err: any) {
        console.error('[EmailVerification] Unexpected error:', err.message);
        setStatus('error');
        setMessage('Something went wrong during verification. Please try again.');
      }
    };

    verifyEmail();
  }, [searchParams]);

  // Monitor authentication state and redirect when ready
  useEffect(() => {
    console.log('[EmailVerification] Auth state check:', {
      status,
      isAuthenticated,
      user: !!user,
      loading
    });

    // Only proceed if we're waiting for auth and the user is now authenticated
    if (status === 'waiting-for-auth' && isAuthenticated && user && !loading) {
      console.log('[EmailVerification] Authentication confirmed, transitioning to success');
      setStatus('success');
      setMessage('Welcome to GoalCrusher! Redirecting to your dashboard...');
      
      // Final check of localStorage before redirect
      const storedToken = localStorage.getItem('supabase.auth.token');
      console.log('[Pre-Redirect Token Check]', !!storedToken);
      
      // Short delay to ensure UI updates, then redirect
      setTimeout(() => {
        console.log('[EmailVerification] Redirecting to dashboard...');
        navigate('/', { replace: true });
      }, 1500);
    }
  }, [status, isAuthenticated, user, loading, navigate]);

  const handleManualRedirect = () => {
    console.log('[EmailVerification] Manual redirect triggered');
    navigate('/', { replace: true });
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

        {status === 'waiting-for-auth' && (
          <>
            <Loader2 className="w-16 h-16 animate-spin text-blue-400 mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-white mb-4">Almost Ready!</h2>
            <p className="text-gray-400 mb-6">{message}</p>
            
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 mb-6">
              <p className="text-blue-400 text-sm mb-2">
                ✅ Email verification successful!
              </p>
              <p className="text-gray-400 text-xs">
                Setting up your account and preparing your dashboard...
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

        {status === 'success' && (
          <>
            <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-white mb-4">Welcome to GoalCrusher!</h2>
            <p className="text-gray-400 mb-6">{message}</p>
            
            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 mb-6">
              <p className="text-green-400 text-sm mb-2">
                🎉 Your account is now active and ready to use!
              </p>
              <p className="text-gray-400 text-xs">
                You'll be redirected automatically, or click below to continue.
              </p>
            </div>

            <button
              onClick={handleManualRedirect}
              className="bg-yellow-400 text-black px-6 py-3 rounded-lg font-semibold hover:bg-yellow-300 transition-colors"
            >
              Enter GoalCrusher
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