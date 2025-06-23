import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Plus, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  Target, 
  Zap, 
  Users, 
  CheckCircle2,
  Circle,
  MoreHorizontal,
  Edit,
  Trash2,
  Copy,
  ArrowRight,
  Filter,
  CalendarDays,
  List,
  Grid3X3,
  BarChart3,
  Flame,
  Trophy,
  Star,
  TrendingUp,
  AlertCircle,
  Coffee,
  Briefcase,
  Heart,
  BookOpen,
  Home,
  Dumbbell,
  Brain,
  DollarSign,
  Palette,
  Music,
  Camera,
  Gamepad2,
  Plane,
  Shield,
  MessageCircle,
  UserCheck,
  Bot
} from 'lucide-react';
import { Screen } from '../App';
import { User, AppConfig } from '../types/user';
import { TaskCompletionModal } from './TaskCompletionModal';
import { getUserSettings, UserSettings } from '../lib/taskUtils';

interface DashboardProps {
  onNavigate: (screen: Screen) => void;
  user: User;
  appConfig: AppConfig;
}

interface Task {
  id: string;
  title: string;
  description?: string;
  category: string;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  estimated_duration: number;
  actual_duration?: number;
  scheduled_date: string;
  scheduled_time?: string;
  due_date?: string;
  xp_reward: number;
  goal_id?: string;
  accountability_type?: 'self' | 'ai' | 'partner' | 'team';
  completed_at?: string;
}

type ViewMode = 'day' | 'week' | 'month' | 'year' | 'schedule' | 'list';

const categoryIcons = {
  work: Briefcase,
  health: Heart,
  learning: BookOpen,
  personal: Home,
  fitness: Dumbbell,
  finance: DollarSign,
  creative: Palette,
  social: Users,
  entertainment: Music,
  travel: Plane,
  technology: Brain,
  other: Target
};

const categoryColors = {
  work: 'bg-blue-500',
  health: 'bg-green-500',
  learning: 'bg-purple-500',
  personal: 'bg-yellow-500',
  fitness: 'bg-red-500',
  finance: 'bg-emerald-500',
  creative: 'bg-pink-500',
  social: 'bg-indigo-500',
  entertainment: 'bg-orange-500',
  travel: 'bg-cyan-500',
  technology: 'bg-violet-500',
  other: 'bg-gray-500'
};

const priorityColors = {
  low: 'border-l-green-400',
  medium: 'border-l-yellow-400',
  high: 'border-l-red-400'
};

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate, user, appConfig }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [taskToComplete, setTaskToComplete] = useState<Task | null>(null);
  const [userSettings, setUserSettings] = useState<UserSettings | null>(null);
  const [isLoadingSettings, setIsLoadingSettings] = useState(false);

  // Load user settings on component mount
  useEffect(() => {
    const loadSettings = async () => {
      setIsLoadingSettings(true);
      try {
        const settings = await getUserSettings(user.id);
        setUserSettings(settings);
        console.log('Loaded user settings:', settings);
      } catch (error) {
        console.error('Failed to load user settings:', error);
        // Set default settings if loading fails
        setUserSettings({
          accountability_type: 'self',
          completion_method_setting: 'user',
          default_proof_time_minutes: 10
        });
      } finally {
        setIsLoadingSettings(false);
      }
    };
    loadSettings();
  }, [user.id]);

  // Mock tasks data with accountability types that match user settings
  const [tasks, setTasks] = useState<Task[]>([
    {
      id: '1',
      title: 'Morning Workout',
      description: 'Cardio and strength training session',
      category: 'fitness',
      priority: 'high',
      status: 'pending',
      estimated_duration: 60,
      scheduled_date: '2024-01-15',
      scheduled_time: '07:00',
      xp_reward: 50,
      accountability_type: 'ai'
    },
    {
      id: '2',
      title: 'Project Review',
      description: 'Review quarterly project deliverables',
      category: 'work',
      priority: 'high',
      status: 'pending',
      estimated_duration: 90,
      scheduled_date: '2024-01-15',
      scheduled_time: '09:15',
      xp_reward: 75,
      accountability_type: 'team'
    },
    {
      id: '3',
      title: 'Team Meeting',
      description: 'Weekly sync with development team',
      category: 'work',
      priority: 'medium',
      status: 'pending',
      estimated_duration: 60,
      scheduled_date: '2024-01-15',
      scheduled_time: '14:00',
      xp_reward: 40,
      accountability_type: 'self'
    },
    {
      id: '4',
      title: 'Read Chapter 5',
      description: 'Continue reading "Atomic Habits"',
      category: 'learning',
      priority: 'medium',
      status: 'pending',
      estimated_duration: 45,
      scheduled_date: '2024-01-15',
      scheduled_time: '20:00',
      xp_reward: 35,
      accountability_type: 'partner'
    },
    {
      id: '5',
      title: 'Gym Workout',
      description: 'Leg day - squats and deadlifts',
      category: 'fitness',
      priority: 'high',
      status: 'completed',
      estimated_duration: 90,
      actual_duration: 85,
      scheduled_date: '2024-01-14',
      scheduled_time: '18:00',
      xp_reward: 60,
      completed_at: '2024-01-14T19:25:00Z',
      accountability_type: 'ai'
    },
    {
      id: '6',
      title: 'Meal Prep',
      description: 'Prepare healthy meals for the week',
      category: 'health',
      priority: 'medium',
      status: 'completed',
      estimated_duration: 120,
      actual_duration: 110,
      scheduled_date: '2024-01-14',
      scheduled_time: '10:00',
      xp_reward: 45,
      completed_at: '2024-01-14T11:50:00Z',
      accountability_type: 'self'
    }
  ]);

  const handleTaskComplete = async (taskId: string, xpGained: number) => {
    setTasks(prevTasks => 
      prevTasks.map(task => 
        task.id === taskId 
          ? { ...task, status: 'completed' as const, completed_at: new Date().toISOString() }
          : task
      )
    );
    setShowCompletionModal(false);
    setTaskToComplete(null);
    
    // Here you could also update user XP, show celebration, etc.
    console.log(`Task completed! Gained ${xpGained} XP`);
  };

  const handleTaskCheckboxClick = async (task: Task, event: React.MouseEvent) => {
    event.stopPropagation();
    
    if (task.status === 'completed') {
      // If task is already completed, you might want to allow unchecking
      // For now, we'll just return
      return;
    }

    // Show loading state if settings are still loading
    if (isLoadingSettings) {
      console.log('Settings still loading, please wait...');
      return;
    }

    // Load user settings if not already loaded
    let settings = userSettings;
    if (!settings) {
      console.log('Loading user settings for task completion...');
      setIsLoadingSettings(true);
      try {
        settings = await getUserSettings(user.id);
        setUserSettings(settings);
      } catch (error) {
        console.error('Failed to load settings:', error);
        // Use default settings
        settings = {
          accountability_type: 'self',
          completion_method_setting: 'user',
          default_proof_time_minutes: 10
        };
      } finally {
        setIsLoadingSettings(false);
      }
    }

    if (!settings) {
      console.error('Could not load user settings, using fallback completion');
      // Fallback to simple completion if settings can't be loaded
      handleTaskComplete(task.id, task.xp_reward);
      return;
    }

    console.log('Task completion triggered with settings:', settings);
    console.log('Task accountability type:', task.accountability_type);

    // Show appropriate completion modal based on settings
    setTaskToComplete(task);
    setShowCompletionModal(true);
  };

  const getAccountabilityIcon = (type?: string) => {
    switch (type) {
      case 'ai':
        return <Bot className="w-3 h-3 text-blue-400" />;
      case 'partner':
        return <UserCheck className="w-3 h-3 text-green-400" />;
      case 'team':
        return <Users className="w-3 h-3 text-purple-400" />;
      default:
        return <Shield className="w-3 h-3 text-gray-400" />;
    }
  };

  const getAccountabilityLabel = (type?: string) => {
    switch (type) {
      case 'ai':
        return 'AI Accountability';
      case 'partner':
        return 'Partner Accountability';
      case 'team':
        return 'Team Accountability';
      default:
        return 'Self Accountability';
    }
  };

  const getAccountabilityColor = (type?: string) => {
    switch (type) {
      case 'ai':
        return 'bg-blue-500';
      case 'partner':
        return 'bg-green-500';
      case 'team':
        return 'bg-purple-500';
      default:
        return 'bg-gray-500';
    }
  };

  // Get tasks for current view (no filtering since search/filters are removed)
  const getTasksForView = () => {
    const today = new Date();
    const currentDateStr = currentDate.toISOString().split('T')[0];
    
    switch (viewMode) {
      case 'day':
        return tasks.filter(task => task.scheduled_date === currentDateStr);
      case 'week':
        const weekStart = new Date(currentDate);
        weekStart.setDate(currentDate.getDate() - currentDate.getDay());
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        
        return tasks.filter(task => {
          const taskDate = new Date(task.scheduled_date);
          return taskDate >= weekStart && taskDate <= weekEnd;
        });
      case 'month':
        return tasks.filter(task => {
          const taskDate = new Date(task.scheduled_date);
          return taskDate.getMonth() === currentDate.getMonth() && 
                 taskDate.getFullYear() === currentDate.getFullYear();
        });
      case 'year':
        return tasks.filter(task => {
          const taskDate = new Date(task.scheduled_date);
          return taskDate.getFullYear() === currentDate.getFullYear();
        });
      default:
        return tasks;
    }
  };

  const viewTasks = getTasksForView();

  // Navigation functions
  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    
    switch (viewMode) {
      case 'day':
        newDate.setDate(currentDate.getDate() + (direction === 'next' ? 1 : -1));
        break;
      case 'week':
        newDate.setDate(currentDate.getDate() + (direction === 'next' ? 7 : -7));
        break;
      case 'month':
        newDate.setMonth(currentDate.getMonth() + (direction === 'next' ? 1 : -1));
        break;
      case 'year':
        newDate.setFullYear(currentDate.getFullYear() + (direction === 'next' ? 1 : -1));
        break;
    }
    
    setCurrentDate(newDate);
  };

  const getDateRangeText = () => {
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    
    switch (viewMode) {
      case 'day':
        return currentDate.toLocaleDateString('en-US', options);
      case 'week':
        const weekStart = new Date(currentDate);
        weekStart.setDate(currentDate.getDate() - currentDate.getDay());
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        return `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
      case 'month':
        return currentDate.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
      case 'year':
        return currentDate.getFullYear().toString();
      default:
        return 'All Tasks';
    }
  };

  // Stats calculations
  const todayTasks = tasks.filter(task => task.scheduled_date === new Date().toISOString().split('T')[0]);
  const completedToday = todayTasks.filter(task => task.status === 'completed').length;
  const totalToday = todayTasks.length;
  const completionRate = totalToday > 0 ? Math.round((completedToday / totalToday) * 100) : 0;

  const weeklyXP = tasks
    .filter(task => task.status === 'completed' && task.completed_at)
    .filter(task => {
      const completedDate = new Date(task.completed_at!);
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      return completedDate >= weekStart;
    })
    .reduce((total, task) => total + task.xp_reward, 0);

  const currentStreak = 7; // This would be calculated from actual data

  // Render task card
  const renderTaskCard = (task: Task, index: number) => {
    const CategoryIcon = categoryIcons[task.category as keyof typeof categoryIcons] || Target;
    const isCompleted = task.status === 'completed';
    
    return (
      <div
        key={task.id}
        className={`relative group ${categoryColors[task.category as keyof typeof categoryColors]} rounded-lg text-xs text-white cursor-move transition-all hover:scale-[1.02] hover:shadow-lg z-10`}
        style={{
          top: `${index * 2}px`,
          left: '4px',
          right: '4px',
          height: `${Math.max(40, Math.min(80, task.estimated_duration))}px`
        }}
        onClick={() => {
          setSelectedTask(task);
          setShowTaskModal(true);
        }}
      >
        <div className="p-1 h-full flex flex-col justify-between relative">
          {/* Task completion checkbox */}
          <div 
            className="absolute top-1 right-1 z-20 cursor-pointer"
            onClick={(e) => handleTaskCheckboxClick(task, e)}
            title={isCompleted ? 'Task completed' : 'Mark as complete'}
          >
            {isCompleted ? (
              <CheckCircle2 className="w-4 h-4 text-green-300 hover:text-green-100 transition-colors" />
            ) : (
              <Circle className="w-4 h-4 text-white/70 hover:text-white transition-colors" />
            )}
          </div>

          <div className={`${isCompleted ? 'opacity-60' : ''}`}>
            <div className="flex items-center gap-1 mb-1">
              <CategoryIcon className="w-3 h-3 flex-shrink-0" />
              <span className="font-medium truncate pr-5">{task.title}</span>
            </div>
            
            <div className="flex items-center gap-1 text-white/80">
              <Clock className="w-2.5 h-2.5" />
              <span>{task.scheduled_time}</span>
              <span>•</span>
              <span>{task.estimated_duration}min</span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              {getAccountabilityIcon(task.accountability_type)}
              <span className="text-[10px] opacity-80">
                {task.accountability_type === 'ai' ? 'AI' : 
                 task.accountability_type === 'partner' ? 'Partner' :
                 task.accountability_type === 'team' ? 'Team' : 'Self'}
              </span>
            </div>
            
            <div className="flex items-center gap-1">
              <Zap className="w-2.5 h-2.5 text-yellow-300" />
              <span className="text-[10px]">{task.xp_reward}</span>
            </div>
          </div>

          {isCompleted && (
            <div className="absolute inset-0 bg-black/20 rounded-lg flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-green-300" />
            </div>
          )}
        </div>
      </div>
    );
  };

  // Generate time slots for schedule view
  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 6; hour < 24; hour++) {
      slots.push({
        time: `${hour.toString().padStart(2, '0')}:00`,
        label: `${hour === 12 ? 12 : hour > 12 ? hour - 12 : hour}${hour >= 12 ? 'PM' : 'AM'}`
      });
    }
    return slots;
  };

  const timeSlots = generateTimeSlots();

  return (
    <div className="p-4 md:p-6 pb-20 md:pb-6">
      {/* Stats Banner */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 p-1 mb-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-1">
          <div className="flex items-center gap-3 p-3">
            <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
              <Target className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Today</p>
              <p className="text-xl font-bold text-white">{completedToday}/{totalToday}</p>
              <p className="text-xs text-green-400">{completionRate}% complete</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 p-3">
            <div className="w-10 h-10 bg-yellow-400/20 rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-yellow-400" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Weekly XP</p>
              <p className="text-xl font-bold text-white">{weeklyXP}</p>
              <p className="text-xs text-yellow-400">+{weeklyXP > 0 ? Math.round(weeklyXP * 0.1) : 0} from last week</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 p-3">
            <div className="w-10 h-10 bg-orange-500/20 rounded-lg flex items-center justify-center">
              <Flame className="w-5 h-5 text-orange-500" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Streak</p>
              <p className="text-xl font-bold text-white">{currentStreak}</p>
              <p className="text-xs text-orange-400">days</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3 p-3">
            <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
              <Trophy className="w-5 h-5 text-purple-500" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Level</p>
              <p className="text-xl font-bold text-white">{user.level}</p>
              <p className="text-xs text-purple-400">Goal Crusher</p>
            </div>
          </div>
        </div>
      </div>

      {/* View Controls */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        {/* View Mode Selector */}
        <div className="flex bg-gray-800 rounded-lg p-1 overflow-x-auto">
          {(['day', 'week', 'month', 'year', 'schedule', 'list'] as ViewMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`px-3 md:px-4 py-2 rounded-md text-sm font-medium capitalize transition-colors whitespace-nowrap ${
                viewMode === mode
                  ? 'bg-yellow-400 text-black'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      {/* Date Navigation */}
      {viewMode !== 'list' && (
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigateDate('prev')}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-gray-400" />
          </button>
          
          <h2 className="text-lg md:text-xl font-semibold text-white text-center">
            {getDateRangeText()}
          </h2>
          
          <button
            onClick={() => navigateDate('next')}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </button>
        </div>
      )}

      {/* Main Content */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
        {viewMode === 'schedule' ? (
          /* Schedule View */
          <div className="max-h-[600px] overflow-y-auto relative">
            <div className="grid grid-cols-[60px_1fr]">
              {/* Time labels */}
              <div className="bg-gray-800 border-r border-gray-700">
                {timeSlots.map((slot) => (
                  <div key={slot.time} className="h-16 flex items-center justify-center text-xs text-gray-400 border-b border-gray-700">
                    {slot.label}
                  </div>
                ))}
              </div>
              
              {/* Tasks */}
              <div className="relative">
                {timeSlots.map((slot) => (
                  <div key={slot.time} className="h-16 border-b border-gray-700 relative">
                    {/* Render tasks for this time slot */}
                    {viewTasks
                      .filter(task => task.scheduled_time === slot.time)
                      .map((task, index) => renderTaskCard(task, index))
                    }
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : viewMode === 'list' ? (
          /* List View */
          <div className="divide-y divide-gray-800">
            {viewTasks.length === 0 ? (
              <div className="p-8 text-center">
                <Calendar className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-400 mb-2">No tasks found</h3>
                <p className="text-gray-500">Create a new task to get started.</p>
              </div>
            ) : (
              viewTasks.map((task) => {
                const CategoryIcon = categoryIcons[task.category as keyof typeof categoryIcons] || Target;
                const isCompleted = task.status === 'completed';
                
                return (
                  <div
                    key={task.id}
                    className={`p-4 hover:bg-gray-800 transition-colors cursor-pointer ${isCompleted ? 'opacity-60' : ''}`}
                    onClick={() => {
                      setSelectedTask(task);
                      setShowTaskModal(true);
                    }}
                  >
                    <div className="flex items-center gap-4">
                      {/* Completion checkbox */}
                      <div 
                        className="flex-shrink-0 cursor-pointer"
                        onClick={(e) => handleTaskCheckboxClick(task, e)}
                        title={isCompleted ? 'Task completed' : 'Mark as complete'}
                      >
                        {isCompleted ? (
                          <CheckCircle2 className="w-5 h-5 text-green-400 hover:text-green-300 transition-colors" />
                        ) : (
                          <Circle className="w-5 h-5 text-gray-400 hover:text-white transition-colors" />
                        )}
                      </div>

                      {/* Category icon */}
                      <div className={`w-10 h-10 rounded-lg ${categoryColors[task.category as keyof typeof categoryColors]} flex items-center justify-center flex-shrink-0`}>
                        <CategoryIcon className="w-5 h-5 text-white" />
                      </div>
                      
                      {/* Task details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className={`font-medium text-white ${isCompleted ? 'line-through' : ''}`}>
                            {task.title}
                          </h3>
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            task.priority === 'high' ? 'bg-red-500/20 text-red-400' :
                            task.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                            'bg-green-500/20 text-green-400'
                          }`}>
                            {task.priority}
                          </span>
                        </div>
                        
                        {task.description && (
                          <p className="text-gray-400 text-sm mb-2 truncate">{task.description}</p>
                        )}
                        
                        <div className="flex items-center gap-4 text-sm text-gray-400">
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            <span>{task.scheduled_time} • {task.estimated_duration}min</span>
                          </div>
                          
                          <div className="flex items-center gap-1">
                            {getAccountabilityIcon(task.accountability_type)}
                            <span>{getAccountabilityLabel(task.accountability_type)}</span>
                          </div>
                          
                          <div className="flex items-center gap-1">
                            <Zap className="w-4 h-4 text-yellow-400" />
                            <span>{task.xp_reward} XP</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        <button className="p-2 hover:bg-gray-700 rounded-lg transition-colors">
                          <MoreHorizontal className="w-4 h-4 text-gray-400" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        ) : (
          /* Calendar Grid Views */
          <div className="p-4">
            <div className="grid gap-4">
              {viewTasks.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-400 mb-2">No tasks scheduled</h3>
                  <p className="text-gray-500">Create your first goal to get started!</p>
                </div>
              ) : (
                viewTasks.map((task) => {
                  const CategoryIcon = categoryIcons[task.category as keyof typeof categoryIcons] || Target;
                  const isCompleted = task.status === 'completed';
                  
                  return (
                    <div
                      key={task.id}
                      className={`p-4 bg-gray-800 rounded-lg border-l-4 ${priorityColors[task.priority]} hover:bg-gray-750 transition-colors cursor-pointer ${isCompleted ? 'opacity-60' : ''}`}
                      onClick={() => {
                        setSelectedTask(task);
                        setShowTaskModal(true);
                      }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          {/* Completion checkbox */}
                          <div 
                            className="flex-shrink-0 cursor-pointer"
                            onClick={(e) => handleTaskCheckboxClick(task, e)}
                            title={isCompleted ? 'Task completed' : 'Mark as complete'}
                          >
                            {isCompleted ? (
                              <CheckCircle2 className="w-5 h-5 text-green-400 hover:text-green-300 transition-colors" />
                            ) : (
                              <Circle className="w-5 h-5 text-gray-400 hover:text-white transition-colors" />
                            )}
                          </div>

                          <div className={`w-8 h-8 rounded-lg ${categoryColors[task.category as keyof typeof categoryColors]} flex items-center justify-center`}>
                            <CategoryIcon className="w-4 h-4 text-white" />
                          </div>
                          <div>
                            <h3 className={`font-medium text-white ${isCompleted ? 'line-through' : ''}`}>
                              {task.title}
                            </h3>
                            <div className="flex items-center gap-2 text-sm text-gray-400">
                              <Clock className="w-3 h-3" />
                              <span>{task.scheduled_time}</span>
                              <span>•</span>
                              <span>{task.estimated_duration}min</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <div className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getAccountabilityColor(task.accountability_type)}`}>
                            {getAccountabilityIcon(task.accountability_type)}
                            <span className="hidden md:inline">
                              {task.accountability_type === 'ai' ? 'AI Accountability' : 
                               task.accountability_type === 'partner' ? 'Partner Accountability' :
                               task.accountability_type === 'team' ? 'Team Accountability' : 'Self Accountability'}
                            </span>
                            <span className="md:hidden">
                              {task.accountability_type === 'ai' ? 'AI' : 
                               task.accountability_type === 'partner' ? 'Partner' :
                               task.accountability_type === 'team' ? 'Team' : 'Self'}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-1 text-yellow-400">
                            <Zap className="w-4 h-4" />
                            <span className="font-medium">{task.xp_reward}</span>
                          </div>
                        </div>
                      </div>
                      
                      {task.description && (
                        <p className="text-gray-400 text-sm">{task.description}</p>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>

      {/* Task Completion Modal */}
      {showCompletionModal && taskToComplete && userSettings && (
        <TaskCompletionModal
          task={taskToComplete}
          userSettings={userSettings}
          isOpen={showCompletionModal}
          onClose={() => {
            setShowCompletionModal(false);
            setTaskToComplete(null);
          }}
          onTaskCompleted={handleTaskComplete}
          userId={user.id}
        />
      )}
    </div>
  );
};