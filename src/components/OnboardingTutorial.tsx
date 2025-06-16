import React, { useState, useEffect } from 'react';
import { 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Wand2, 
  Calendar, 
  Trophy, 
  BarChart3, 
  Settings,
  Target,
  Users,
  Shield,
  Zap,
  CheckCircle,
  Play,
  Pause
} from 'lucide-react';

interface OnboardingTutorialProps {
  onComplete: () => void;
  onSkip: () => void;
}

interface TutorialStep {
  id: number;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  image?: string;
  tips: string[];
  action?: {
    text: string;
    highlight: string;
  };
}

export const OnboardingTutorial: React.FC<OnboardingTutorialProps> = ({ onComplete, onSkip }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [autoPlay, setAutoPlay] = useState(false);

  const tutorialSteps: TutorialStep[] = [
    {
      id: 1,
      title: "Welcome to GoalCrusher! 🎉",
      description: "Your personal goal achievement platform powered by AI. Let's take a quick tour to get you started on your journey to success!",
      icon: Target,
      tips: [
        "This tutorial will take about 2 minutes",
        "You can skip or replay it anytime from Settings",
        "Each feature is designed to help you achieve your goals faster"
      ]
    },
    {
      id: 2,
      title: "Meet Crushion - Your AI Goal Wizard 🧙‍♂️",
      description: "Crushion is your intelligent companion who helps transform your dreams into actionable, scheduled plans using advanced AI.",
      icon: Wand2,
      tips: [
        "Crushion learns your preferences and adapts to your style",
        "Available 24/7 to help plan, motivate, and guide you",
        "Supports both voice and text interactions",
        "Choose between different personality styles"
      ],
      action: {
        text: "Try the Goal Wizard",
        highlight: "goal-wizard"
      }
    },
    {
      id: 3,
      title: "Smart Dashboard & Calendar 📅",
      description: "Your command center for managing goals, tasks, and schedules. Drag & drop to reschedule, track progress, and stay organized.",
      icon: Calendar,
      tips: [
        "Multiple view modes: Day, Week, Month, Year, and Schedule",
        "Drag and drop tasks to reschedule instantly",
        "Real-time progress tracking with XP and streaks",
        "Accountability features built into every task"
      ],
      action: {
        text: "Explore Dashboard",
        highlight: "dashboard"
      }
    },
    {
      id: 4,
      title: "Life Domains & Analytics 📊",
      description: "Track progress across all areas of your life. Get AI-powered insights and maintain balance between work, health, relationships, and more.",
      icon: BarChart3,
      tips: [
        "Customize your life domains (Health, Career, Finance, etc.)",
        "Visual progress tracking with detailed analytics",
        "Daily habits and rituals management",
        "AI insights to optimize your performance"
      ],
      action: {
        text: "View Analytics",
        highlight: "analytics"
      }
    },
    {
      id: 5,
      title: "Gamification & Social Features 🏆",
      description: "Level up your motivation with achievements, leaderboards, and social accountability. Connect with friends and join teams.",
      icon: Trophy,
      tips: [
        "Earn XP and unlock achievements for completing goals",
        "Compete with friends on leaderboards",
        "Join teams for group accountability",
        "Challenge friends to stay motivated together"
      ],
      action: {
        text: "Check Achievements",
        highlight: "gamification"
      }
    },
    {
      id: 6,
      title: "Accountability System 🛡️",
      description: "Boost your success rate by up to 95% with our comprehensive accountability system. Choose AI, partners, teams, or public commitments.",
      icon: Shield,
      tips: [
        "AI Accountability: Smart reminders and progress tracking",
        "Partner Accountability: Connect with friends or mentors",
        "Team Accountability: Group commitment and support",
        "Public Accountability: Social pressure for motivation"
      ]
    },
    {
      id: 7,
      title: "Personalization & Settings ⚙️",
      description: "Customize your experience with themes, notifications, voice settings, and privacy controls. Make GoalCrusher truly yours.",
      icon: Settings,
      tips: [
        "Choose Crushion's voice style and personality",
        "Customize notifications and reminders",
        "Manage privacy and data preferences",
        "Toggle gamification features on/off"
      ],
      action: {
        text: "Open Settings",
        highlight: "settings"
      }
    },
    {
      id: 8,
      title: "You're Ready to Crush Your Goals! 🚀",
      description: "You now have everything you need to turn your dreams into reality. Start by creating your first goal with Crushion!",
      icon: Zap,
      tips: [
        "Start with one meaningful goal to build momentum",
        "Use Crushion to break it down into actionable steps",
        "Set up accountability to increase your success rate",
        "Track your progress and celebrate small wins"
      ],
      action: {
        text: "Create Your First Goal",
        highlight: "goal-wizard"
      }
    }
  ];

  // Auto-play functionality
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (autoPlay && isPlaying) {
      interval = setInterval(() => {
        if (currentStep < tutorialSteps.length - 1) {
          setCurrentStep(prev => prev + 1);
        } else {
          setIsPlaying(false);
          setAutoPlay(false);
        }
      }, 5000); // 5 seconds per step
    }
    return () => clearInterval(interval);
  }, [autoPlay, isPlaying, currentStep, tutorialSteps.length]);

  const nextStep = () => {
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const toggleAutoPlay = () => {
    setAutoPlay(!autoPlay);
    setIsPlaying(!isPlaying);
  };

  const currentStepData = tutorialSteps[currentStep];
  const StepIcon = currentStepData.icon;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-2xl border border-gray-800 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="p-6 border-b border-gray-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center">
                <StepIcon className="w-6 h-6 text-black" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">{currentStepData.title}</h2>
                <p className="text-sm text-gray-400">Step {currentStep + 1} of {tutorialSteps.length}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {/* Auto-play toggle */}
              <button
                onClick={toggleAutoPlay}
                className={`p-2 rounded-lg transition-colors ${
                  autoPlay ? 'bg-yellow-400 text-black' : 'bg-gray-800 text-gray-400 hover:text-white'
                }`}
                title={autoPlay ? 'Pause auto-play' : 'Start auto-play'}
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </button>
              
              <button
                onClick={onSkip}
                className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
                title="Skip tutorial"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
          </div>
          
          {/* Progress bar */}
          <div className="mt-4">
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-yellow-400 to-yellow-500 h-2 rounded-full transition-all duration-500"
                style={{ width: `${((currentStep + 1) / tutorialSteps.length) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Description */}
          <p className="text-gray-300 text-lg mb-6 leading-relaxed">
            {currentStepData.description}
          </p>

          {/* Visual representation */}
          <div className="bg-gray-800 rounded-xl p-6 mb-6 text-center">
            <StepIcon className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
            {currentStepData.image && (
              <img 
                src={currentStepData.image} 
                alt={currentStepData.title}
                className="max-w-full h-48 object-cover rounded-lg mx-auto"
              />
            )}
          </div>

          {/* Tips */}
          <div className="mb-6">
            <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-400" />
              Key Features:
            </h3>
            <ul className="space-y-2">
              {currentStepData.tips.map((tip, index) => (
                <li key={index} className="flex items-start gap-3 text-gray-300">
                  <div className="w-2 h-2 bg-yellow-400 rounded-full mt-2 flex-shrink-0" />
                  <span>{tip}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Action button */}
          {currentStepData.action && (
            <div className="bg-yellow-400/10 border border-yellow-400/20 rounded-lg p-4 mb-6">
              <p className="text-yellow-400 font-medium mb-2">💡 Try it out:</p>
              <p className="text-gray-300 text-sm mb-3">
                After completing this tutorial, click "{currentStepData.action.text}" to explore this feature.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-800">
          <div className="flex items-center justify-between">
            <button
              onClick={prevStep}
              disabled={currentStep === 0}
              className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </button>

            <div className="flex gap-2">
              {tutorialSteps.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentStep(index)}
                  className={`w-3 h-3 rounded-full transition-colors ${
                    index === currentStep ? 'bg-yellow-400' : 
                    index < currentStep ? 'bg-green-400' : 'bg-gray-600'
                  }`}
                />
              ))}
            </div>

            <div className="flex gap-2">
              <button
                onClick={onSkip}
                className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
              >
                Skip Tutorial
              </button>
              <button
                onClick={nextStep}
                className="flex items-center gap-2 px-6 py-2 bg-yellow-400 text-black rounded-lg hover:bg-yellow-300 transition-colors font-semibold"
              >
                {currentStep === tutorialSteps.length - 1 ? 'Get Started' : 'Next'}
                {currentStep !== tutorialSteps.length - 1 && <ChevronRight className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};