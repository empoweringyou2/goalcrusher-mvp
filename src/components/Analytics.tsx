import React, { useState } from 'react';
import { BarChart3, TrendingUp, Clock, Target, Zap, Calendar, Shield, CheckCircle, AlertTriangle, XCircle, Repeat, Coffee, Moon, Sunrise, Heart, Briefcase, DollarSign, Users, Brain, Plus, Edit3, Trash2, Save, X, Flame } from 'lucide-react';
import { User, AppConfig } from '../types/user';

interface AnalyticsProps {
  user: User;
  appConfig: AppConfig;
}

export const Analytics: React.FC<AnalyticsProps> = ({ user, appConfig }) => {
  const [timeframe, setTimeframe] = useState<'week' | 'month' | 'year'>('week');
  const [showLifeDomainsModal, setShowLifeDomainsModal] = useState(false);
  const [editingDomain, setEditingDomain] = useState<number | null>(null);
  const [newDomainName, setNewDomainName] = useState('');
  const [newDomainIcon, setNewDomainIcon] = useState('Target');

  // Life Domains data
  const [lifeDomains, setLifeDomains] = useState([
    { 
      id: 1, 
      name: 'Fitness & Health', 
      icon: Heart, 
      color: 'bg-red-500', 
      completed: 18, 
      total: 21, 
      weeklyProgress: [85, 90, 78, 92, 88, 95, 85],
      isDefault: true
    },
    { 
      id: 2, 
      name: 'Career & Work', 
      icon: Briefcase, 
      color: 'bg-blue-500', 
      completed: 24, 
      total: 30, 
      weeklyProgress: [70, 75, 80, 85, 90, 88, 92],
      isDefault: true
    },
    { 
      id: 3, 
      name: 'Wealth & Finance', 
      icon: DollarSign, 
      color: 'bg-green-500', 
      completed: 12, 
      total: 15, 
      weeklyProgress: [60, 65, 70, 75, 80, 85, 80],
      isDefault: true
    },
    { 
      id: 4, 
      name: 'Social & Relationships', 
      icon: Users, 
      color: 'bg-purple-500', 
      completed: 8, 
      total: 12, 
      weeklyProgress: [50, 55, 60, 65, 70, 75, 67],
      isDefault: true
    },
    { 
      id: 5, 
      name: 'Mental Health', 
      icon: Brain, 
      color: 'bg-pink-500', 
      completed: 15, 
      total: 18, 
      weeklyProgress: [80, 85, 82, 88, 90, 87, 83],
      isDefault: true
    },
    { 
      id: 6, 
      name: 'Learning & Growth', 
      icon: Target, 
      color: 'bg-yellow-500', 
      completed: 10, 
      total: 14, 
      weeklyProgress: [65, 70, 75, 72, 78, 80, 71],
      isDefault: false
    },
  ]);

  const availableIcons = [
    { name: 'Target', icon: Target },
    { name: 'Heart', icon: Heart },
    { name: 'Briefcase', icon: Briefcase },
    { name: 'DollarSign', icon: DollarSign },
    { name: 'Users', icon: Users },
    { name: 'Brain', icon: Brain },
    { name: 'Zap', icon: Zap },
    { name: 'Calendar', icon: Calendar },
    { name: 'Coffee', icon: Coffee },
    { name: 'Moon', icon: Moon },
    { name: 'Sunrise', icon: Sunrise },
  ];

  const progressData = [
    { day: 'Mon', completed: 8, total: 10, xp: 320 },
    { day: 'Tue', completed: 6, total: 8, xp: 240 },
    { day: 'Wed', completed: 9, total: 12, xp: 360 },
    { day: 'Thu', completed: 7, total: 9, xp: 280 },
    { day: 'Fri', completed: 11, total: 14, xp: 440 },
    { day: 'Sat', completed: 5, total: 7, xp: 200 },
    { day: 'Sun', completed: 8, total: 10, xp: 320 },
  ];

  const categoryData = [
    { category: 'Work', completed: 24, total: 30, color: 'bg-blue-500' },
    { category: 'Health', completed: 18, total: 21, color: 'bg-green-500' },
    { category: 'Learning', completed: 12, total: 15, color: 'bg-purple-500' },
    { category: 'Personal', completed: 8, total: 12, color: 'bg-yellow-500' },
  ];

  // Accountability data
  const accountabilityData = {
    overall: 87, // Overall accountability score
    breakdown: {
      ai: { completed: 23, total: 25, percentage: 92 },
      partner: { completed: 15, total: 18, percentage: 83 },
      team: { completed: 8, total: 10, percentage: 80 },
      public: { completed: 4, total: 5, percentage: 80 }
    },
    weeklyTrend: [78, 82, 85, 87, 89, 87, 87], // Last 7 days
    recentCommitments: [
      { type: 'ai', task: 'Morning Meditation', status: 'completed', daysAgo: 0 },
      { type: 'partner', task: 'Gym Workout', status: 'missed', daysAgo: 1 },
      { type: 'team', task: 'Project Review', status: 'completed', daysAgo: 1 },
      { type: 'ai', task: 'Read 20 pages', status: 'completed', daysAgo: 2 },
      { type: 'public', task: 'Weekly Blog Post', status: 'pending', daysAgo: 0 },
    ]
  };

  // Daily Rituals/Habits data
  const habitsData = {
    dailyHabits: [
      { 
        id: 1, 
        name: 'Morning Meditation', 
        icon: Sunrise, 
        streak: 47, 
        completedToday: true, 
        weeklyCompletion: [true, true, false, true, true, true, true],
        category: 'wellness',
        targetTime: '07:00',
        duration: 20
      },
      { 
        id: 2, 
        name: 'Evening Journal', 
        icon: Moon, 
        streak: 23, 
        completedToday: false, 
        weeklyCompletion: [true, true, true, false, true, true, false],
        category: 'personal',
        targetTime: '21:00',
        duration: 15
      },
      { 
        id: 3, 
        name: 'Morning Coffee Ritual', 
        icon: Coffee, 
        streak: 89, 
        completedToday: true, 
        weeklyCompletion: [true, true, true, true, true, true, true],
        category: 'wellness',
        targetTime: '06:30',
        duration: 10
      },
      { 
        id: 4, 
        name: 'Daily Reading', 
        icon: Target, 
        streak: 12, 
        completedToday: true, 
        weeklyCompletion: [false, true, true, true, true, false, true],
        category: 'growth',
        targetTime: '20:00',
        duration: 30
      },
    ],
    weeklyStats: {
      totalHabits: 4,
      completedToday: 3,
      averageCompletion: 78,
      longestStreak: 89,
      habitsMissedThisWeek: 6
    },
    monthlyTrends: [
      { week: 'Week 1', completion: 85 },
      { week: 'Week 2', completion: 72 },
      { week: 'Week 3', completion: 89 },
      { week: 'Week 4', completion: 78 },
    ]
  };

  const insights = [
    {
      title: 'Peak Performance Time',
      description: 'You complete most tasks between 9-11 AM',
      icon: Clock,
      color: 'text-blue-400',
    },
    {
      title: 'Strongest Category',
      description: 'Work goals have 89% completion rate',
      icon: Target,
      color: 'text-green-400',
    },
    {
      title: 'Improvement Area',
      description: 'Weekend productivity could be 25% higher',
      icon: TrendingUp,
      color: 'text-yellow-400',
    },
  ];

  const maxCompleted = Math.max(...progressData.map(d => d.completed));

  const getAccountabilityColor = (percentage: number) => {
    if (percentage >= 90) return 'text-green-400';
    if (percentage >= 75) return 'text-yellow-400';
    if (percentage >= 60) return 'text-orange-400';
    return 'text-red-400';
  };

  const getAccountabilityBgColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-green-500';
    if (percentage >= 75) return 'bg-yellow-500';
    if (percentage >= 60) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'missed': return <XCircle className="w-4 h-4 text-red-400" />;
      case 'pending': return <AlertTriangle className="w-4 h-4 text-yellow-400" />;
      default: return null;
    }
  };

  const getAccountabilityTypeInfo = (type: string) => {
    switch (type) {
      case 'ai': return { name: 'AI', color: 'text-blue-400', bgColor: 'bg-blue-500/20' };
      case 'partner': return { name: 'Partner', color: 'text-green-400', bgColor: 'bg-green-500/20' };
      case 'team': return { name: 'Team', color: 'text-purple-400', bgColor: 'bg-purple-500/20' };
      case 'public': return { name: 'Public', color: 'text-yellow-400', bgColor: 'bg-yellow-500/20' };
      default: return { name: 'Unknown', color: 'text-gray-400', bgColor: 'bg-gray-500/20' };
    }
  };

  const getHabitCategoryColor = (category: string) => {
    switch (category) {
      case 'wellness': return 'text-green-400';
      case 'personal': return 'text-purple-400';
      case 'growth': return 'text-blue-400';
      case 'fitness': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getStreakColor = (streak: number) => {
    if (streak >= 50) return 'text-yellow-400';
    if (streak >= 30) return 'text-green-400';
    if (streak >= 7) return 'text-blue-400';
    return 'text-gray-400';
  };

  const addLifeDomain = () => {
    if (!newDomainName.trim()) return;
    
    const selectedIcon = availableIcons.find(icon => icon.name === newDomainIcon)?.icon || Target;
    const colors = ['bg-indigo-500', 'bg-orange-500', 'bg-teal-500', 'bg-cyan-500', 'bg-lime-500'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    
    const newDomain = {
      id: Date.now(),
      name: newDomainName,
      icon: selectedIcon,
      color: randomColor,
      completed: 0,
      total: 0,
      weeklyProgress: [0, 0, 0, 0, 0, 0, 0],
      isDefault: false
    };
    
    setLifeDomains([...lifeDomains, newDomain]);
    setNewDomainName('');
    setNewDomainIcon('Target');
  };

  const deleteLifeDomain = (id: number) => {
    setLifeDomains(lifeDomains.filter(domain => domain.id !== id));
  };

  const startEditingDomain = (id: number) => {
    const domain = lifeDomains.find(d => d.id === id);
    if (domain) {
      setEditingDomain(id);
      setNewDomainName(domain.name);
      setNewDomainIcon(availableIcons.find(icon => icon.icon === domain.icon)?.name || 'Target');
    }
  };

  const saveEditDomain = () => {
    if (!editingDomain || !newDomainName.trim()) return;
    
    const selectedIcon = availableIcons.find(icon => icon.name === newDomainIcon)?.icon || Target;
    
    setLifeDomains(lifeDomains.map(domain => 
      domain.id === editingDomain 
        ? { ...domain, name: newDomainName, icon: selectedIcon }
        : domain
    ));
    
    setEditingDomain(null);
    setNewDomainName('');
    setNewDomainIcon('Target');
  };

  const cancelEditDomain = () => {
    setEditingDomain(null);
    setNewDomainName('');
    setNewDomainIcon('Target');
  };

  // Life Domains Modal
  const LifeDomainsModal = () => (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-xl border border-gray-800 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        <div className="p-4 border-b border-gray-800">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <Target className="w-5 h-5 text-yellow-400" />
              Manage Life Domains
            </h3>
            <button
              onClick={() => setShowLifeDomainsModal(false)}
              className="p-1 hover:bg-gray-800 rounded"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>
        
        <div className="p-4 space-y-6">
          {/* Add/Edit Domain */}
          <div className="bg-gray-800 rounded-lg p-4">
            <h4 className="text-white font-medium mb-3">
              {editingDomain ? 'Edit Life Domain' : 'Add New Life Domain'}
            </h4>
            <div className="space-y-3">
              <input
                type="text"
                value={newDomainName}
                onChange={(e) => setNewDomainName(e.target.value)}
                placeholder="Domain name (e.g., Spirituality, Hobbies, Travel)"
                className="w-full bg-gray-700 text-white px-3 py-2 rounded border border-gray-600 focus:border-yellow-400 focus:outline-none"
                autoComplete="off"
              />
              
              <div>
                <label className="block text-sm text-gray-400 mb-2">Choose Icon:</label>
                <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
                  {availableIcons.map((iconOption) => {
                    const IconComponent = iconOption.icon;
                    return (
                      <button
                        key={iconOption.name}
                        type="button"
                        onClick={() => setNewDomainIcon(iconOption.name)}
                        className={`p-3 rounded-lg border-2 transition-colors ${
                          newDomainIcon === iconOption.name
                            ? 'border-yellow-400 bg-yellow-400/10'
                            : 'border-gray-600 hover:border-gray-500'
                        }`}
                      >
                        <IconComponent className="w-5 h-5 text-white mx-auto" />
                      </button>
                    );
                  })}
                </div>
              </div>
              
              <div className="flex flex-col md:flex-row gap-2">
                <button
                  type="button"
                  onClick={editingDomain ? saveEditDomain : addLifeDomain}
                  disabled={!newDomainName.trim()}
                  className="flex-1 bg-yellow-400 text-black py-2 rounded-lg font-medium hover:bg-yellow-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {editingDomain ? 'Save Changes' : 'Add Domain'}
                </button>
                {editingDomain && (
                  <button
                    type="button"
                    onClick={cancelEditDomain}
                    className="px-4 bg-gray-600 text-white py-2 rounded-lg font-medium hover:bg-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Current Domains */}
          <div>
            <h4 className="text-white font-medium mb-3">Current Life Domains</h4>
            <div className="space-y-2">
              {lifeDomains.map((domain) => {
                const IconComponent = domain.icon;
                const percentage = domain.total > 0 ? Math.round((domain.completed / domain.total) * 100) : 0;
                
                return (
                  <div key={domain.id} className="flex flex-col md:flex-row md:items-center justify-between p-3 bg-gray-800 rounded-lg gap-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full ${domain.color} flex items-center justify-center`}>
                        <IconComponent className="w-5 h-5 text-white" />
                      </div>
                      <div className="min-w-0">
                        <h5 className="text-white font-medium">{domain.name}</h5>
                        <div className="flex flex-wrap items-center gap-2 md:gap-4 text-sm text-gray-400">
                          <span>{domain.completed}/{domain.total} goals</span>
                          <span>{percentage}% completion</span>
                          {domain.isDefault && (
                            <span className="text-yellow-400 text-xs">Default</span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => startEditingDomain(domain.id)}
                        className="p-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                        title="Edit"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      {!domain.isDefault && (
                        <button
                          type="button"
                          onClick={() => deleteLifeDomain(domain.id)}
                          className="p-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-4 md:p-6 pb-20 md:pb-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">Analytics & Insights</h1>
          <p className="text-gray-400">Track your progress and discover patterns</p>
        </div>
        
        <div className="flex bg-gray-800 rounded-lg p-1">
          {(['week', 'month', 'year'] as const).map((period) => (
            <button
              key={period}
              onClick={() => setTimeframe(period)}
              className={`px-3 md:px-4 py-2 rounded-md text-sm font-medium capitalize transition-colors ${
                timeframe === period
                  ? 'bg-yellow-400 text-black'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {period}
            </button>
          ))}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
        <div className="bg-gray-900 rounded-xl p-3 md:p-4 border border-gray-800">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-4 md:w-5 h-4 md:h-5 text-green-500" />
            <span className="text-xs md:text-sm text-gray-400">Completion Rate</span>
          </div>
          <p className="text-xl md:text-2xl font-bold text-white">84%</p>
          <p className="text-xs text-green-400">+5% from last week</p>
        </div>
        
        <div className="bg-gray-900 rounded-xl p-3 md:p-4 border border-gray-800">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-4 md:w-5 h-4 md:h-5 text-yellow-400" />
            <span className="text-xs md:text-sm text-gray-400">Avg Daily XP</span>
          </div>
          <p className="text-xl md:text-2xl font-bold text-white">324</p>
          <p className="text-xs text-yellow-400">+12 from last week</p>
        </div>
        
        <div className="bg-gray-900 rounded-xl p-3 md:p-4 border border-gray-800">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 md:w-5 h-4 md:h-5 text-blue-500" />
            <span className="text-xs md:text-sm text-gray-400">Focus Hours</span>
          </div>
          <p className="text-xl md:text-2xl font-bold text-white">28.5</p>
          <p className="text-xs text-blue-400">This week</p>
        </div>
        
        <div className="bg-gray-900 rounded-xl p-3 md:p-4 border border-gray-800">
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 className="w-4 md:w-5 h-4 md:h-5 text-purple-500" />
            <span className="text-xs md:text-sm text-gray-400">Active Goals</span>
          </div>
          <p className="text-xl md:text-2xl font-bold text-white">12</p>
          <p className="text-xs text-purple-400">Across {lifeDomains.length} domains</p>
        </div>
      </div>

      {/* Life Domains Breakdown */}
      <div className="bg-gray-900 rounded-xl p-4 md:p-6 border border-gray-800 mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-4">
          <h3 className="text-xl font-semibold text-white flex items-center gap-2">
            <Target className="w-5 h-5 text-yellow-400" />
            Life Domains Progress
          </h3>
          <button
            onClick={() => setShowLifeDomainsModal(true)}
            className="bg-yellow-400 text-black px-4 py-2 rounded-lg font-medium hover:bg-yellow-300 transition-colors flex items-center gap-2 w-fit"
          >
            <Plus className="w-4 h-4" />
            <span className="text-sm md:text-base">Manage Domains</span>
          </button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {lifeDomains.map((domain) => {
            const IconComponent = domain.icon;
            const percentage = domain.total > 0 ? Math.round((domain.completed / domain.total) * 100) : 0;
            const weeklyAvg = Math.round(domain.weeklyProgress.reduce((a, b) => a + b, 0) / 7);
            
            return (
              <div key={domain.id} className="bg-gray-800 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-10 md:w-12 h-10 md:h-12 rounded-full ${domain.color} flex items-center justify-center`}>
                    <IconComponent className="w-5 md:w-6 h-5 md:h-6 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-white font-medium text-sm md:text-base">{domain.name}</h4>
                    <p className="text-sm text-gray-400">{domain.completed}/{domain.total} goals</p>
                  </div>
                </div>
                
                <div className="mb-3">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm text-gray-400">Completion</span>
                    <span className="text-sm font-medium text-white">{percentage}%</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-300 ${domain.color}`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
                
                <div className="mb-3">
                  <p className="text-xs text-gray-400 mb-2">Weekly Trend</p>
                  <div className="flex items-end justify-between h-8 gap-1">
                    {domain.weeklyProgress.map((progress, index) => (
                      <div
                        key={index}
                        className={`flex-1 rounded-t transition-all duration-300 ${domain.color} opacity-70`}
                        style={{ height: `${(progress / 100) * 32}px` }}
                      />
                    ))}
                  </div>
                </div>
                
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-400">Weekly Avg: {weeklyAvg}%</span>
                  <span className={`font-medium ${
                    weeklyAvg >= 80 ? 'text-green-400' : 
                    weeklyAvg >= 60 ? 'text-yellow-400' : 'text-red-400'
                  }`}>
                    {weeklyAvg >= 80 ? 'Excellent' : weeklyAvg >= 60 ? 'Good' : 'Needs Focus'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Life Domain Insights */}
        <div className="bg-gray-800 rounded-lg p-4">
          <h4 className="text-white font-medium mb-3">Domain Insights</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-xl md:text-2xl font-bold text-green-400">
                {lifeDomains.find(d => d.name === 'Career & Work')?.completed || 0}
              </p>
              <p className="text-sm text-gray-400">Strongest Domain</p>
              <p className="text-xs text-green-400">Career & Work</p>
            </div>
            <div className="text-center">
              <p className="text-xl md:text-2xl font-bold text-yellow-400">
                {Math.round(lifeDomains.reduce((acc, domain) => {
                  const percentage = domain.total > 0 ? (domain.completed / domain.total) * 100 : 0;
                  return acc + percentage;
                }, 0) / lifeDomains.length)}%
              </p>
              <p className="text-sm text-gray-400">Overall Balance</p>
              <p className="text-xs text-yellow-400">Across all domains</p>
            </div>
            <div className="text-center">
              <p className="text-xl md:text-2xl font-bold text-blue-400">
                {lifeDomains.filter(d => {
                  const weeklyAvg = d.weeklyProgress.reduce((a, b) => a + b, 0) / 7;
                  return weeklyAvg > 75;
                }).length}
              </p>
              <p className="text-sm text-gray-400">Thriving Domains</p>
              <p className="text-xs text-blue-400">Above 75% weekly avg</p>
            </div>
          </div>
        </div>
      </div>

      {/* Daily Rituals/Habits Tracker */}
      <div className="bg-gray-900 rounded-xl p-4 md:p-6 border border-gray-800 mb-6">
        <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <Repeat className="w-5 h-5 text-yellow-400" />
          Daily Rituals & Habits
        </h3>
        
        {/* Habits Overview Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4 mb-6">
          <div className="text-center">
            <p className="text-xl md:text-2xl font-bold text-white">{habitsData.weeklyStats.completedToday}</p>
            <p className="text-xs text-gray-400">Completed Today</p>
          </div>
          <div className="text-center">
            <p className="text-xl md:text-2xl font-bold text-green-400">{habitsData.weeklyStats.averageCompletion}%</p>
            <p className="text-xs text-gray-400">Weekly Average</p>
          </div>
          <div className="text-center">
            <p className={`text-xl md:text-2xl font-bold ${getStreakColor(habitsData.weeklyStats.longestStreak)}`}>
              {habitsData.weeklyStats.longestStreak}
            </p>
            <p className="text-xs text-gray-400">Longest Streak</p>
          </div>
          <div className="text-center">
            <p className="text-xl md:text-2xl font-bold text-white">{habitsData.weeklyStats.totalHabits}</p>
            <p className="text-xs text-gray-400">Active Habits</p>
          </div>
          <div className="text-center">
            <p className="text-xl md:text-2xl font-bold text-red-400">{habitsData.weeklyStats.habitsMissedThisWeek}</p>
            <p className="text-xs text-gray-400">Missed This Week</p>
          </div>
        </div>

        {/* Individual Habits */}
        <div className="space-y-4 mb-6">
          {habitsData.dailyHabits.map((habit) => {
            const Icon = habit.icon;
            const weeklyCompletionRate = (habit.weeklyCompletion.filter(Boolean).length / 7) * 100;
            
            return (
              <div key={habit.id} className="bg-gray-800 rounded-lg p-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-3 gap-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 md:w-12 h-10 md:h-12 rounded-full flex items-center justify-center ${
                      habit.completedToday ? 'bg-green-500' : 'bg-gray-700'
                    }`}>
                      <Icon className="w-5 md:w-6 h-5 md:h-6 text-white" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-white font-medium">{habit.name}</h4>
                      <div className="flex flex-wrap items-center gap-2 md:gap-4 text-sm text-gray-400">
                        <span className={getHabitCategoryColor(habit.category)}>
                          {habit.category}
                        </span>
                        <span>{habit.targetTime}</span>
                        <span>{habit.duration}min</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-center md:text-right">
                    <div className={`text-lg md:text-xl font-bold ${getStreakColor(habit.streak)} flex items-center gap-1 justify-center md:justify-end`}>
                      <Flame className="w-4 md:w-5 h-4 md:h-5" />
                      {habit.streak}
                    </div>
                    <p className="text-xs text-gray-400">day streak</p>
                  </div>
                </div>
                
                {/* Weekly completion visualization */}
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-sm text-gray-400 w-16">This week:</span>
                  <div className="flex gap-1 flex-1">
                    {habit.weeklyCompletion.map((completed, index) => (
                      <div
                        key={index}
                        className={`h-6 flex-1 rounded ${
                          completed ? 'bg-green-500' : 'bg-gray-700'
                        }`}
                        title={`${['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][index]}: ${completed ? 'Completed' : 'Missed'}`}
                      />
                    ))}
                  </div>
                  <span className={`text-sm font-medium ${getAccountabilityColor(weeklyCompletionRate)}`}>
                    {Math.round(weeklyCompletionRate)}%
                  </span>
                </div>
                
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <span className={`text-sm ${habit.completedToday ? 'text-green-400' : 'text-gray-400'}`}>
                    {habit.completedToday ? '✅ Completed today' : '⏳ Pending today'}
                  </span>
                  
                  {!habit.completedToday && (
                    <button className="bg-yellow-400 text-black px-4 py-2 rounded-lg text-sm font-medium hover:bg-yellow-300 transition-colors w-full md:w-auto">
                      Mark Complete
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Monthly Trends */}
        <div>
          <h4 className="text-white font-medium mb-3">Monthly Habit Completion Trends</h4>
          <div className="flex items-end justify-between h-20 gap-2">
            {habitsData.monthlyTrends.map((week, index) => (
              <div key={index} className="flex-1 flex flex-col items-center">
                <div 
                  className={`w-full rounded-t transition-all duration-300 ${getAccountabilityBgColor(week.completion)}`}
                  style={{ height: `${(week.completion / 100) * 60}px` }}
                />
                <p className="text-xs text-gray-400 mt-1">{week.completion}%</p>
                <p className="text-xs text-gray-500">{week.week}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Accountability Meter */}
      <div className="bg-gray-900 rounded-xl p-4 md:p-6 border border-gray-800 mb-6">
        <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <Shield className="w-5 h-5 text-yellow-400" />
          Accountability Meter
        </h3>
        
        {/* Overall Score */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-white font-medium">Overall Accountability Score</span>
            <span className={`text-2xl md:text-3xl font-bold ${getAccountabilityColor(accountabilityData.overall)}`}>
              {accountabilityData.overall}%
            </span>
          </div>
          
          <div className="w-full bg-gray-700 rounded-full h-3 mb-2">
            <div 
              className={`h-3 rounded-full transition-all duration-500 ${getAccountabilityBgColor(accountabilityData.overall)}`}
              style={{ width: `${accountabilityData.overall}%` }}
            />
          </div>
          
          <p className="text-sm text-gray-400">
            You're sticking to {accountabilityData.overall}% of your committed actions this week
          </p>
        </div>

        {/* Accountability Type Breakdown */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
          {Object.entries(accountabilityData.breakdown).map(([type, data]) => {
            const typeInfo = getAccountabilityTypeInfo(type);
            return (
              <div key={type} className={`p-3 md:p-4 rounded-lg border ${typeInfo.bgColor} border-gray-700`}>
                <div className="text-center">
                  <p className={`text-sm font-medium ${typeInfo.color} mb-1`}>{typeInfo.name}</p>
                  <p className={`text-lg md:text-xl font-bold ${getAccountabilityColor(data.percentage)}`}>
                    {data.percentage}%
                  </p>
                  <p className="text-xs text-gray-400">{data.completed}/{data.total} completed</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Weekly Trend */}
        <div className="mb-6">
          <h4 className="text-white font-medium mb-3">7-Day Accountability Trend</h4>
          <div className="flex items-end justify-between h-20 gap-1">
            {accountabilityData.weeklyTrend.map((score, index) => (
              <div key={index} className="flex-1 flex flex-col items-center">
                <div 
                  className={`w-full rounded-t transition-all duration-300 ${getAccountabilityBgColor(score)}`}
                  style={{ height: `${(score / 100) * 60}px` }}
                />
                <p className="text-xs text-gray-400 mt-1">{score}%</p>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Commitments */}
        <div>
          <h4 className="text-white font-medium mb-3">Recent Accountability Actions</h4>
          <div className="space-y-2">
            {accountabilityData.recentCommitments.map((commitment, index) => {
              const typeInfo = getAccountabilityTypeInfo(commitment.type);
              return (
                <div key={index} className="flex flex-col md:flex-row md:items-center gap-3 p-2 bg-gray-800 rounded-lg">
                  <div className={`px-2 py-1 rounded text-xs font-medium ${typeInfo.color} ${typeInfo.bgColor} w-fit`}>
                    {typeInfo.name}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm">{commitment.task}</p>
                    <p className="text-gray-400 text-xs">
                      {commitment.daysAgo === 0 ? 'Today' : `${commitment.daysAgo} day${commitment.daysAgo > 1 ? 's' : ''} ago`}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    {getStatusIcon(commitment.status)}
                    <span className={`text-xs capitalize ${
                      commitment.status === 'completed' ? 'text-green-400' :
                      commitment.status === 'missed' ? 'text-red-400' : 'text-yellow-400'
                    }`}>
                      {commitment.status}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Weekly Progress Chart */}
      <div className="bg-gray-900 rounded-xl p-4 md:p-6 border border-gray-800 mb-6">
        <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <BarChart3 className="w-5 h-5" />
          Weekly Progress
        </h3>
        
        <div className="flex items-end justify-between h-48 gap-2">
          {progressData.map((day, index) => (
            <div key={day.day} className="flex-1 flex flex-col items-center">
              <div className="w-full relative mb-2">
                {/* Total bar (background) */}
                <div 
                  className="w-full bg-gray-700 rounded-t"
                  style={{ height: `${(day.total / 14) * 120}px` }}
                />
                {/* Completed bar (foreground) */}
                <div 
                  className="w-full bg-yellow-400 rounded-t absolute bottom-0"
                  style={{ height: `${(day.completed / 14) * 120}px` }}
                />
              </div>
              
              <div className="text-center">
                <p className="text-sm font-medium text-white">{day.completed}/{day.total}</p>
                <p className="text-xs text-yellow-400">{day.xp} XP</p>
                <p className="text-xs text-gray-400 mt-1">{day.day}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="bg-gray-900 rounded-xl p-4 md:p-6 border border-gray-800 mb-6">
        <h3 className="text-xl font-semibold text-white mb-4">Goal Categories</h3>
        
        <div className="space-y-4">
          {categoryData.map((category) => {
            const percentage = Math.round((category.completed / category.total) * 100);
            return (
              <div key={category.category}>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-white font-medium">{category.category}</span>
                  <span className="text-gray-400 text-sm">
                    {category.completed}/{category.total} ({percentage}%)
                  </span>
                </div>
                
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-300 ${category.color}`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* AI Insights */}
      <div className="bg-gray-900 rounded-xl p-4 md:p-6 border border-gray-800">
        <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <Zap className="w-5 h-5 text-yellow-400" />
          Crushion's Insights
        </h3>
        
        <div className="space-y-4">
          {insights.map((insight, index) => {
            const Icon = insight.icon;
            return (
              <div key={index} className="flex items-start gap-3 p-3 bg-gray-800 rounded-lg">
                <Icon className={`w-5 h-5 mt-0.5 ${insight.color} flex-shrink-0`} />
                <div className="min-w-0">
                  <h4 className="font-medium text-white">{insight.title}</h4>
                  <p className="text-sm text-gray-400 mt-1">{insight.description}</p>
                </div>
              </div>
            );
          })}
        </div>
        
        <div className="mt-6 p-4 bg-yellow-400/10 border border-yellow-400/20 rounded-lg">
          <p className="text-yellow-400 font-medium mb-2">💡 Crushion's Tip</p>
          <p className="text-white text-sm">
            Your <strong>Career & Work</strong> domain is performing exceptionally well! Consider applying similar strategies to your <strong>Social & Relationships</strong> domain, which could benefit from more consistent attention.
          </p>
        </div>
      </div>

      {/* Life Domains Modal */}
      {showLifeDomainsModal && <LifeDomainsModal />}
    </div>
  );
};