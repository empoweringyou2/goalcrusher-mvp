import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle, AlertCircle, Loader2, RefreshCw, Info, ExternalLink } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';

export const EmailVerificationHandler: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isAuthenticated, user, loading } = useAuth();
  const [status, setStatus] = useState<'verifying' | 'success' | 'error' | 'waiting-for-auth'>('verifying');
  const [message, setMessage] = useState('Verifying your email...');
  const [errorDetails, setErrorDetails] = useState<{
    type: string;
    description: string;
    code?: string;
    suggestions: string[];
  } | null>(null);

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        setMessage('Processing email verification...');
        
        // First, check for any error parameters in the URL
        const error = searchParams.get('error');
        const errorCode = searchParams.get('error_code');
        const errorDescription = searchParams.get('error_description');
        
        console.log('[EmailVerification] URL params:', Object.fromEntries(searchParams));
        
        // If there's an error parameter, handle it immediately
        if (error) {
          console.error('[EmailVerification] Error parameter found:', {
            error,
            errorCode,
            errorDescription
          });
          
          setStatus('error');
          
          // Parse common Supabase auth errors
          let errorType = 'Unknown Error';
          let description = errorDescription || 'An unknown error occurred during verification.';
          let suggestions: string[] = [];
          
          switch (error) {
            case 'access_denied':
              errorType = 'Access Denied';
              description = 'The verification link was rejected by the authentication server.';
              suggestions = [
                'The verification link may have expired (links expire after 24 hours)',
                'The link may have already been used',
                'The link may be malformed or corrupted',
                'Try requesting a new verification email'
              ];
              break;
              
            case 'invalid_request':
              errorType = 'Invalid Request';
              description = 'The verification request was not properly formatted.';
              suggestions = [
                'The verification link may be corrupted',
                'Try copying and pasting the full link from your email',
                'Request a new verification email'
              ];
              break;
              
            case 'server_error':
              errorType = 'Server Error';
              description = 'There was a problem with the authentication server.';
              suggestions = [
                'This is a temporary server issue',
                'Try again in a few minutes',
                'If the problem persists, contact support'
              ];
              break;
              
            case 'temporarily_unavailable':
              errorType = 'Service Temporarily Unavailable';
              description = 'The authentication service is temporarily unavailable.';
              suggestions = [
                'Wait a few minutes and try again',
                'Check if there are any service outages',
                'Try again later'
              ];
              break;
              
            default:
              errorType = `Authentication Error (${error})`;
              description = errorDescription || `An error occurred: ${error}`;
              suggestions = [
                'Try requesting a new verification email',
                'Check your email for a more recent verification link',
                'Contact support if the problem persists'
              ];
          }
          
          setErrorDetails({
            type: errorType,
            description,
            code: errorCode || error,
            suggestions
          });
          
          setMessage(`${errorType}: ${description}`);
          return;
        }
        
        // Extract the verification code from URL
        const code = searchParams.get('code');
        
        console.log('[EmailVerification] Verification code found:', !!code);

        if (!code) {
          console.error('[EmailVerification] Missing verification code in URL');
          setStatus('error');
          setErrorDetails({
            type: 'Missing Verification Code',
            description: 'No verification code was found in the URL.',
            suggestions: [
              'Make sure you clicked the complete link from your email',
              'Check if the email link was truncated or broken',
              'Try copying and pasting the full URL from your email',
              'Request a new verification email if the link is incomplete'
            ]
          });
          setMessage('Missing verification code. Please check your email for a valid confirmation link.');
          return;
        }

        setMessage('Exchanging verification code...');
        console.log('[EmailVerification] Attempting to exchange code for session...');
        
        // Exchange the code for a session
        const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
        console.log('[Exchange Result]', data, exchangeError);
        
        if (exchangeError) {
          console.error('[EmailVerification] Verification failed:', exchangeError.message);
          setStatus('error');
          
          // Parse exchange errors
          let errorType = 'Verification Failed';
          let description = exchangeError.message;
          let suggestions: string[] = [];
          
          if (exchangeError.message.includes('expired')) {
            errorType = 'Verification Link Expired';
            description = 'This verification link has expired.';
            suggestions = [
              'Verification links expire after 24 hours',
              'Request a new verification email',
              'Check your email for a more recent verification link'
            ];
          } else if (exchangeError.message.includes('invalid')) {
            errorType = 'Invalid Verification Code';
            description = 'The verification code is invalid or has already been used.';
            suggestions = [
              'The verification link may have already been used',
              'Try signing in if you\'ve already verified your email',
              'Request a new verification email if needed'
            ];
          } else if (exchangeError.message.includes('not found')) {
            errorType = 'Verification Code Not Found';
            description = 'The verification code was not found in the system.';
            suggestions = [
              'The verification link may be too old',
              'Request a new verification email',
              'Make sure you\'re using the most recent verification link'
            ];
          } else {
            suggestions = [
              'Try requesting a new verification email',
              'Check your spam/junk folder for a more recent email',
              'Contact support if the problem persists'
            ];
          }
          
          setErrorDetails({
            type: errorType,
            description,
            suggestions
          });
          
          setMessage(`${errorType}: ${description}`);
          return;
        }

        if (data.session) {
          console.log('[EmailVerification] Session established:', data.session.user.email);
          
          // Check session immediately after exchange
          const sessionResponse = await supabase.auth.getSession();
          console.log('[Post-Exchange Session]', sessionResponse.data.session);
          
          setStatus('waiting-for-auth');
          setMessage('Email verified! Setting up your account...');
          
        } else {
          console.error('[EmailVerification] No session returned after code exchange');
          setStatus('error');
          setErrorDetails({
            type: 'Session Creation Failed',
            description: 'Email verification succeeded but no user session was created.',
            suggestions: [
              'Try signing in manually with your email and password',
              'Clear your browser cache and cookies',
              'Try again in an incognito/private browser window',
              'Contact support if the problem persists'
            ]
          });
          setMessage('Verification completed but no session was created. Please try signing in manually.');
        }

      } catch (err: any) {
        console.error('[EmailVerification] Unexpected error:', err.message);
        setStatus('error');
        setErrorDetails({
          type: 'Unexpected Error',
          description: err.message || 'An unexpected error occurred during verification.',
          suggestions: [
            'Try refreshing the page',
            'Check your internet connection',
            'Try again in a few minutes',
            'Contact support if the problem persists'
          ]
        });
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
    setErrorDetails(null);
    window.location.reload();
  };

  const handleRequestNewEmail = () => {
    navigate('/', { replace: true });
  };

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
      <div className="text-center max-w-lg mx-auto">
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
            
            {/* Detailed Error Information */}
            {errorDetails && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-6 text-left">
                <div className="flex items-start gap-3 mb-4">
                  <Info className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="text-red-400 font-medium mb-1">{errorDetails.type}</h3>
                    <p className="text-gray-300 text-sm mb-2">{errorDetails.description}</p>
                    {errorDetails.code && (
                      <p className="text-gray-500 text-xs font-mono">Error Code: {errorDetails.code}</p>
                    )}
                  </div>
                </div>
                
                <div className="border-t border-red-500/20 pt-3">
                  <h4 className="text-red-400 font-medium mb-2 text-sm">What you can try:</h4>
                  <ul className="text-gray-400 text-sm space-y-1">
                    {errorDetails.suggestions.map((suggestion, index) => (
                      <li key={index}>• {suggestion}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* Debug Information */}
            <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4 mb-6 text-left">
              <h4 className="text-gray-300 font-medium mb-2 text-sm flex items-center gap-2">
                <Info className="w-4 h-4" />
                Debug Information
              </h4>
              <div className="text-xs text-gray-500 space-y-1">
                <p>URL: {window.location.href}</p>
                <p>Parameters: {JSON.stringify(Object.fromEntries(searchParams))}</p>
                <p>Timestamp: {new Date().toISOString()}</p>
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={handleRequestNewEmail}
                className="w-full bg-yellow-400 text-black px-6 py-3 rounded-lg font-semibold hover:bg-yellow-300 transition-colors"
              >
                Request New Verification Email
              </button>
              
              <button
                onClick={handleRetry}
                className="w-full bg-gray-800 text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-700 transition-colors border border-gray-700 flex items-center gap-2 justify-center"
              >
                <RefreshCw className="w-4 h-4" />
                Try Again
              </button>
              
              <button
                onClick={handleManualRedirect}
                className="w-full bg-gray-700 text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-600 transition-colors border border-gray-600 flex items-center gap-2 justify-center"
              >
                <ExternalLink className="w-4 h-4" />
                Back to Login
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};