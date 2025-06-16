import React, { useState } from 'react';
import { 
  HelpCircle, 
  Book, 
  MessageCircle, 
  Video, 
  Search,
  ChevronRight,
  Play,
  ExternalLink,
  Mail,
  Phone,
  Clock,
  CheckCircle,
  AlertCircle,
  Info,
  Lightbulb,
  Users,
  Zap,
  Shield,
  Target,
  Calendar,
  Trophy,
  Settings as SettingsIcon
} from 'lucide-react';

interface HelpCenterProps {
  onStartTutorial: () => void;
  onClose: () => void;
}

export const HelpCenter: React.FC<HelpCenterProps> = ({ onStartTutorial, onClose }) => {
  const [activeSection, setActiveSection] = useState<'overview' | 'tutorials' | 'faq' | 'contact'>('overview');
  const [searchQuery, setSearchQuery] = useState('');

  const helpSections = [
    { id: 'overview', label: 'Overview', icon: Book },
    { id: 'tutorials', label: 'Tutorials', icon: Video },
    { id: 'faq', label: 'FAQ', icon: HelpCircle },
    { id: 'contact', label: 'Contact', icon: MessageCircle },
  ];

  const quickStartGuides = [
    {
      title: "Getting Started with GoalCrusher",
      description: "Complete walkthrough of all features",
      duration: "2 min",
      icon: Target,
      action: onStartTutorial
    },
    {
      title: "Setting Up Your First Goal",
      description: "Learn how to use Crushion to plan your goals",
      duration: "3 min",
      icon: Zap,
      action: () => console.log('Goal setup tutorial')
    },
    {
      title: "Mastering the Dashboard",
      description: "Calendar views, task management, and scheduling",
      duration: "4 min",
      icon: Calendar,
      action: () => console.log('Dashboard tutorial')
    },
    {
      title: "Accountability & Social Features",
      description: "Connect with friends and boost success rates",
      duration: "3 min",
      icon: Shield,
      action: () => console.log('Social tutorial')
    }
  ];

  const videoTutorials = [
    {
      title: "GoalCrusher Overview",
      thumbnail: "🎯",
      duration: "5:30",
      views: "1.2K",
      description: "Complete introduction to the platform"
    },
    {
      title: "Advanced Scheduling Techniques",
      thumbnail: "📅",
      duration: "8:15",
      views: "856",
      description: "Master drag & drop and calendar features"
    },
    {
      title: "Building Accountability Networks",
      thumbnail: "🤝",
      duration: "6:45",
      views: "743",
      description: "Connect with partners and teams"
    },
    {
      title: "Gamification & Motivation",
      thumbnail: "🏆",
      duration: "4:20",
      views: "692",
      description: "Leverage XP, achievements, and streaks"
    }
  ];

  const faqItems = [
    {
      category: "Getting Started",
      icon: Target,
      questions: [
        {
          q: "How do I create my first goal?",
          a: "Click the 'Goal Wizard' in the navigation or the '+' button on your dashboard. Crushion will guide you through breaking down your goal into actionable steps."
        },
        {
          q: "What makes GoalCrusher different from other goal apps?",
          a: "GoalCrusher combines AI-powered goal planning, comprehensive accountability systems, social features, and gamification to create a complete goal achievement ecosystem."
        },
        {
          q: "Is my data secure and private?",
          a: "Yes! We use enterprise-grade encryption and never share your personal data. You can control data usage in Settings > AI & Privacy."
        }
      ]
    },
    {
      category: "Features",
      icon: Zap,
      questions: [
        {
          q: "How does the accountability system work?",
          a: "Choose from AI accountability (smart reminders), partner accountability (friends/mentors), team accountability (group support), or public accountability (social pressure)."
        },
        {
          q: "Can I customize Crushion's personality?",
          a: "Yes! Go to Settings > Audio & Voice to choose from friendly, motivational, professional, or casual voice styles."
        },
        {
          q: "How do I invite friends to join my goals?",
          a: "Use the social features in Settings > Friends or Gamification > Friends to send invites and create accountability partnerships."
        }
      ]
    },
    {
      category: "Troubleshooting",
      icon: AlertCircle,
      questions: [
        {
          q: "Voice features aren't working",
          a: "Ensure your browser has microphone permissions enabled. Voice features work best in Chrome, Safari, and Edge browsers."
        },
        {
          q: "My progress isn't syncing",
          a: "Check your internet connection and refresh the page. Data is saved locally and syncs when connection is restored."
        },
        {
          q: "How do I reset my progress?",
          a: "Go to Settings > Gamification and click 'Reset Progress'. This action cannot be undone, so please be certain."
        }
      ]
    }
  ];

  const contactOptions = [
    {
      type: "Email Support",
      icon: Mail,
      contact: "support@goalcrusher.app",
      description: "Get help within 24 hours",
      availability: "24/7"
    },
    {
      type: "Live Chat",
      icon: MessageCircle,
      contact: "Available in app",
      description: "Instant help from our team",
      availability: "Mon-Fri 9AM-6PM PST"
    },
    {
      type: "Phone Support",
      icon: Phone,
      contact: "+1 (555) 123-4567",
      description: "Speak directly with support",
      availability: "Mon-Fri 9AM-5PM PST"
    }
  ];

  const filteredFAQ = faqItems.map(category => ({
    ...category,
    questions: category.questions.filter(
      item => 
        item.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.a.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(category => category.questions.length > 0);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-xl border border-gray-800 max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <HelpCircle className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Help Center</h2>
                <p className="text-sm text-gray-400">Get help and learn about GoalCrusher</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
            >
              <span className="text-gray-400 text-xl">×</span>
            </button>
          </div>

          {/* Search */}
          <div className="mt-4 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search help articles..."
              className="w-full bg-gray-800 text-white pl-10 pr-4 py-2 rounded-lg border border-gray-700 focus:border-blue-400 focus:outline-none"
            />
          </div>
        </div>

        <div className="flex h-[calc(90vh-140px)]">
          {/* Sidebar */}
          <div className="w-64 border-r border-gray-800 p-4">
            <nav className="space-y-2">
              {helpSections.map((section) => {
                const Icon = section.icon;
                return (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id as any)}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors ${
                      activeSection === section.id
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    {section.label}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Content */}
          <div className="flex-1 p-6 overflow-y-auto">
            {/* Overview Section */}
            {activeSection === 'overview' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-2xl font-bold text-white mb-2">Welcome to GoalCrusher! 🎯</h3>
                  <p className="text-gray-300 text-lg">
                    Your AI-powered goal achievement platform. Here's everything you need to know to get started.
                  </p>
                </div>

                {/* Quick Start */}
                <div>
                  <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <Lightbulb className="w-5 h-5 text-yellow-400" />
                    Quick Start Guides
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {quickStartGuides.map((guide, index) => {
                      const Icon = guide.icon;
                      return (
                        <div key={index} className="bg-gray-800 rounded-lg p-4 hover:bg-gray-750 transition-colors cursor-pointer" onClick={guide.action}>
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                              <Icon className="w-5 h-5 text-white" />
                            </div>
                            <div className="flex-1">
                              <h5 className="text-white font-medium mb-1">{guide.title}</h5>
                              <p className="text-gray-400 text-sm mb-2">{guide.description}</p>
                              <div className="flex items-center gap-2">
                                <Clock className="w-3 h-3 text-gray-500" />
                                <span className="text-xs text-gray-500">{guide.duration}</span>
                              </div>
                            </div>
                            <ChevronRight className="w-4 h-4 text-gray-400" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Key Features */}
                <div>
                  <h4 className="text-lg font-semibold text-white mb-4">Key Features</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-gray-800 rounded-lg p-4">
                      <Zap className="w-8 h-8 text-yellow-400 mb-3" />
                      <h5 className="text-white font-medium mb-2">AI Goal Planning</h5>
                      <p className="text-gray-400 text-sm">Crushion helps break down complex goals into actionable steps</p>
                    </div>
                    <div className="bg-gray-800 rounded-lg p-4">
                      <Shield className="w-8 h-8 text-green-400 mb-3" />
                      <h5 className="text-white font-medium mb-2">Accountability System</h5>
                      <p className="text-gray-400 text-sm">Boost success rates with AI, partner, team, or public accountability</p>
                    </div>
                    <div className="bg-gray-800 rounded-lg p-4">
                      <Trophy className="w-8 h-8 text-purple-400 mb-3" />
                      <h5 className="text-white font-medium mb-2">Gamification</h5>
                      <p className="text-gray-400 text-sm">Earn XP, unlock achievements, and compete with friends</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tutorials Section */}
            {activeSection === 'tutorials' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-2xl font-bold text-white mb-2">Video Tutorials</h3>
                  <p className="text-gray-300">Learn GoalCrusher with step-by-step video guides</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {videoTutorials.map((video, index) => (
                    <div key={index} className="bg-gray-800 rounded-lg overflow-hidden hover:bg-gray-750 transition-colors cursor-pointer">
                      <div className="aspect-video bg-gray-700 flex items-center justify-center text-4xl">
                        {video.thumbnail}
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                          <Play className="w-12 h-12 text-white" />
                        </div>
                      </div>
                      <div className="p-4">
                        <h4 className="text-white font-medium mb-1">{video.title}</h4>
                        <p className="text-gray-400 text-sm mb-2">{video.description}</p>
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>{video.duration}</span>
                          <span>{video.views} views</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Interactive Tutorial */}
                <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 border border-blue-500/30 rounded-lg p-6">
                  <h4 className="text-white font-semibold mb-2 flex items-center gap-2">
                    <Target className="w-5 h-5 text-blue-400" />
                    Interactive Tutorial
                  </h4>
                  <p className="text-gray-300 mb-4">
                    Take the guided tour to learn all features hands-on. Perfect for first-time users!
                  </p>
                  <button
                    onClick={onStartTutorial}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    Start Interactive Tutorial
                  </button>
                </div>
              </div>
            )}

            {/* FAQ Section */}
            {activeSection === 'faq' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-2xl font-bold text-white mb-2">Frequently Asked Questions</h3>
                  <p className="text-gray-300">Find answers to common questions</p>
                </div>

                {(searchQuery ? filteredFAQ : faqItems).map((category, categoryIndex) => {
                  const CategoryIcon = category.icon;
                  return (
                    <div key={categoryIndex} className="bg-gray-800 rounded-lg overflow-hidden">
                      <div className="p-4 border-b border-gray-700">
                        <h4 className="text-white font-semibold flex items-center gap-2">
                          <CategoryIcon className="w-5 h-5 text-blue-400" />
                          {category.category}
                        </h4>
                      </div>
                      <div className="divide-y divide-gray-700">
                        {category.questions.map((item, index) => (
                          <details key={index} className="group">
                            <summary className="p-4 cursor-pointer hover:bg-gray-750 transition-colors">
                              <div className="flex items-center justify-between">
                                <span className="text-white font-medium">{item.q}</span>
                                <ChevronRight className="w-4 h-4 text-gray-400 group-open:rotate-90 transition-transform" />
                              </div>
                            </summary>
                            <div className="px-4 pb-4">
                              <p className="text-gray-300 leading-relaxed">{item.a}</p>
                            </div>
                          </details>
                        ))}
                      </div>
                    </div>
                  );
                })}

                {searchQuery && filteredFAQ.length === 0 && (
                  <div className="text-center py-8">
                    <HelpCircle className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-400">No results found for "{searchQuery}"</p>
                    <p className="text-gray-500 text-sm mt-1">Try different keywords or contact support</p>
                  </div>
                )}
              </div>
            )}

            {/* Contact Section */}
            {activeSection === 'contact' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-2xl font-bold text-white mb-2">Get in Touch</h3>
                  <p className="text-gray-300">Need help? Our support team is here for you</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {contactOptions.map((option, index) => {
                    const Icon = option.icon;
                    return (
                      <div key={index} className="bg-gray-800 rounded-lg p-6 text-center">
                        <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Icon className="w-6 h-6 text-white" />
                        </div>
                        <h4 className="text-white font-semibold mb-2">{option.type}</h4>
                        <p className="text-blue-400 font-medium mb-2">{option.contact}</p>
                        <p className="text-gray-400 text-sm mb-3">{option.description}</p>
                        <div className="flex items-center justify-center gap-1 text-xs text-gray-500">
                          <Clock className="w-3 h-3" />
                          {option.availability}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Contact Form */}
                <div className="bg-gray-800 rounded-lg p-6">
                  <h4 className="text-white font-semibold mb-4">Send us a message</h4>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <input
                        type="text"
                        placeholder="Your name"
                        className="bg-gray-700 text-white px-3 py-2 rounded border border-gray-600 focus:border-blue-400 focus:outline-none"
                      />
                      <input
                        type="email"
                        placeholder="Your email"
                        className="bg-gray-700 text-white px-3 py-2 rounded border border-gray-600 focus:border-blue-400 focus:outline-none"
                      />
                    </div>
                    <select className="w-full bg-gray-700 text-white px-3 py-2 rounded border border-gray-600 focus:border-blue-400 focus:outline-none">
                      <option value="">Select topic</option>
                      <option value="technical">Technical Issue</option>
                      <option value="account">Account Help</option>
                      <option value="feature">Feature Request</option>
                      <option value="billing">Billing Question</option>
                      <option value="other">Other</option>
                    </select>
                    <textarea
                      rows={4}
                      placeholder="Describe your question or issue..."
                      className="w-full bg-gray-700 text-white px-3 py-2 rounded border border-gray-600 focus:border-blue-400 focus:outline-none resize-none"
                    />
                    <button className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium">
                      Send Message
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};