import React, { useState, useEffect } from 'react';
import { WelcomeScreen } from './components/WelcomeScreen';
import { Dashboard } from './components/Dashboard';
import { GoalWizard } from './components/GoalWizard';
import { Gamification } from './components/Gamification';
import { Analytics } from './components/Analytics';
import { Settings } from './components/Settings';
import { Navigation } from './components/Navigation';
import { OnboardingTutorial } from './components/OnboardingTutorial';
import { AuthCallback } from './components/AuthCallback';
import { EmailVerificationHandler } from './components/EmailVerificationHandler';
import { useAuth } from './hooks/useAuth';
import { AppConfig } from './types/user';
import { Loader2, AlertCircle } from 'lucide-react';

export type Screen = 'welcome' | 'dashboard' | 'goal-wizard' | 'gamification' | 'analytics' | 'settings';

function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('dashboard');
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  
  const { user, loading, error, isAuthenticated, loadGuestUser } = useAuth();
  
  const appConfig: AppConfig = {
    betaAccess: true,
    version: '1.0.0-beta'
  };

  // Check if we're handling different auth flows
  const currentPath = window.location.pathname;
  const currentSearch = window.location.search;
  const currentHash = window.location.hash;
  
  const isAuthCallback = currentPath === '/auth/callback';
  const isEmailVerification = currentPath === '/verify' || 
                              currentPath === '/confirm' ||
                              currentSearch.includes('type=signup') ||
                              currentSearch.includes('type=email_confirmation') ||
                              currentSearch.includes('access_token') ||
                              currentHash.includes('type=signup') ||
                              currentHash.includes('type=email_confirmation') ||
                              currentHash.includes('access_token') ||
                              currentSearch.includes('code=') ||
                              currentHash.includes('code=');

  // Check if user has completed onboarding
  useEffect(() => {
    if (isAuthenticated && user) {
      const hasCompletedOnboarding = localStorage.getItem('hasCompletedOnboarding');
      if (!hasCompletedOnboarding) {
        setShowOnboarding(true);
      }
    }
  }, [isAuthenticated, user]);

  const handleLogin = () => {
    setCurrentScreen('dashboard');
    setAuthError(null);
  };

  const navigateTo = (screen: Screen) => {
    setCurrentScreen(screen);
  };

  const handleOnboardingComplete = () => {
    localStorage.setItem('hasCompletedOnboarding', 'true');
    setShowOnboarding(false);
  };

  const handleOnboardingSkip = () => {
    localStorage.setItem('hasCompletedOnboarding', 'true');
    setShowOnboarding(false);
  };

  const startOnboardingTutorial = () => {
    setShowOnboarding(true);
  };

  const handleAuthCallbackSuccess = () => {
    // Redirect to dashboard after successful OAuth
    window.history.replaceState({}, '', '/');
    handleLogin();
  };

  const handleAuthCallbackError = (errorMessage: string) => {
    setAuthError(errorMessage);
    // Redirect back to welcome screen
    window.history.replaceState({}, '', '/');
  };

  // Handle email verification - simplified to just show the handler
  if (isEmailVerification && !isAuthCallback) {
    return <EmailVerificationHandler />;
  }

  // Handle auth callback
  if (isAuthCallback) {
    return (
      <AuthCallback 
        onSuccess={handleAuthCallbackSuccess}
        onError={handleAuthCallbackError}
      />
    );
  }

  // Show loading screen while checking auth
  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-yellow-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Loading GoalCrusher...</h2>
          <p className="text-gray-400">Setting up your goal crushing experience</p>
        </div>
      </div>
    );
  }

  // Show error screen if there's an auth error
  if (error || authError) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Something went wrong</h2>
          <p className="text-gray-400 mb-6">{error || authError}</p>
          
          <div className="space-y-3">
            <button
              onClick={() => {
                setAuthError(null);
                window.location.reload();
              }}
              className="w-full bg-yellow-400 text-black px-6 py-2 rounded-lg font-semibold hover:bg-yellow-300 transition-colors"
            >
              Try Again
            </button>
            
            <button
              onClick={() => {
                setAuthError(null);
                window.location.href = '/';
              }}
              className="w-full bg-gray-800 text-white px-6 py-2 rounded-lg font-medium hover:bg-gray-700 transition-colors border border-gray-700"
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show welcome screen if not authenticated
  if (!isAuthenticated) {
    return (
      <WelcomeScreen 
        onLogin={handleLogin} 
        onBypassLogin={handleLogin}
        loadGuestUser={loadGuestUser}
      />
    );
  }

  // Main app for authenticated users (including guests)
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Bolt.new Badge */}
      <div className="fixed top-4 right-4 z-50">
        <a href="https://bolt.new/?rid=os72mi" target="_blank" rel="noopener noreferrer" 
           className="block transition-all duration-300 hover:shadow-2xl">
          <img src="https://storage.bolt.army/white_circle_360x360.png" 
               alt="Built with Bolt.new badge" 
               className="w-20 h-20 md:w-28 md:h-28 rounded-full shadow-lg bolt-badge bolt-badge-intro"
               onAnimationEnd={(e) => e.currentTarget.classList.add('animated')} />
        </a>
      </div>

      <div className="flex flex-col md:flex-row">
        <Navigation 
          currentScreen={currentScreen} 
          onNavigate={navigateTo}
          user={user}
          appConfig={appConfig}
        />
        
        <main className="flex-1 md:ml-64">
          {currentScreen === 'dashboard' && (
            <Dashboard 
              onNavigate={navigateTo}
              user={user}
              appConfig={appConfig}
            />
          )}
          {currentScreen === 'goal-wizard' && (
            <GoalWizard 
              onNavigate={navigateTo}
              user={user}
              appConfig={appConfig}
            />
          )}
          {currentScreen === 'gamification' && (
            <Gamification 
              user={user}
              appConfig={appConfig}
            />
          )}
          {currentScreen === 'analytics' && (
            <Analytics 
              user={user}
              appConfig={appConfig}
            />
          )}
          {currentScreen === 'settings' && (
            <Settings 
              onStartTutorial={startOnboardingTutorial}
              user={user}
              appConfig={appConfig}
              onUpgradeToPro={() => {/* TODO: Implement */}}
              onDowngradeToFree={() => {/* TODO: Implement */}}
              onEndBeta={() => {/* TODO: Implement */}}
            />
          )}
        </main>
      </div>

      {/* Onboarding Tutorial */}
      {showOnboarding && (
        <OnboardingTutorial 
          onComplete={handleOnboardingComplete}
          onSkip={handleOnboardingSkip}
        />
      )}

      {/* Guest Mode Indicator */}
      {user?.email?.includes('guest-') && (
        <div className="fixed bottom-4 left-4 bg-blue-400/20 border border-blue-400/40 text-blue-400 px-3 py-2 rounded-lg text-sm font-medium z-50">
          👤 Guest Mode - Your progress is saved locally
        </div>
      )}
    </div>
  );
}

export default App;