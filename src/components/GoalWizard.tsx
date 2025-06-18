import React, { useState, useRef, useEffect } from 'react';
import { Wand2, Send, Sparkles, ArrowLeft, Target, Calendar, Clock, Mic, MicOff, Volume2, VolumeX, Eye, Ear, AlertCircle, Zap } from 'lucide-react';
import { Screen } from '../App';
import { User, AppConfig, isProFeatureAvailable } from '../types/user';
import { ProFeatureGate, ProBadge } from './ProFeatureGate';
import { sendToCrushion, getFallbackResponse, isOpenAIConfigured } from '../lib/callCrushionAssistant';

interface GoalWizardProps {
  onNavigate: (screen: Screen) => void;
  user: User;
  appConfig: AppConfig;
}

interface Message {
  id: number;
  text: string;
  isUser: boolean;
  timestamp: Date;
  isLoading?: boolean;
}

export const GoalWizard: React.FC<GoalWizardProps> = ({ onNavigate, user, appConfig }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      text: "✨ Welcome, Goal Crusher! I'm Crushion, your AI goal wizard. I'm here to help you transform your dreams into actionable, scheduled plans. What's the big goal you'd love to achieve?",
      isUser: false,
      timestamp: new Date(),
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [currentStep, setCurrentStep] = useState<'discovery' | 'breakdown' | 'scheduling' | 'complete'>('discovery');
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [crushionVoiceStyle, setCrushionVoiceStyle] = useState('friendly');
  const [preferAudio, setPreferAudio] = useState(false);
  const [threadId, setThreadId] = useState<string | undefined>();
  const [isProcessing, setIsProcessing] = useState(false);
  const recognitionRef = useRef<any>(null);
  const speechSynthesisRef = useRef<SpeechSynthesis | null>(null);

  const hasVoiceAccess = isProFeatureAvailable(user.plan, appConfig.betaAccess);
  const hasOpenAI = isOpenAIConfigured();

  // Check for speech recognition and synthesis support
  useEffect(() => {
    // Speech Recognition
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      setSpeechSupported(true);
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      
      recognitionRef.current.continuous = true; // Changed from false to true
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputValue(transcript);
        setIsListening(false);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }

    // Speech Synthesis
    if ('speechSynthesis' in window) {
      speechSynthesisRef.current = window.speechSynthesis;
    }

    // Load voice preference from localStorage
    const savedVoiceStyle = localStorage.getItem('crushionVoiceStyle');
    if (savedVoiceStyle) {
      setCrushionVoiceStyle(savedVoiceStyle);
    }

    const savedAudioPreference = localStorage.getItem('preferAudio');
    if (savedAudioPreference) {
      setPreferAudio(savedAudioPreference === 'true');
    }
  }, []);

  // Auto-speak new AI messages when preferAudio is enabled
  useEffect(() => {
    if (preferAudio && hasVoiceAccess && messages.length > 0) {
      const lastMessage = messages[messages.length - 1];
      if (!lastMessage.isUser && !lastMessage.isLoading) {
        // Small delay to ensure the message is rendered
        setTimeout(() => {
          speakText(lastMessage.text);
        }, 500);
      }
    }
  }, [messages, preferAudio, hasVoiceAccess]);

  const getVoiceSettings = (style: string) => {
    const voices = speechSynthesisRef.current?.getVoices() || [];
    
    switch (style) {
      case 'friendly':
        return {
          voice: voices.find(v => v.name.includes('Female') || v.name.includes('Samantha') || v.name.includes('Karen')) || voices[0],
          pitch: 1.1,
          rate: 0.9
        };
      case 'motivational':
        return {
          voice: voices.find(v => v.name.includes('Male') || v.name.includes('Alex') || v.name.includes('Daniel')) || voices[1],
          pitch: 1.0,
          rate: 1.1
        };
      case 'professional':
        return {
          voice: voices.find(v => v.name.includes('Microsoft') || v.name.includes('David')) || voices[2],
          pitch: 0.9,
          rate: 0.8
        };
      case 'casual':
        return {
          voice: voices.find(v => v.name.includes('Australian') || v.name.includes('British') || v.name.includes('Kate')) || voices[3],
          pitch: 1.2,
          rate: 1.0
        };
      default:
        return {
          voice: voices[0],
          pitch: 1.0,
          rate: 1.0
        };
    }
  };

  const speakText = (text: string) => {
    if (!speechSynthesisRef.current || !hasVoiceAccess) return;

    // Stop any current speech
    speechSynthesisRef.current.cancel();

    // Remove markdown and special characters for better speech
    const cleanText = text
      .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold markdown
      .replace(/\*(.*?)\*/g, '$1') // Remove italic markdown
      .replace(/#{1,6}\s/g, '') // Remove headers
      .replace(/[🎯✨📋🗓️🚀💪🌟]/g, '') // Remove emojis
      .replace(/\n+/g, '. '); // Replace line breaks with periods

    const utterance = new SpeechSynthesisUtterance(cleanText);
    const voiceSettings = getVoiceSettings(crushionVoiceStyle);
    
    utterance.voice = voiceSettings.voice;
    utterance.pitch = voiceSettings.pitch;
    utterance.rate = voiceSettings.rate;
    utterance.volume = 1;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    speechSynthesisRef.current.speak(utterance);
  };

  const stopSpeaking = () => {
    if (speechSynthesisRef.current) {
      speechSynthesisRef.current.cancel();
      setIsSpeaking(false);
    }
  };

  const startListening = () => {
    if (recognitionRef.current && speechSupported && hasVoiceAccess) {
      setIsListening(true);
      recognitionRef.current.start();
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

  const toggleAudioPreference = () => {
    if (!hasVoiceAccess) return;
    
    const newPreference = !preferAudio;
    setPreferAudio(newPreference);
    localStorage.setItem('preferAudio', newPreference.toString());
    
    // Stop any current speech when switching to read mode
    if (!newPreference && isSpeaking) {
      stopSpeaking();
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isProcessing) return;

    const userMessage: Message = {
      id: messages.length + 1,
      text: inputValue,
      isUser: true,
      timestamp: new Date(),
    };

    // Add loading message
    const loadingMessage: Message = {
      id: messages.length + 2,
      text: "Crushion is thinking...",
      isUser: false,
      timestamp: new Date(),
      isLoading: true,
    };

    setMessages(prev => [...prev, userMessage, loadingMessage]);
    setInputValue('');
    setIsProcessing(true);

    try {
      let response;
      
      if (hasOpenAI) {
        // Use real OpenAI assistant - pass the user ID
        response = await sendToCrushion(inputValue, user.id, threadId);
        setThreadId(response.threadId);
      } else {
        // Use fallback response
        await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate thinking time
        response = getFallbackResponse(inputValue);
      }

      // Remove loading message and add real response
      setMessages(prev => {
        const withoutLoading = prev.filter(msg => !msg.isLoading);
        return [...withoutLoading, {
          id: prev.length + 1,
          text: response.reply,
          isUser: false,
          timestamp: new Date(),
        }];
      });

      // Update step based on conversation progress
      if (currentStep === 'discovery' && messages.length >= 2) {
        setCurrentStep('breakdown');
      } else if (currentStep === 'breakdown' && messages.length >= 4) {
        setCurrentStep('scheduling');
      } else if (currentStep === 'scheduling' && messages.length >= 6) {
        setCurrentStep('complete');
      }

    } catch (error) {
      console.error('Error getting response from Crushion:', error);
      
      // Remove loading message and add error response
      setMessages(prev => {
        const withoutLoading = prev.filter(msg => !msg.isLoading);
        return [...withoutLoading, {
          id: prev.length + 1,
          text: "I apologize, but I'm having trouble connecting right now. Let me give you some general guidance instead! 🤖\n\nFor any goal, I recommend starting with these steps:\n1. Define what success looks like\n2. Break it into smaller milestones\n3. Schedule specific actions\n4. Set up accountability\n\nWhat specific aspect would you like help with?",
          isUser: false,
          timestamp: new Date(),
        }];
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const quickResponses = {
    discovery: [
      "Learn a new skill",
      "Start a business",
      "Get healthier",
      "Write a book"
    ],
    breakdown: [
      "Within 6 months",
      "By end of year",
      "No specific timeline",
      "As soon as possible"
    ],
    scheduling: [
      "Yes, sync with calendar",
      "Manual scheduling only",
      "Weekly reminders",
      "Daily check-ins"
    ]
  };

  return (
    <div className="flex flex-col h-screen bg-black text-white">
      {/* Header */}
      <div className="flex items-center gap-4 p-4 border-b border-gray-800">
        <button
          onClick={() => onNavigate('dashboard')}
          className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-400" />
        </button>
        
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-yellow-400 shadow-lg shadow-yellow-400/30">
            <img 
              src="/ChatGPT Image Jun 6, 2025, 01_22_00 AM.png" 
              alt="Crushion the Wizard"
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <h1 className="text-lg font-semibold flex items-center gap-2">
              Crushion - Goal Wizard
              {!hasOpenAI && (
                <span className="text-xs bg-orange-500/20 text-orange-400 px-2 py-1 rounded-full">
                  Simulated
                </span>
              )}
            </h1>
            <p className="text-sm text-gray-400 flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              {hasOpenAI ? 'AI-powered goal planning' : 'Demo mode - Connect OpenAI for full AI'}
            </p>
          </div>
        </div>

        {/* Read/Hear Toggle */}
        <div className="ml-auto flex items-center gap-3">
          {!hasOpenAI && (
            <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-2 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-orange-400" />
              <span className="text-orange-400 text-xs font-medium">
                Add VITE_OPENAI_API_KEY to .env for real AI
              </span>
            </div>
          )}
          
          <ProFeatureGate
            isProFeature={true}
            userPlan={user.plan}
            betaAccess={appConfig.betaAccess}
            featureName="Voice Features"
            description="Speak to Crushion and hear responses"
            showUpgradePrompt={false}
          >
            <div className="flex items-center gap-2 bg-gray-800 rounded-lg p-1">
              <button
                onClick={toggleAudioPreference}
                className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  !preferAudio
                    ? 'bg-yellow-400 text-black'
                    : 'text-gray-400 hover:text-white'
                }`}
                title="Read Crushion's messages"
              >
                <Eye className="w-4 h-4" />
                Read
              </button>
              <button
                onClick={toggleAudioPreference}
                className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  preferAudio
                    ? 'bg-yellow-400 text-black'
                    : 'text-gray-400 hover:text-white'
                }`}
                title="Hear Crushion's voice"
              >
                <Ear className="w-4 h-4" />
                Hear
              </button>
            </div>
          </ProFeatureGate>

          {/* Speak/Stop Button */}
          {hasVoiceAccess && (!preferAudio || isSpeaking) && speechSynthesisRef.current && (
            <button
              onClick={isSpeaking ? stopSpeaking : () => {
                const lastAiMessage = messages.filter(m => !m.isUser && !m.isLoading).pop();
                if (lastAiMessage) speakText(lastAiMessage.text);
              }}
              className={`p-2 rounded-lg transition-all ${
                isSpeaking 
                  ? 'bg-red-500 text-white animate-pulse' 
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
              title={isSpeaking ? 'Stop speaking' : 'Speak last message'}
            >
              {isSpeaking ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
            </button>
          )}

          {/* Progress indicator */}
          <div className="flex gap-1">
            {['discovery', 'breakdown', 'scheduling', 'complete'].map((step, index) => (
              <div
                key={step}
                className={`w-2 h-2 rounded-full transition-colors ${
                  currentStep === step || (['breakdown', 'scheduling', 'complete'].includes(currentStep) && index < ['discovery', 'breakdown', 'scheduling', 'complete'].indexOf(currentStep))
                    ? 'bg-yellow-400'
                    : 'bg-gray-700'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-32">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex gap-3 ${message.isUser ? 'flex-row-reverse' : 'flex-row'}`}
          >
            {!message.isUser && (
              <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-yellow-400 shadow-lg shadow-yellow-400/20 flex-shrink-0">
                <img 
                  src="/ChatGPT Image Jun 6, 2025, 01_22_00 AM.png" 
                  alt="Crushion"
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            
            <div
              className={`max-w-xs md:max-w-md p-3 rounded-2xl relative group ${
                message.isUser
                  ? 'bg-yellow-400 text-black ml-auto'
                  : message.isLoading
                  ? 'bg-gray-800 text-gray-300 animate-pulse'
                  : 'bg-gray-800 text-white'
              }`}
            >
              <p className="whitespace-pre-wrap">{message.text}</p>
              <p className={`text-xs mt-2 opacity-70 ${
                message.isUser ? 'text-black' : 'text-gray-400'
              }`}>
                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
              
              {/* Individual message speak button */}
              {!message.isUser && !message.isLoading && !preferAudio && hasVoiceAccess && speechSynthesisRef.current && (
                <button
                  onClick={() => speakText(message.text)}
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1 bg-gray-700 hover:bg-gray-600 rounded transition-all"
                  title="Speak this message"
                >
                  <Volume2 className="w-3 h-3 text-gray-300" />
                </button>
              )}
            </div>
          </div>
        ))}

        {/* Voice listening indicator */}
        {isListening && (
          <div className="flex justify-center">
            <div className="bg-red-500/20 border border-red-500/40 rounded-xl p-4 flex items-center gap-3">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
              <span className="text-red-400 text-sm font-medium">Listening... Speak now!</span>
              <div className="flex gap-1">
                {[...Array(3)].map((_, i) => (
                  <div
                    key={i}
                    className="w-1 h-4 bg-red-500 rounded-full animate-pulse"
                    style={{ animationDelay: `${i * 0.2}s` }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Audio preference indicator */}
        {preferAudio && hasVoiceAccess && (
          <div className="flex justify-center">
            <div className="bg-blue-500/20 border border-blue-500/40 rounded-xl p-3 flex items-center gap-2">
              <Ear className="w-4 h-4 text-blue-400" />
              <span className="text-blue-400 text-sm">
                Audio mode enabled - Crushion will speak automatically
              </span>
              {appConfig.betaAccess && user.plan === 'free' && <ProBadge />}
            </div>
          </div>
        )}
      </div>

      {/* Quick Responses */}
      {currentStep !== 'complete' && (
        <div className="p-4 border-t border-gray-800">
          <p className="text-sm text-gray-400 mb-2">Quick responses:</p>
          <div className="flex flex-wrap gap-2 mb-4">
            {quickResponses[currentStep]?.map((response) => (
              <button
                key={response}
                onClick={() => setInputValue(response)}
                className="px-3 py-1 bg-gray-800 hover:bg-gray-700 rounded-full text-sm transition-colors border border-gray-700"
                disabled={isProcessing}
              >
                {response}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Goal Complete Actions */}
      {currentStep === 'complete' && (
        <div className="p-4 border-t border-gray-800">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <button
              onClick={() => onNavigate('dashboard')}
              className="flex items-center gap-2 bg-yellow-400 text-black p-3 rounded-xl font-semibold hover:bg-yellow-300 transition-colors"
            >
              <Calendar className="w-4 h-4" />
              View Dashboard
            </button>
            <button
              onClick={() => onNavigate('analytics')}
              className="flex items-center gap-2 bg-gray-800 text-white p-3 rounded-xl font-semibold hover:bg-gray-700 transition-colors border border-gray-700"
            >
              <Target className="w-4 h-4" />
              Track Progress
            </button>
            <button className="flex items-center gap-2 bg-gray-800 text-white p-3 rounded-xl font-semibold hover:bg-gray-700 transition-colors border border-gray-700">
              <Clock className="w-4 h-4" />
              Set Reminders
            </button>
          </div>
        </div>
      )}

      {/* Input Area with Microphone */}
      {currentStep !== 'complete' && (
        <div className="fixed bottom-16 md:bottom-0 left-0 right-0 md:left-64 p-4 bg-black border-t border-gray-800">
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <textarea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Share your thoughts with Crushion... or use the mic!"
                className="w-full bg-gray-800 text-white rounded-xl p-3 pr-20 resize-none border border-gray-700 focus:border-yellow-400 focus:outline-none transition-colors"
                rows={1}
                disabled={isProcessing}
              />
              
              {/* Microphone and Send buttons */}
              <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex gap-1">
                <ProFeatureGate
                  isProFeature={true}
                  userPlan={user.plan}
                  betaAccess={appConfig.betaAccess}
                  featureName="Voice Input"
                  showUpgradePrompt={false}
                >
                  {speechSupported && (
                    <button
                      onClick={isListening ? stopListening : startListening}
                      disabled={isProcessing}
                      className={`p-2 rounded-lg transition-all ${
                        isListening 
                          ? 'bg-red-500 text-white animate-pulse' 
                          : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                      title={isListening ? 'Stop listening' : 'Start voice input'}
                    >
                      {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                    </button>
                  )}
                </ProFeatureGate>
                
                <button
                  onClick={handleSendMessage}
                  disabled={!inputValue.trim() || isProcessing}
                  className="bg-yellow-400 text-black p-2 rounded-lg hover:bg-yellow-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                >
                  {isProcessing ? (
                    <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Footer with current settings */}
          <div className="mt-2 text-center">
            <p className="text-xs text-gray-500">
              {hasVoiceAccess ? (
                <>
                  {preferAudio ? (
                    <>🔊 Audio mode: Crushion speaks automatically • Voice: {crushionVoiceStyle}</>
                  ) : (
                    <>👁️ Read mode: Click speak button to hear Crushion • Voice: {crushionVoiceStyle}</>
                  )}
                  {speechSupported && (
                    <> • 💬 Voice input available</>
                  )}
                  {appConfig.betaAccess && user.plan === 'free' && (
                    <> • ✨ Voice features free during beta</>
                  )}
                </>
              ) : (
                <>🔒 Voice features require Pro plan • Free during beta</>
              )}
              {!hasOpenAI && (
                <> • 🤖 Add OpenAI API key for real AI responses</>
              )}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};