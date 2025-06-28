import React, { useState, useEffect } from 'react';
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { WelcomeScreen } from './components/WelcomeScreen';
import { Dashboard } from './components/Dashboard';
import { GoalWizard } from './components/GoalWizard';
import { Gamification } from './components/Gamification';
import { Analytics } from './components/Analytics';
import { Settings } from './components/Settings';
import { Navigation } from './components/Navigation';
import { OnboardingTutorial } from './components/OnboardingTutorial';
import { EmailVerificationHandler } from './components/EmailVerificationHandler';
import { useAuth } from './hooks/useAuth';
import { AppConfig } from './types/user';
import { Loader2, AlertCircle } from 'lucide-react';
import { supabase } from './lib/supabase';

export type Screen = 'welcome' | 'dashboard' | 'goal-wizard' | 'gamification' | 'analytics' | 'settings';

// App data version for localStorage management
const APP_DATA_VERSION = "v1.2";

function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('dashboard');
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  
  const { user, loading, error, isAuthenticated } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  
  const appConfig: AppConfig = {
    betaAccess: true,
    version: '1.0.0-beta'
  };

  // Dev-only session and cache reset logic
  useEffect(() => {
    if (import.meta.env.DEV) {
      console.log('[App] Development mode detected - checking for cache/session reset needs');
      
      // Check if we need to reset due to version mismatch
      const storedVersion = localStorage.getItem('app_data_version');
      if (storedVersion !== APP_DATA_VERSION) {
        console.log('[App] Version mismatch detected, clearing localStorage and signing out');
        console.log(`Stored version: ${storedVersion}, Current version: ${APP_DATA_VERSION}`);
        
        // Clear all localStorage
        localStorage.clear();
        
        // Sign out from Supabase
        supabase.auth.signOut().catch(err => {
          console.warn('[App] Error during dev signout:', err);
        });
        
        // Set new version
        localStorage.setItem('app_data_version', APP_DATA_VERSION);
        
        // Optional: Add a dev reset button for manual clearing
        if (!window.devResetAdded) {
          window.devResetAdded = true;
          const resetButton = document.createElement('button');
          resetButton.innerHTML = '🔄 Dev Reset';
          resetButton.style.cssText = `
            position: fixed;
            top: 10px;
            left: 10px;
            z-index: 9999;
            background: #ff4444;
            color: white;
            border: none;
            padding: 8px 12px;
            border-radius: 4px;
            font-size: 12px;
            cursor: pointer;
          `;
          resetButton.onclick = () => {
            localStorage.clear();
            supabase.auth.signOut();
            window.location.reload();
          };
          document.body.appendChild(resetButton);
        }
      } else if (!storedVersion) {
        // First time running this version
        localStorage.setItem('app_data_version', APP_DATA_VERSION);
      }
    }
  }, []);

  // Versioned localStorage helper functions
  const getVersionedLocalStorage = (key: string, defaultValue: any = null) => {
    try {
      const stored = localStorage.getItem(key);
      if (!stored) return defaultValue;
      
      const parsed = JSON.parse(stored);
      
      // Check if the stored data has a version
      if (parsed && typeof parsed === 'object' && parsed.version) {
        if (parsed.version === APP_DATA_VERSION) {
          return parsed.data;
        } else {
          console.log(`[App] Removing outdated localStorage key: ${key}`);
          localStorage.removeItem(key);
          return defaultValue;
        }
      } else {
        // Legacy data without version, remove it
        console.log(`[App] Removing legacy localStorage key: ${key}`);
        localStorage.removeItem(key);
        return defaultValue;
      }
    } catch (error) {
      console.error(`[App] Error reading localStorage key ${key}:`, error);
      localStorage.removeItem(key);
      return defaultValue;
    }
  };

  const setVersionedLocalStorage = (key: string, value: any) => {
    try {
      const versionedData = {
        version: APP_DATA_VERSION,
        data: value,
        timestamp: Date.now()
      };
      localStorage.setItem(key, JSON.stringify(versionedData));
    } catch (error) {
      console.error(`[App] Error setting localStorage key ${key}:`, error);
    }
  };

  // Check if user has completed onboarding with versioned storage
  useEffect(() => {
    if (isAuthenticated && user) {
      const hasCompletedOnboarding = getVersionedLocalStorage('hasCompletedOnboarding', false);
      if (!hasCompletedOnboarding) {
        setShowOnboarding(true);
      }
    }
  }, [isAuthenticated, user]);

  const handleLogin = () => {
    navigate('/dashboard');
    setAuthError(null);
  };

  const navigateTo = (screen: Screen) => {
    setCurrentScreen(screen);
    navigate(`/${screen === 'dashboard' ? '' : screen}`);
  };

  const handleOnboardingComplete = () => {
    setVersionedLocalStorage('hasCompletedOnboarding', true);
    setShowOnboarding(false);
  };

  const handleOnboardingSkip = () => {
    setVersionedLocalStorage('hasCompletedOnboarding', true);
    setShowOnboarding(false);
  };

  const startOnboardingTutorial = () => {
    setShowOnboarding(true);
  };

  // Show loading screen while checking auth
  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-yellow-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Loading GoalCrusher...</h2>
          <p className="text-gray-400">Setting up your goal crushing experience</p>
          {import.meta.env.DEV && (
            <p className="text-xs text-gray-500 mt-2">Dev mode: v{APP_DATA_VERSION}</p>
          )}
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
                if (import.meta.env.DEV) {
                  // In dev mode, also clear localStorage and sign out
                  localStorage.clear();
                  supabase.auth.signOut();
                }
                window.location.reload();
              }}
              className="w-full bg-yellow-400 text-black px-6 py-2 rounded-lg font-semibold hover:bg-yellow-300 transition-colors"
            >
              Try Again
            </button>
            
            <button
              onClick={() => {
                setAuthError(null);
                navigate('/');
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

  return (
    <div className="min-h-screen bg-black text-white">
      <Routes>
        {/* Email verification route */}
        <Route path="/verify" element={<EmailVerificationHandler />} />
        <Route path="/confirm" element={<EmailVerificationHandler />} />
        <Route path="/auth/callback" element={<EmailVerificationHandler />} />
        
        {/* Main app routes */}
        <Route path="/*" element={
          !isAuthenticated ? (
            <WelcomeScreen 
              onLogin={handleLogin}
            />
          ) : (
            <div className="flex flex-col md:flex-row">
              {/* Small Bolt.new Badge for authenticated users */}
              <div className="fixed top-1 right-1 z-50">
                <a href="https://bolt.new/?rid=os72mi" target="_blank" rel="noopener noreferrer" 
                   className="block transition-all duration-300 hover:shadow-lg">
                  <img src="https://storage.bolt.army/white_circle_360x360.png" 
                       alt="Built with Bolt.new badge" 
                       className="w-8 h-8 md:w-10 md:h-10 rounded-full shadow-md opacity-60 hover:opacity-100 transition-opacity" />
                </a>
              </div>

              <Navigation 
                currentScreen={currentScreen} 
                onNavigate={navigateTo}
                user={user}
                appConfig={appConfig}
              />
              
              <main className="flex-1 md:ml-64">
                <Routes>
                  <Route path="/" element={
                    <Dashboard 
                      onNavigate={navigateTo}
                      user={user}
                      appConfig={appConfig}
                    />
                  } />
                  <Route path="/dashboard" element={
                    <Dashboard 
                      onNavigate={navigateTo}
                      user={user}
                      appConfig={appConfig}
                    />
                  } />
                  <Route path="/goal-wizard" element={
                    <GoalWizard 
                      onNavigate={navigateTo}
                      user={user}
                      appConfig={appConfig}
                    />
                  } />
                  <Route path="/gamification" element={
                    <Gamification 
                      user={user}
                      appConfig={appConfig}
                    />
                  } />
                  <Route path="/analytics" element={
                    <Analytics 
                      user={user}
                      appConfig={appConfig}
                    />
                  } />
                  <Route path="/settings" element={
                    <Settings 
                      onStartTutorial={startOnboardingTutorial}
                      user={user}
                      appConfig={appConfig}
                      onUpgradeToPro={() => {/* TODO: Implement */}}
                      onDowngradeToFree={() => {/* TODO: Implement */}}
                      onEndBeta={() => {/* TODO: Implement */}}
                    />
                  } />
                </Routes>
              </main>
            </div>
          )
        } />
      </Routes>

      {/* Onboarding Tutorial */}
      {showOnboarding && (
        <OnboardingTutorial 
          onComplete={handleOnboardingComplete}
          onSkip={handleOnboardingSkip}
        />
      )}
    </div>
  );
}

export default App;