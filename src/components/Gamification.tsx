import React, { useState } from 'react';
import { Trophy, Medal, Flame, Star, Users, Crown, Target, Zap, Shield, CheckCircle, AlertTriangle, XCircle, Repeat, Coffee, Moon, Sunrise, Calendar, MessageCircle, Gamepad2, UserPlus, Heart } from 'lucide-react';

export const Gamification: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'achievements' | 'leaderboard' | 'teams' | 'accountability' | 'habits' | 'friends'>('achievements');

  const achievements = [
    { id: 1, title: 'Goal Crusher', description: 'Complete your first goal', icon: Trophy, unlocked: true, rarity: 'common' },
    { id: 2, title: 'Streak Master', description: 'Maintain a 30-day streak', icon: Flame, unlocked: true, rarity: 'rare' },
    { id: 3, title: 'Early Bird', description: 'Complete morning tasks for 7 days', icon: Star, unlocked: true, rarity: 'common' },
    { id: 4, title: 'Wizard Apprentice', description: 'Use Crushion 50 times', icon: Target, unlocked: false, rarity: 'epic' },
    { id: 5, title: 'Team Player', description: 'Join a goal team', icon: Users, unlocked: false, rarity: 'rare' },
    { id: 6, title: 'Legend', description: 'Reach level 100', icon: Crown, unlocked: false, rarity: 'legendary' },
    { id: 7, title: 'Accountability Champion', description: 'Maintain 95% accountability for 30 days', icon: Shield, unlocked: true, rarity: 'epic' },
    { id: 8, title: 'Promise Keeper', description: 'Complete 100 accountability commitments', icon: CheckCircle, unlocked: false, rarity: 'rare' },
    { id: 9, title: 'Habit Master', description: 'Maintain 4 daily habits for 30 days', icon: Repeat, unlocked: true, rarity: 'epic' },
    { id: 10, title: 'Morning Warrior', description: 'Complete morning routine for 50 days', icon: Sunrise, unlocked: false, rarity: 'rare' },
    { id: 11, title: 'Social Butterfly', description: 'Add 10 friends', icon: Heart, unlocked: true, rarity: 'common' },
    { id: 12, title: 'Motivator', description: 'Help 5 friends achieve their goals', icon: Users, unlocked: false, rarity: 'rare' },
  ];

  const leaderboard = [
    { rank: 1, name: 'Sarah Chen', xp: 15420, avatar: '👩‍💼', streak: 89, accountability: 94 },
    { rank: 2, name: 'Marcus Johnson', xp: 14850, avatar: '👨‍🎨', streak: 67, accountability: 91 },
    { rank: 3, name: 'You', xp: 12340, avatar: '🧙‍♂️', streak: 47, accountability: 87 },
    { rank: 4, name: 'Emma Rodriguez', xp: 11890, avatar: '👩‍🔬', streak: 34, accountability: 89 },
    { rank: 5, name: 'Alex Kim', xp: 10550, avatar: '👨‍💻', streak: 28, accountability: 85 },
  ];

  const teams = [
    { id: 1, name: 'Productivity Ninjas', members: 234, category: 'Productivity', xp: 45680, joined: true, accountability: 92 },
    { id: 2, name: 'Fitness Warriors', members: 189, category: 'Health', xp: 38290, joined: false, accountability: 88 },
    { id: 3, name: 'Learning Legends', members: 156, category: 'Education', xp: 34570, joined: false, accountability: 90 },
    { id: 4, name: 'Creative Minds', members: 98, category: 'Creativity', xp: 28340, joined: false, accountability: 86 },
  ];

  // Friends data
  const friends = [
    { id: 1, name: 'Sarah Chen', avatar: '👩‍💼', level: 15, xp: 15420, status: 'online', mutualGoals: 3, lastActive: '2 minutes ago', streak: 89, isFriend: true },
    { id: 2, name: 'Marcus Johnson', avatar: '👨‍🎨', level: 14, xp: 14850, status: 'offline', mutualGoals: 1, lastActive: '1 hour ago', streak: 67, isFriend: true },
    { id: 3, name: 'Emma Rodriguez', avatar: '👩‍🔬', level: 12, xp: 11890, status: 'online', mutualGoals: 2, lastActive: 'Just now', streak: 34, isFriend: true },
    { id: 4, name: 'Alex Kim', avatar: '👨‍💻', level: 10, xp: 10550, status: 'away', mutualGoals: 4, lastActive: '30 minutes ago', streak: 28, isFriend: true },
    { id: 5, name: 'Dr. Jennifer Lee', avatar: '👩‍🏫', level: 18, xp: 18750, status: 'online', mutualGoals: 0, lastActive: '5 minutes ago', streak: 102, isFriend: false },
    { id: 6, name: 'Captain Mike', avatar: '👨‍🚀', level: 16, xp: 16200, status: 'offline', mutualGoals: 0, lastActive: '2 hours ago', streak: 45, isFriend: false },
  ];

  const friendRequests = [
    { id: 1, name: 'John Smith', avatar: '👨‍💼', level: 8, mutualFriends: 2, message: 'Hey! Would love to be accountability partners!' },
    { id: 2, name: 'Lisa Wang', avatar: '👩‍🎓', level: 11, mutualFriends: 1, message: 'Saw your fitness goals, let\'s motivate each other!' },
  ];

  const friendChallenges = [
    { id: 1, name: '7-Day Productivity Sprint', participants: ['Sarah Chen', 'Marcus Johnson', 'You'], daysLeft: 3, progress: 65 },
    { id: 2, name: 'Morning Routine Challenge', participants: ['Emma Rodriguez', 'You'], daysLeft: 12, progress: 80 },
  ];

  // Accountability data
  const accountabilityData = {
    overall: 87,
    breakdown: {
      ai: { completed: 23, total: 25, percentage: 92 },
      partner: { completed: 15, total: 18, percentage: 83 },
      team: { completed: 8, total: 10, percentage: 80 },
      public: { completed: 4, total: 5, percentage: 80 }
    },
    weeklyTrend: [78, 82, 85, 87, 89, 87, 87],
    milestones: [
      { title: 'First Commitment', description: 'Complete your first accountability task', achieved: true, date: '2 weeks ago' },
      { title: 'Week Warrior', description: 'Maintain 80%+ accountability for a week', achieved: true, date: '1 week ago' },
      { title: 'Month Master', description: 'Maintain 85%+ accountability for a month', achieved: false, progress: 75 },
      { title: 'Accountability Legend', description: 'Maintain 90%+ accountability for 3 months', achieved: false, progress: 25 },
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
        duration: 20,
        xpReward: 50
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
        duration: 15,
        xpReward: 30
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
        duration: 10,
        xpReward: 25
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
        duration: 30,
        xpReward: 40
      },
    ],
    weeklyStats: {
      totalHabits: 4,
      completedToday: 3,
      averageCompletion: 78,
      longestStreak: 89,
      habitsMissedThisWeek: 6,
      totalXpFromHabits: 1245
    },
    habitAchievements: [
      { title: 'Consistency King', description: 'Complete all habits for 7 days straight', progress: 85, target: 100 },
      { title: 'Early Riser', description: 'Complete morning habits before 8 AM for 14 days', progress: 60, target: 100 },
      { title: 'Night Owl', description: 'Complete evening habits for 21 days', progress: 40, target: 100 },
      { title: 'Habit Collector', description: 'Maintain 5 different habits simultaneously', progress: 80, target: 100 },
    ],
    streakMilestones: [
      { days: 7, title: 'Week Warrior', achieved: true, reward: '100 XP' },
      { days: 30, title: 'Month Master', achieved: true, reward: '500 XP' },
      { days: 50, title: 'Halfway Hero', achieved: false, reward: '750 XP' },
      { days: 100, title: 'Century Crusher', achieved: false, reward: '1500 XP' },
    ]
  };

  const getRarityColor = (rarity: string) => {
    const colors = {
      common: 'border-gray-500 bg-gray-500/10',
      rare: 'border-blue-500 bg-blue-500/10',
      epic: 'border-purple-500 bg-purple-500/10',
      legendary: 'border-yellow-500 bg-yellow-500/10',
    };
    return colors[rarity as keyof typeof colors] || colors.common;
  };

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-400';
      case 'away': return 'bg-yellow-400';
      case 'offline': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'online': return 'Online';
      case 'away': return 'Away';
      case 'offline': return 'Offline';
      default: return 'Unknown';
    }
  };

  return (
    <div className="p-4 md:p-6 pb-20 md:pb-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">Achievements & Progress</h1>
        <p className="text-gray-400">Track your journey and celebrate victories</p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-900 rounded-xl p-4 border border-gray-800 text-center">
          <Zap className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
          <p className="text-2xl font-bold text-white">2,450</p>
          <p className="text-sm text-gray-400">Total XP</p>
        </div>
        
        <div className="bg-gray-900 rounded-xl p-4 border border-gray-800 text-center">
          <Medal className="w-8 h-8 text-blue-500 mx-auto mb-2" />
          <p className="text-2xl font-bold text-white">12</p>
          <p className="text-sm text-gray-400">Level</p>
        </div>
        
        <div className="bg-gray-900 rounded-xl p-4 border border-gray-800 text-center">
          <Trophy className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
          <p className="text-2xl font-bold text-white">8</p>
          <p className="text-sm text-gray-400">Achievements</p>
        </div>
        
        <div className="bg-gray-900 rounded-xl p-4 border border-gray-800 text-center">
          <Shield className="w-8 h-8 text-green-500 mx-auto mb-2" />
          <p className={`text-2xl font-bold ${getAccountabilityColor(accountabilityData.overall)}`}>87%</p>
          <p className="text-sm text-gray-400">Accountability</p>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex bg-gray-800 rounded-lg p-1 mb-6 overflow-x-auto">
        {(['achievements', 'leaderboard', 'teams', 'accountability', 'habits', 'friends'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 px-4 py-2 rounded-md text-sm font-medium capitalize transition-colors whitespace-nowrap ${
              activeTab === tab
                ? 'bg-yellow-400 text-black'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            {tab === 'habits' ? 'Daily Habits' : tab}
          </button>
        ))}
      </div>

      {/* Achievements Tab */}
      {activeTab === 'achievements' && (
        <div className="grid gap-4">
          {achievements.map((achievement) => {
            const Icon = achievement.icon;
            return (
              <div
                key={achievement.id}
                className={`p-4 rounded-xl border-2 transition-all ${
                  achievement.unlocked
                    ? `${getRarityColor(achievement.rarity)} shadow-lg`
                    : 'border-gray-700 bg-gray-800/50 opacity-60'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    achievement.unlocked ? 'bg-yellow-400' : 'bg-gray-700'
                  }`}>
                    <Icon className={`w-6 h-6 ${
                      achievement.unlocked ? 'text-black' : 'text-gray-400'
                    }`} />
                  </div>
                  
                  <div className="flex-1">
                    <h3 className={`font-semibold ${
                      achievement.unlocked ? 'text-white' : 'text-gray-400'
                    }`}>
                      {achievement.title}
                    </h3>
                    <p className="text-sm text-gray-400">{achievement.description}</p>
                    <span className={`inline-block px-2 py-1 rounded text-xs font-medium mt-1 capitalize ${
                      getRarityColor(achievement.rarity)
                    }`}>
                      {achievement.rarity}
                    </span>
                  </div>
                  
                  {achievement.unlocked && (
                    <div className="text-right">
                      <p className="text-yellow-400 font-semibold">+100 XP</p>
                      <p className="text-xs text-gray-400">Unlocked</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Leaderboard Tab */}
      {activeTab === 'leaderboard' && (
        <div className="space-y-3">
          <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
            <h3 className="font-semibold text-white mb-4">Weekly Leaderboard</h3>
            {leaderboard.map((user) => (
              <div
                key={user.rank}
                className={`flex items-center gap-4 p-3 rounded-lg ${
                  user.name === 'You' ? 'bg-yellow-400/10 border border-yellow-400/20' : 'hover:bg-gray-800'
                } transition-colors`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                  user.rank === 1 ? 'bg-yellow-500 text-black' :
                  user.rank === 2 ? 'bg-gray-400 text-black' :
                  user.rank === 3 ? 'bg-yellow-600 text-black' :
                  'bg-gray-700 text-white'
                }`}>
                  {user.rank}
                </div>
                
                <div className="text-2xl">{user.avatar}</div>
                
                <div className="flex-1">
                  <p className={`font-medium ${user.name === 'You' ? 'text-yellow-400' : 'text-white'}`}>
                    {user.name}
                  </p>
                  <div className="flex items-center gap-4 text-sm text-gray-400">
                    <span>{user.xp.toLocaleString()} XP</span>
                    <span className="flex items-center gap-1">
                      <Flame className="w-3 h-3" />
                      {user.streak} days
                    </span>
                    <span className={`flex items-center gap-1 ${getAccountabilityColor(user.accountability)}`}>
                      <Shield className="w-3 h-3" />
                      {user.accountability}%
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Teams Tab */}
      {activeTab === 'teams' && (
        <div className="space-y-4">
          <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
            <h3 className="font-semibold text-white mb-4">Join a Goal Team</h3>
            <p className="text-gray-400 mb-4">Team up with like-minded goal crushers for accountability and motivation!</p>
            
            <div className="space-y-3">
              {teams.map((team) => (
                <div key={team.id} className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                  <div>
                    <h4 className="font-medium text-white">{team.name}</h4>
                    <div className="flex items-center gap-4 text-sm text-gray-400 mt-1">
                      <span>{team.members} members</span>
                      <span>{team.category}</span>
                      <span>{team.xp.toLocaleString()} XP</span>
                      <span className={`flex items-center gap-1 ${getAccountabilityColor(team.accountability)}`}>
                        <Shield className="w-3 h-3" />
                        {team.accountability}% avg
                      </span>
                    </div>
                  </div>
                  
                  <button
                    className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                      team.joined
                        ? 'bg-green-600 text-white hover:bg-green-700'
                        : 'bg-yellow-400 text-black hover:bg-yellow-300'
                    }`}
                  >
                    {team.joined ? 'Joined' : 'Join Team'}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Create Team */}
          <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
            <h3 className="font-semibold text-white mb-2">Create Your Own Team</h3>
            <p className="text-gray-400 mb-4">Start a goal team and invite friends to crush goals together!</p>
            <button className="bg-yellow-400 text-black px-6 py-2 rounded-lg font-semibold hover:bg-yellow-300 transition-colors">
              Create Team
            </button>
          </div>
        </div>
      )}

      {/* Accountability Tab */}
      {activeTab === 'accountability' && (
        <div className="space-y-6">
          {/* Overall Accountability Meter */}
          <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
            <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <Shield className="w-5 h-5 text-yellow-400" />
              Accountability Meter
            </h3>
            
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-white font-medium">Overall Score</span>
                <span className={`text-3xl font-bold ${getAccountabilityColor(accountabilityData.overall)}`}>
                  {accountabilityData.overall}%
                </span>
              </div>
              
              <div className="w-full bg-gray-700 rounded-full h-4 mb-2">
                <div 
                  className={`h-4 rounded-full transition-all duration-500 ${getAccountabilityBgColor(accountabilityData.overall)}`}
                  style={{ width: `${accountabilityData.overall}%` }}
                />
              </div>
              
              <p className="text-sm text-gray-400">
                You're keeping {accountabilityData.overall}% of your commitments this week
              </p>
            </div>

            {/* Type Breakdown */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(accountabilityData.breakdown).map(([type, data]) => {
                const typeInfo = getAccountabilityTypeInfo(type);
                return (
                  <div key={type} className={`p-4 rounded-lg border ${typeInfo.bgColor} border-gray-700`}>
                    <div className="text-center">
                      <p className={`text-sm font-medium ${typeInfo.color} mb-2`}>{typeInfo.name}</p>
                      <p className={`text-xl font-bold ${getAccountabilityColor(data.percentage)}`}>
                        {data.percentage}%
                      </p>
                      <p className="text-xs text-gray-400">{data.completed}/{data.total}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Weekly Trend */}
          <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
            <h3 className="text-lg font-semibold text-white mb-4">7-Day Trend</h3>
            <div className="flex items-end justify-between h-24 gap-2">
              {accountabilityData.weeklyTrend.map((score, index) => (
                <div key={index} className="flex-1 flex flex-col items-center">
                  <div 
                    className={`w-full rounded-t transition-all duration-300 ${getAccountabilityBgColor(score)}`}
                    style={{ height: `${(score / 100) * 80}px` }}
                  />
                  <p className="text-xs text-gray-400 mt-1">{score}%</p>
                </div>
              ))}
            </div>
          </div>

          {/* Accountability Milestones */}
          <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
            <h3 className="text-lg font-semibold text-white mb-4">Accountability Milestones</h3>
            <div className="space-y-4">
              {accountabilityData.milestones.map((milestone, index) => (
                <div key={index} className="flex items-center gap-4 p-3 bg-gray-800 rounded-lg">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    milestone.achieved ? 'bg-green-500' : 'bg-gray-700'
                  }`}>
                    {milestone.achieved ? (
                      <CheckCircle className="w-5 h-5 text-white" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <h4 className={`font-medium ${milestone.achieved ? 'text-white' : 'text-gray-400'}`}>
                      {milestone.title}
                    </h4>
                    <p className="text-sm text-gray-400">{milestone.description}</p>
                    
                    {milestone.achieved ? (
                      <p className="text-xs text-green-400 mt-1">Achieved {milestone.date}</p>
                    ) : (
                      <div className="mt-2">
                        <div className="w-full bg-gray-700 rounded-full h-2">
                          <div 
                            className="bg-yellow-400 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${milestone.progress}%` }}
                          />
                        </div>
                        <p className="text-xs text-gray-400 mt-1">{milestone.progress}% complete</p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Daily Habits Tab */}
      {activeTab === 'habits' && (
        <div className="space-y-6">
          {/* Habits Overview */}
          <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
            <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <Repeat className="w-5 h-5 text-yellow-400" />
              Daily Rituals & Habits
            </h3>
            
            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-white">{habitsData.weeklyStats.completedToday}</p>
                <p className="text-xs text-gray-400">Completed Today</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-400">{habitsData.weeklyStats.averageCompletion}%</p>
                <p className="text-xs text-gray-400">Weekly Average</p>
              </div>
              <div className="text-center">
                <p className={`text-2xl font-bold ${getStreakColor(habitsData.weeklyStats.longestStreak)}`}>
                  {habitsData.weeklyStats.longestStreak}
                </p>
                <p className="text-xs text-gray-400">Longest Streak</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-yellow-400">{habitsData.weeklyStats.totalXpFromHabits}</p>
                <p className="text-xs text-gray-400">XP from Habits</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-red-400">{habitsData.weeklyStats.habitsMissedThisWeek}</p>
                <p className="text-xs text-gray-400">Missed This Week</p>
              </div>
            </div>

            {/* Individual Habits */}
            <div className="space-y-4">
              {habitsData.dailyHabits.map((habit) => {
                const Icon = habit.icon;
                const weeklyCompletionRate = (habit.weeklyCompletion.filter(Boolean).length / 7) * 100;
                
                return (
                  <div key={habit.id} className="bg-gray-800 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                          habit.completedToday ? 'bg-green-500' : 'bg-gray-700'
                        }`}>
                          <Icon className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h4 className="text-white font-medium">{habit.name}</h4>
                          <div className="flex items-center gap-4 text-sm text-gray-400">
                            <span className={getHabitCategoryColor(habit.category)}>
                              {habit.category}
                            </span>
                            <span>{habit.targetTime}</span>
                            <span>{habit.duration}min</span>
                            <span className="text-yellow-400">+{habit.xpReward} XP</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className={`text-xl font-bold ${getStreakColor(habit.streak)} flex items-center gap-1`}>
                          <Flame className="w-5 h-5" />
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
                    
                    <div className="flex items-center justify-between">
                      <span className={`text-sm ${habit.completedToday ? 'text-green-400' : 'text-gray-400'}`}>
                        {habit.completedToday ? '✅ Completed today' : '⏳ Pending today'}
                      </span>
                      
                      {!habit.completedToday && (
                        <button className="bg-yellow-400 text-black px-4 py-2 rounded-lg text-sm font-medium hover:bg-yellow-300 transition-colors">
                          Complete (+{habit.xpReward} XP)
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Habit Achievements */}
          <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
            <h3 className="text-lg font-semibold text-white mb-4">Habit Achievements</h3>
            <div className="space-y-4">
              {habitsData.habitAchievements.map((achievement, index) => (
                <div key={index} className="bg-gray-800 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-white font-medium">{achievement.title}</h4>
                    <span className="text-sm text-gray-400">{achievement.progress}%</span>
                  </div>
                  <p className="text-sm text-gray-400 mb-3">{achievement.description}</p>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-yellow-400 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${achievement.progress}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Streak Milestones */}
          <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
            <h3 className="text-lg font-semibold text-white mb-4">Streak Milestones</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {habitsData.streakMilestones.map((milestone, index) => (
                <div key={index} className={`p-4 rounded-lg border-2 ${
                  milestone.achieved 
                    ? 'border-green-500 bg-green-500/10' 
                    : 'border-gray-700 bg-gray-800'
                }`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      milestone.achieved ? 'bg-green-500' : 'bg-gray-700'
                    }`}>
                      <Flame className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <h4 className={`font-medium ${milestone.achieved ? 'text-white' : 'text-gray-400'}`}>
                        {milestone.title}
                      </h4>
                      <p className="text-sm text-gray-400">{milestone.days} day streak</p>
                      <p className={`text-sm font-medium ${milestone.achieved ? 'text-green-400' : 'text-yellow-400'}`}>
                        {milestone.reward}
                      </p>
                    </div>
                    {milestone.achieved && (
                      <CheckCircle className="w-6 h-6 text-green-400" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Friends Tab */}
      {activeTab === 'friends' && (
        <div className="space-y-6">
          {/* Add Friend */}
          <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
            <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-yellow-400" />
              Add Friends
            </h3>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Enter username or email"
                className="flex-1 bg-gray-800 text-white px-3 py-2 rounded border border-gray-700 focus:border-yellow-400 focus:outline-none"
              />
              <button className="bg-yellow-400 text-black px-4 py-2 rounded-lg font-medium hover:bg-yellow-300 transition-colors">
                Send Invite
              </button>
            </div>
          </div>

          {/* Friend Requests */}
          {friendRequests.length > 0 && (
            <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
              <h3 className="font-semibold text-white mb-3">Friend Requests ({friendRequests.length})</h3>
              <div className="space-y-3">
                {friendRequests.map((request) => (
                  <div key={request.id} className="p-3 bg-gray-800 rounded-lg">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className="text-2xl">{request.avatar}</div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h5 className="text-white font-medium">{request.name}</h5>
                            <span className="text-xs bg-blue-500 text-white px-2 py-0.5 rounded-full font-medium">
                              Lv.{request.level}
                            </span>
                          </div>
                          <p className="text-sm text-gray-400">{request.mutualFriends} mutual friends</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors">
                          Accept
                        </button>
                        <button className="px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700 transition-colors">
                          Decline
                        </button>
                      </div>
                    </div>
                    {request.message && (
                      <p className="text-sm text-gray-300 bg-gray-700 p-2 rounded italic">
                        "{request.message}"
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Active Friend Challenges */}
          <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
            <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
              <Gamepad2 className="w-5 h-5 text-yellow-400" />
              Active Challenges
            </h3>
            <div className="space-y-3">
              {friendChallenges.map((challenge) => (
                <div key={challenge.id} className="p-3 bg-gray-800 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-white font-medium">{challenge.name}</h4>
                    <span className="text-sm text-gray-400">{challenge.daysLeft} days left</span>
                  </div>
                  <p className="text-sm text-gray-400 mb-2">
                    With: {challenge.participants.filter(p => p !== 'You').join(', ')}
                  </p>
                  <div className="w-full bg-gray-700 rounded-full h-2 mb-2">
                    <div 
                      className="bg-yellow-400 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${challenge.progress}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">{challenge.progress}% complete</span>
                    <button className="px-3 py-1 bg-yellow-400 text-black text-sm rounded hover:bg-yellow-300 transition-colors">
                      View Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* My Friends */}
          <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
            <h3 className="font-semibold text-white mb-3">My Friends ({friends.filter(f => f.isFriend).length})</h3>
            <div className="space-y-3">
              {friends.filter(friend => friend.isFriend).map((friend) => (
                <div key={friend.id} className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="text-2xl">{friend.avatar}</div>
                      <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-gray-800 ${getStatusColor(friend.status)}`} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h5 className="text-white font-medium">{friend.name}</h5>
                        <span className="text-xs bg-yellow-400 text-black px-2 py-0.5 rounded-full font-medium">
                          Lv.{friend.level}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-400">
                        <span className={getStatusColor(friend.status).replace('bg-', 'text-')}>
                          {getStatusText(friend.status)}
                        </span>
                        <span>{friend.xp.toLocaleString()} XP</span>
                        <span>🔥 {friend.streak} days</span>
                        <span>{friend.mutualGoals} mutual goals</span>
                      </div>
                      <p className="text-xs text-gray-500">Last active: {friend.lastActive}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button className="p-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors" title="Message">
                      <MessageCircle className="w-4 h-4" />
                    </button>
                    <button className="p-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 transition-colors" title="Challenge">
                      <Gamepad2 className="w-4 h-4" />
                    </button>
                    <button className="p-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors" title="Accountability Partner">
                      <Shield className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Friend Suggestions */}
          <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
            <h3 className="font-semibold text-white mb-3">Suggested Friends</h3>
            <div className="space-y-3">
              {friends.filter(friend => !friend.isFriend).map((friend) => (
                <div key={friend.id} className="flex items-center justify-between p-3 bg-gray-800 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="text-2xl">{friend.avatar}</div>
                      <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-gray-800 ${getStatusColor(friend.status)}`} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h5 className="text-white font-medium">{friend.name}</h5>
                        <span className="text-xs bg-purple-500 text-white px-2 py-0.5 rounded-full font-medium">
                          Lv.{friend.level}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-400">
                        <span>{friend.xp.toLocaleString()} XP</span>
                        <span>🔥 {friend.streak} days</span>
                        <span>In Productivity Ninjas</span>
                      </div>
                    </div>
                  </div>
                  <button className="bg-yellow-400 text-black px-4 py-2 rounded-lg font-medium hover:bg-yellow-300 transition-colors">
                    Add Friend
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};