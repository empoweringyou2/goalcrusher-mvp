import React, { useEffect, useState } from 'react';
import { CheckCircle, AlertCircle, Loader2, ArrowRight, Mail } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface EmailVerificationHandlerProps {
  onVerificationComplete: () => void;
  onVerificationError: (error: string) => void;
}

export const EmailVerificationHandler: React.FC<EmailVerificationHandlerProps> = ({
  onVerificationComplete,
  onVerificationError
}) => {
  const [status, setStatus] = useState<'verifying' | 'success' | 'error' | 'expired'>('verifying');
  const [message, setMessage] = useState('Verifying your email...');
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    const handleEmailVerification = async () => {
      try {
        // Get URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        
        // Check for verification parameters in both search and hash
        const accessToken = urlParams.get('access_token') || hashParams.get('access_token');
        const refreshToken = urlParams.get('refresh_token') || hashParams.get('refresh_token');
        const tokenType = urlParams.get('token_type') || hashParams.get('token_type');
        const type = urlParams.get('type') || hashParams.get('type');
        
        console.log('Verification parameters:', { accessToken: !!accessToken, refreshToken: !!refreshToken, type });

        if (accessToken && refreshToken) {
          // Set the session using the tokens
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          });

          if (error) {
            console.error('Session error:', error);
            setStatus('error');
            setMessage('Failed to verify email. The link may be expired or invalid.');
            onVerificationError(error.message);
            return;
          }

          if (data.session) {
            console.log('Email verification successful:', data.session.user.email);
            setStatus('success');
            setMessage('Email verified successfully! Redirecting to dashboard...');
            
            // Start countdown
            const timer = setInterval(() => {
              setCountdown(prev => {
                if (prev <= 1) {
                  clearInterval(timer);
                  onVerificationComplete();
                  return 0;
                }
                return prev - 1;
              });
            }, 1000);

            return;
          }
        }

        // Check for confirmation type (email confirmation)
        if (type === 'signup' || type === 'email_confirmation') {
          // Handle email confirmation
          const { data, error } = await supabase.auth.getSession();
          
          if (error) {
            console.error('Session retrieval error:', error);
            setStatus('error');
            setMessage('Failed to confirm email. Please try signing in again.');
            onVerificationError(error.message);
            return;
          }

          if (data.session) {
            setStatus('success');
            setMessage('Email confirmed successfully! Redirecting to dashboard...');
            
            const timer = setInterval(() => {
              setCountdown(prev => {
                if (prev <= 1) {
                  clearInterval(timer);
                  onVerificationComplete();
                  return 0;
                }
                return prev - 1;
              });
            }, 1000);

            return;
          }
        }

        // If we get here, no valid verification parameters were found
        setStatus('error');
        setMessage('Invalid verification link. Please check your email for a valid confirmation link.');
        onVerificationError('Invalid verification parameters');

      } catch (err) {
        console.error('Verification error:', err);
        setStatus('error');
        setMessage('An unexpected error occurred during verification.');
        onVerificationError(err instanceof Error ? err.message : 'Unknown error');
      }
    };

    handleEmailVerification();
  }, [onVerificationComplete, onVerificationError]);

  const handleManualRedirect = () => {
    if (status === 'success') {
      onVerificationComplete();
    } else {
      // Redirect to login page
      window.location.href = '/';
    }
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
                Redirecting in {countdown} second{countdown !== 1 ? 's' : ''}...
              </p>
            </div>

            <button
              onClick={handleManualRedirect}
              className="bg-yellow-400 text-black px-6 py-3 rounded-lg font-semibold hover:bg-yellow-300 transition-colors flex items-center gap-2 mx-auto"
            >
              Continue to Dashboard
              <ArrowRight className="w-4 h-4" />
            </button>
          </>
        )}

        {status === 'error' && (
          <>
            <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-white mb-4">Verification Failed</h2>
            <p className="text-gray-400 mb-6">{message}</p>
            
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-6">
              <h3 className="text-red-400 font-medium mb-2">Common solutions:</h3>
              <ul className="text-gray-400 text-sm space-y-1 text-left">
                <li>• Check if you've already verified this email</li>
                <li>• Look for a newer verification email</li>
                <li>• Try signing in if you've already verified</li>
                <li>• Request a new verification email</li>
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
                onClick={() => window.location.reload()}
                className="w-full bg-gray-800 text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-700 transition-colors border border-gray-700"
              >
                Try Again
              </button>
            </div>
          </>
        )}

        {status === 'expired' && (
          <>
            <Mail className="w-16 h-16 text-orange-400 mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-white mb-4">Link Expired</h2>
            <p className="text-gray-400 mb-6">This verification link has expired. Please request a new one.</p>
            
            <button
              onClick={handleManualRedirect}
              className="bg-yellow-400 text-black px-6 py-3 rounded-lg font-semibold hover:bg-yellow-300 transition-colors"
            >
              Request New Link
            </button>
          </>
        )}
      </div>
    </div>
  );
};