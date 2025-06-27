import React, { useState } from 'react';
import { Eye, EyeOff, Mail, Lock, User, AlertCircle, CheckCircle, Loader2, Clock } from 'lucide-react';
import { signInWithGoogle, signUpWithEmail, signInWithEmail, resetPassword } from '../lib/supabase';

interface AuthFormProps {
  onSuccess: () => void;
}

type AuthMode = 'signin' | 'signup' | 'forgot';

export const AuthForm: React.FC<AuthFormProps> = ({ onSuccess }) => {
  const [mode, setMode] = useState<AuthMode>('signin');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [rateLimitCooldown, setRateLimitCooldown] = useState<number>(0);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  // Handle rate limit countdown
  React.useEffect(() => {
    let interval: NodeJS.Timeout;
    if (rateLimitCooldown > 0) {
      interval = setInterval(() => {
        setRateLimitCooldown(prev => {
          if (prev <= 1) {
            setError(null);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [rateLimitCooldown]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
    // Clear errors when user starts typing
    if (error && rateLimitCooldown === 0) setError(null);
    if (success) setSuccess(null);
  };

  const validateForm = () => {
    if (mode === 'forgot') {
      if (!formData.email) {
        setError('Email is required');
        return false;
      }
    } else if (mode === 'signup') {
      if (!formData.name.trim()) {
        setError('Name is required');
        return false;
      }
      if (!formData.email) {
        setError('Email is required');
        return false;
      }
      if (formData.password.length < 6) {
        setError('Password must be at least 6 characters');
        return false;
      }
      if (formData.password !== formData.confirmPassword) {
        setError('Passwords do not match');
        return false;
      }
    } else {
      if (!formData.email || !formData.password) {
        setError('Email and password are required');
        return false;
      }
    }
    return true;
  };

  const parseSupabaseError = (error: any) => {
    const message = error?.message || '';
    
    // Handle rate limiting
    if (message.includes('rate_limit') || error?.status === 429) {
      const match = message.match(/(\d+)\s*seconds?/);
      const seconds = match ? parseInt(match[1]) : 60;
      setRateLimitCooldown(seconds);
      return `Too many requests. Please wait ${seconds} seconds before trying again.`;
    }
    
    // Handle invalid credentials
    if (message.includes('Invalid login credentials') || message.includes('invalid_credentials')) {
      return 'Invalid email or password. Please check your credentials and try again.';
    }
    
    // Handle email not confirmed
    if (message.includes('Email not confirmed')) {
      return 'Please check your email and click the confirmation link before signing in.';
    }
    
    // Handle user not found
    if (message.includes('User not found')) {
      return 'No account found with this email address. Please sign up first.';
    }
    
    // Handle weak password
    if (message.includes('Password should be at least')) {
      return 'Password must be at least 6 characters long.';
    }
    
    // Handle email already registered
    if (message.includes('User already registered')) {
      return 'An account with this email already exists. Please sign in instead.';
    }
    
    // Handle invalid email format
    if (message.includes('Invalid email')) {
      return 'Please enter a valid email address.';
    }
    
    // Handle signup disabled
    if (message.includes('Signups not allowed')) {
      return 'New account registration is currently disabled. Please contact support.';
    }
    
    // Handle configuration errors
    if (message.includes('Supabase not configured')) {
      return 'Authentication service is not properly configured. Please contact support.';
    }
    
    // Default error message
    return message || 'An unexpected error occurred. Please try again.';
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Don't allow submission during rate limit
    if (rateLimitCooldown > 0) {
      return;
    }
    
    if (!validateForm()) return;
    
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (mode === 'forgot') {
        console.log('[AuthForm] Attempting password reset for:', formData.email);
        const { error } = await resetPassword(formData.email);
        if (error) {
          console.error('[AuthForm] Password reset error:', error);
          setError(parseSupabaseError(error));
        } else {
          console.log('[AuthForm] Password reset email sent successfully');
          setSuccess('Password reset email sent! Check your inbox and spam folder.');
        }
      } else if (mode === 'signup') {
        console.log('[AuthForm] Attempting signup for:', formData.email);
        const { data, error } = await signUpWithEmail(formData.email, formData.password, formData.name);
        if (error) {
          console.error('[AuthForm] Signup error:', error);
          setError(parseSupabaseError(error));
        } else {
          console.log('[AuthForm] Signup successful:', {
            user: !!data?.user,
            session: !!data?.session,
            needsConfirmation: !data?.session
          });
          
          if (data?.session) {
            // User is immediately signed in (email confirmation disabled)
            console.log('[AuthForm] User signed in immediately');
            onSuccess();
          } else {
            // User needs to confirm email
            console.log('[AuthForm] User needs to confirm email');
            setSuccess('Account created! Please check your email to verify your account. You may need to check your spam folder.');
          }
        }
      } else {
        console.log('[AuthForm] Attempting signin for:', formData.email);
        const { data, error } = await signInWithEmail(formData.email, formData.password);
        if (error) {
          console.error('[AuthForm] Signin error:', error);
          setError(parseSupabaseError(error));
        } else {
          console.log('[AuthForm] Signin successful');
          onSuccess();
        }
      }
    } catch (err: any) {
      console.error('[AuthForm] Unexpected error:', err);
      setError(parseSupabaseError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleSocialAuth = async (provider: 'google') => {
    setLoading(true);
    setError(null);

    try {
      console.log(`[AuthForm] Attempting ${provider} OAuth`);
      const { error } = await signInWithGoogle();
      
      if (error) {
        console.error(`[AuthForm] ${provider} OAuth error:`, error);
        setError(parseSupabaseError(error));
      } else {
        console.log(`[AuthForm] ${provider} OAuth initiated successfully`);
        // Note: For OAuth, the redirect will handle success
      }
    } catch (err: any) {
      console.error(`[AuthForm] ${provider} OAuth unexpected error:`, err);
      setError(parseSupabaseError(err));
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({ name: '', email: '', password: '', confirmPassword: '' });
    setError(null);
    setSuccess(null);
    setRateLimitCooldown(0);
  };

  const switchMode = (newMode: AuthMode) => {
    setMode(newMode);
    resetForm();
  };

  const isRateLimited = rateLimitCooldown > 0;

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
          {mode === 'signin' && 'Welcome Back!'}
          {mode === 'signup' && 'Join GoalCrusher'}
          {mode === 'forgot' && 'Reset Password'}
        </h2>
        <p className="text-gray-400">
          {mode === 'signin' && 'Sign in to continue your journey'}
          {mode === 'signup' && 'Start crushing your goals today'}
          {mode === 'forgot' && 'Enter your email to reset your password'}
        </p>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className={`mb-4 p-3 border rounded-lg flex items-center gap-2 ${
          isRateLimited 
            ? 'bg-orange-500/10 border-orange-500/20' 
            : 'bg-red-500/10 border-red-500/20'
        }`}>
          {isRateLimited ? (
            <Clock className="w-4 h-4 text-orange-400 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
          )}
          <div className="flex-1">
            <span className={`text-sm ${isRateLimited ? 'text-orange-400' : 'text-red-400'}`}>
              {error}
            </span>
            {isRateLimited && (
              <div className="mt-1">
                <span className="text-orange-300 text-xs font-mono">
                  {rateLimitCooldown}s remaining
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
          <div className="flex-1">
            <span className="text-green-400 text-sm">{success}</span>
            {mode === 'signup' && success.includes('check your email') && (
              <div className="mt-2 text-xs text-gray-400">
                <p>📧 Check your email for a verification link</p>
                <p>🔍 Don't forget to check your spam folder</p>
                <p>🔗 Click the link to activate your account</p>
                <p>🌐 Open the link in your main browser (Chrome, Safari, etc.)</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Social Auth Buttons */}
      {mode !== 'forgot' && (
        <div className="space-y-3 mb-6">
          <button
            onClick={() => handleSocialAuth('google')}
            disabled={loading || isRateLimited}
            className="w-full bg-white text-black py-3 px-4 rounded-xl font-semibold hover:bg-gray-100 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            )}
            Continue with Google
          </button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-700"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-black text-gray-400">or</span>
            </div>
          </div>
        </div>
      )}

      {/* Email Form */}
      <form onSubmit={handleEmailAuth} className="space-y-4">
        {mode === 'signup' && (
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
              Full Name
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                disabled={isRateLimited}
                className="w-full bg-gray-800 text-white pl-10 pr-4 py-3 rounded-xl border border-gray-700 focus:border-yellow-400 focus:outline-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder="Enter your full name"
                required
              />
            </div>
          </div>
        )}

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
            Email Address
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              disabled={isRateLimited}
              className="w-full bg-gray-800 text-white pl-10 pr-4 py-3 rounded-xl border border-gray-700 focus:border-yellow-400 focus:outline-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              placeholder="Enter your email"
              required
            />
          </div>
        </div>

        {mode !== 'forgot' && (
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                disabled={isRateLimited}
                className="w-full bg-gray-800 text-white pl-10 pr-12 py-3 rounded-xl border border-gray-700 focus:border-yellow-400 focus:outline-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder="Enter your password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isRateLimited}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>
        )}

        {mode === 'signup' && (
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-2">
              Confirm Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleInputChange}
                disabled={isRateLimited}
                className="w-full bg-gray-800 text-white pl-10 pr-4 py-3 rounded-xl border border-gray-700 focus:border-yellow-400 focus:outline-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder="Confirm your password"
                required
              />
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={loading || isRateLimited}
          className="w-full bg-yellow-400 text-black py-3 px-4 rounded-xl text-lg font-bold hover:bg-yellow-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : isRateLimited ? (
            <>
              <Clock className="w-5 h-5" />
              Wait {rateLimitCooldown}s
            </>
          ) : (
            <>
              {mode === 'signin' && 'Sign In'}
              {mode === 'signup' && 'Create Account'}
              {mode === 'forgot' && 'Send Reset Email'}
            </>
          )}
        </button>
      </form>

      {/* Mode Switching */}
      <div className="mt-6 text-center space-y-2">
        {mode === 'signin' && (
          <>
            <p className="text-gray-400 text-sm">
              Don't have an account?{' '}
              <button
                onClick={() => switchMode('signup')}
                disabled={isRateLimited}
                className="text-yellow-400 hover:text-yellow-300 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Sign up
              </button>
            </p>
            <p className="text-gray-400 text-sm">
              <button
                onClick={() => switchMode('forgot')}
                disabled={isRateLimited}
                className="text-yellow-400 hover:text-yellow-300 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Forgot your password?
              </button>
            </p>
          </>
        )}

        {mode === 'signup' && (
          <p className="text-gray-400 text-sm">
            Already have an account?{' '}
            <button
              onClick={() => switchMode('signin')}
              disabled={isRateLimited}
              className="text-yellow-400 hover:text-yellow-300 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Sign in
            </button>
          </p>
        )}

        {mode === 'forgot' && (
          <p className="text-gray-400 text-sm">
            Remember your password?{' '}
            <button
              onClick={() => switchMode('signin')}
              disabled={isRateLimited}
              className="text-yellow-400 hover:text-yellow-300 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Sign in
            </button>
          </p>
        )}
      </div>

      {/* Help Text for Common Issues */}
      {mode === 'signin' && (
        <div className="mt-6 p-3 bg-gray-800/50 rounded-lg">
          <p className="text-gray-400 text-xs">
            <strong>Having trouble signing in?</strong><br />
            • Double-check your email and password for typos<br />
            • If you signed up with Google, use the Google button instead<br />
            • Check your email for a verification link if you just signed up<br />
            • Make sure you've verified your email address
          </p>
        </div>
      )}

      {mode === 'signup' && (
        <div className="mt-6 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
          <p className="text-blue-400 text-xs">
            <strong>Email Verification Tips:</strong><br />
            • Check your spam/junk folder if you don't see the email<br />
            • Open verification links in your main browser (Chrome, Safari, etc.)<br />
            • Avoid opening links in email app previews<br />
            • The verification link expires after 24 hours
          </p>
        </div>
      )}

      <p className="text-center text-gray-400 text-xs mt-8">
        By continuing, you agree to our{' '}
        <a href="#" className="text-yellow-400 hover:text-yellow-300 transition-colors">
          Terms of Service
        </a>{' '}
        and{' '}
        <a href="#" className="text-yellow-400 hover:text-yellow-300 transition-colors">
          Privacy Policy
        </a>
      </p>
    </div>
  );
};