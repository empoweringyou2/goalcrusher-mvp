import React, { useState } from 'react';
import { Sparkles, Star, UserX, Loader2 } from 'lucide-react';
import { AuthForm } from './AuthForm';
import { continueAsGuest } from '../lib/supabase';

interface WelcomeScreenProps {
  onLogin: () => void;
  onBypassLogin: () => void;
  loadGuestUser?: (guestUserId: string) => Promise<boolean>;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onLogin, onBypassLogin, loadGuestUser }) => {
  const [showAuthForm, setShowAuthForm] = useState(false);
  const [guestLoading, setGuestLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGuestLogin = async () => {
    setGuestLoading(true);
    setError(null);
    
    try {
      console.log('Starting guest login process...');
      const { data, error } = await continueAsGuest();
      
      if (error) {
        console.error('Failed to create guest user:', error);
        setError('Could not start as guest. Please try again.');
        return;
      }
      
      if (data && loadGuestUser) {
        console.log('Guest user created successfully:', data);
        // Load the guest user into the auth state
        const success = await loadGuestUser(data.id);
        
        if (success) {
          // Small delay to ensure the auth state is updated
          setTimeout(() => {
            onLogin(); // Transition to dashboard
          }, 100);
        } else {
          setError('Could not load guest account. Please try again.');
        }
      } else {
        setError('Could not create guest account. Please try again.');
      }
    } catch (err) {
      console.error('Unexpected error during guest login:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setGuestLoading(false);
    }
  };

  if (showAuthForm) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <AuthForm onSuccess={onLogin} />
          
          {/* Back to welcome and guest options */}
          <div className="mt-6 text-center space-y-3">
            <button
              onClick={() => setShowAuthForm(false)}
              className="text-gray-400 hover:text-white text-sm transition-colors"
            >
              ← Back to welcome
            </button>
            
            <div className="border-t border-gray-800 pt-3">
              {error && (
                <div className="mb-3 p-2 bg-red-500/10 border border-red-500/20 rounded text-red-400 text-sm">
                  {error}
                </div>
              )}
              <button
                onClick={handleGuestLogin}
                disabled={guestLoading}
                className="flex items-center gap-2 text-gray-400 hover:text-yellow-400 text-sm transition-colors mx-auto disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {guestLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <UserX className="w-4 h-4" />
                )}
                {guestLoading ? 'Creating Guest Account...' : 'Continue as Guest'}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      {/* Animated background stars */}
      <div className="absolute inset-0">
        {[...Array(20)].map((_, i) => (
          <Star
            key={i}
            className={`absolute text-yellow-400 animate-pulse opacity-20`}
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 2}s`,
              fontSize: `${Math.random() * 10 + 8}px`
            }}
          />
        ))}
      </div>

      <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
        <div className="text-center max-w-md mx-auto">
          {/* GoalCrusher Logo */}
          <div className="mb-8 relative">
            <div className="w-32 h-32 mx-auto bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center shadow-2xl shadow-yellow-400/30">
              <img 
                src="/logo_with_g_transparent.png" 
                alt="GoalCrusher Logo"
                className="w-24 h-24 mt-4 animate-bounce"
              />
            </div>
            <div className="absolute -top-4 -right-4 animate-spin">
              <Sparkles className="w-8 h-8 text-yellow-400" />
            </div>
            <div className="absolute -bottom-2 -left-4 animate-pulse">
              <Star className="w-6 h-6 text-yellow-400" />
            </div>
          </div>

          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-yellow-400 to-white bg-clip-text text-transparent">
            Google Maps for Your Goals
          </h1>
          
          <p className="text-xl text-gray-300 mb-2">
            Meet <span className="text-yellow-400 font-semibold">Crushion</span>, your AI goal wizard.
          </p>
          
          <p className="text-lg text-gray-400 mb-12">
            Your journey begins today.
          </p>

          {/* Error message */}
          {error && (
            <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Main action buttons */}
          <div className="space-y-4">
            <button
              onClick={() => setShowAuthForm(true)}
              className="w-full bg-yellow-400 text-black px-8 py-4 rounded-xl text-lg font-bold hover:bg-yellow-300 transition-all duration-300 transform hover:scale-105 shadow-lg shadow-yellow-400/25"
            >
              Start Your Quest
            </button>

            {/* Guest login button */}
            <button
              onClick={handleGuestLogin}
              disabled={guestLoading}
              className="w-full bg-gray-800 text-gray-300 px-8 py-3 rounded-xl text-base font-medium hover:bg-gray-700 hover:text-white transition-all duration-300 border border-gray-700 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {guestLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Creating Guest Account...
                </>
              ) : (
                <>
                  <UserX className="w-5 h-5" />
                  Continue as Guest
                  <span className="text-xs bg-blue-400/20 text-blue-400 px-2 py-1 rounded-full ml-2">
                    Try Now
                  </span>
                </>
              )}
            </button>
          </div>

          {/* Brand footer */}
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
            <div className="flex items-center gap-2 text-gray-500">
              <Sparkles className="w-4 h-4" />
              <span className="text-sm">Empowering You 2</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};