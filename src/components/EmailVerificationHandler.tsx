import React, { useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

export const EmailVerificationHandler: React.FC = () => {
  useEffect(() => {
    const verifyEmail = async () => {
      try {
        // Extract the verification code from URL
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        
        console.log('[EmailVerification] Extracted code:', code);

        if (!code) {
          console.error('[EmailVerification] No code found in URL');
          window.location.href = '/';
          return;
        }

        console.log('[EmailVerification] Attempting to exchange code for session...');
        
        const { data, error } = await supabase.auth.exchangeCodeForSession(code);
        
        if (error) {
          console.error('[EmailVerification] Verification failed:', error.message);
          window.location.href = '/';
          return;
        }

        if (data.session) {
          console.log('[EmailVerification] Email verification successful:', data.session.user.email);
          // Clean up URL and redirect to root
          window.history.replaceState({}, '', '/');
          window.location.href = '/';
        } else {
          console.error('[EmailVerification] No session returned after code exchange');
          window.location.href = '/';
        }

      } catch (err: any) {
        console.error('[EmailVerification] Unexpected error:', err.message);
        window.location.href = '/';
      }
    };

    verifyEmail();
  }, []);

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
      <div className="text-center">
        <Loader2 className="w-16 h-16 animate-spin text-yellow-400 mx-auto mb-6" />
        <h2 className="text-2xl font-bold text-white mb-4">Verifying Email</h2>
        <p className="text-gray-400">Verifying your email... please wait.</p>
      </div>
    </div>
  );
};