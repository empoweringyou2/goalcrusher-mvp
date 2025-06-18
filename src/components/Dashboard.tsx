import React, { useState, useRef, useEffect } from 'react';
import { Calendar, Clock, Plus, ChevronLeft, ChevronRight, Flame, Zap, Target, Edit3, Save, X, Trash2, Users, Bot, UserCheck, Building, Copy, Star, AlertTriangle, CheckSquare, MoreHorizontal, Repeat, Settings } from 'lucide-react';
import { Screen } from '../App';
import { User, AppConfig } from '../types/user';

interface Task {
  id: number;
  title: string;
  time: string;
  duration: number;
  category: string;
  completed: boolean;
  date: Date;
  recurring?: {
    pattern: 'daily' | 'weekly' | 'monthly';
    interval: number;
    daysOfWeek?: number[];
    endDate?: Date;
  };
  goalId?: string;
  goalTitle?: string;
  accountability?: {
    type: 'ai' | 'partner' | 'team' | 'public';
    partner?: string;
    checkInTime?: string;
    consequences?: string;
    rewards?: string;
  };
  templateId?: string;
}

interface TaskTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  estimatedDuration: number;
  defaultTime: string;
  tags: string[];
  isPublic: boolean;
  usageCount: number;
  createdBy: string;
}

interface ConflictResolution {
  conflictingTasks: Task[];
  suggestions: {
    type: 'reschedule' | 'shorten' | 'split' | 'alternative_time';
    description: string;
    newTime?: string;
    newDuration?: number;
    reasoning: string;
  }[];
}

interface DashboardProps {
  onNavigate: (screen: Screen) => void;
  user: User;
  appConfig: AppConfig;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate, user, appConfig }) => {
  const [currentView, setCurrentView] = useState<'day' | 'week' | 'month' | 'year' | 'schedule'>('day');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const [editingTask, setEditingTask] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<Partial<Task>>({});
  const [showAccountabilityModal, setShowAccountabilityModal] = useState<number | null>(null);
  const [showTaskCreationModal, setShowTaskCreationModal] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showBulkEditModal, setShowBulkEditModal] = useState(false);
  const [showConflictModal, setShowConflictModal] = useState<ConflictResolution | null>(null);
  const [selectedTasks, setSelectedTasks] = useState<Set<number>>(new Set());
  const [bulkEditMode, setBulkEditMode] = useState(false);

  // Task Templates
  const [taskTemplates, setTaskTemplates] = useState<TaskTemplate[]>([
    {
      id: 'template-1',
      name: 'Daily Standup',
      description: 'Team standup meeting with progress updates',
      category: 'work',
      estimatedDuration: 15,
      defaultTime: '09:00',
      tags: ['meeting', 'team', 'daily'],
      isPublic: true,
      usageCount: 45,
      createdBy: 'system'
    },
    {
      id: 'template-2',
      name: 'Deep Work Session',
      description: 'Focused work time without interruptions',
      category: 'work',
      estimatedDuration: 90,
      defaultTime: '10:00',
      tags: ['focus', 'productivity', 'deep-work'],
      isPublic: true,
      usageCount: 32,
      createdBy: 'system'
    },
    {
      id: 'template-3',
      name: 'Workout Session',
      description: 'Physical exercise and fitness routine',
      category: 'fitness',
      estimatedDuration: 60,
      defaultTime: '18:00',
      tags: ['fitness', 'health', 'routine'],
      isPublic: true,
      usageCount: 28,
      createdBy: 'system'
    },
    {
      id: 'template-4',
      name: 'Learning Time',
      description: 'Dedicated time for skill development and learning',
      category: 'growth',
      estimatedDuration: 45,
      defaultTime: '20:00',
      tags: ['learning', 'skill', 'development'],
      isPublic: true,
      usageCount: 19,
      createdBy: 'system'
    }
  ]);

  const [tasks, setTasks] = useState<Task[]>([
    { 
      id: 1, 
      title: 'Morning Meditation', 
      time: '07:00', 
      duration: 20, 
      category: 'wellness', 
      completed: true, 
      date: new Date(),
      recurring: { pattern: 'daily', interval: 1 },
      accountability: {
        type: 'partner',
        partner: 'Sarah',
        checkInTime: '07:30',
        consequences: 'Buy coffee for Sarah',
        rewards: 'Feel energized all day'
      }
    },
    { 
      id: 2, 
      title: 'Project Review', 
      time: '09:15', 
      duration: 60, 
      category: 'work', 
      completed: false, 
      date: new Date(),
      goalId: 'goal-1',
      goalTitle: 'Launch MVP',
      accountability: {
        type: 'team',
        checkInTime: '10:15',
        consequences: 'Update team on delays',
        rewards: 'Project milestone bonus'
      }
    },
    { id: 3, title: 'Quick Call', time: '10:30', duration: 15, category: 'work', completed: false, date: new Date() },
    { id: 4, title: 'Lunch Break', time: '12:00', duration: 45, category: 'wellness', completed: false, date: new Date() },
    { 
      id: 5, 
      title: 'Gym Workout', 
      time: '18:00', 
      duration: 90, 
      category: 'fitness', 
      completed: false, 
      date: new Date(),
      templateId: 'template-3',
      accountability: {
        type: 'ai',
        checkInTime: '19:30',
        consequences: 'Crushion will send motivational reminders',
        rewards: 'Unlock new fitness achievement'
      }
    },
    { id: 6, title: 'Read 20 pages', time: '21:15', duration: 30, category: 'growth', completed: false, date: new Date() },
    { id: 7, title: 'Team Meeting', time: '14:00', duration: 45, category: 'work', completed: false, date: new Date(Date.now() + 86400000) },
    { id: 8, title: 'Yoga Session', time: '08:30', duration: 30, category: 'wellness', completed: false, date: new Date(Date.now() + 86400000) },
  ]);

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const hours = Array.from({ length: 24 }, (_, i) => i);

  // Generate 15-minute intervals for the day
  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 6; hour <= 23; hour++) {
      for (let minute = 0; minute < 60; minute += 15) {
        slots.push({
          hour,
          minute,
          timeString: `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`
        });
      }
    }
    return slots;
  };

  const timeSlots = generateTimeSlots();

  // Weekly goal progress data
  const weeklyGoalProgress = {
    completed: 65,
    total: 100,
    goalName: "Launch MVP",
    daysLeft: 3
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      wellness: 'bg-green-500',
      work: 'bg-blue-500',
      fitness: 'bg-red-500',
      growth: 'bg-purple-500',
    };
    return colors[category as keyof typeof colors] || 'bg-gray-500';
  };

  const getAccountabilityTypeInfo = (type: string) => {
    switch (type) {
      case 'ai':
        return {
          title: 'AI Accountability',
          icon: Bot,
          description: 'Crushion will track your progress and provide intelligent reminders',
          color: 'bg-blue-500/20 border-blue-500/40 text-blue-400',
          buttonColor: 'bg-blue-500 hover:bg-blue-600'
        };
      case 'partner':
        return {
          title: 'Partner Accountability',
          icon: UserCheck,
          description: 'A trusted person will help keep you accountable',
          color: 'bg-green-500/20 border-green-500/40 text-green-400',
          buttonColor: 'bg-green-500 hover:bg-green-600'
        };
      case 'team':
        return {
          title: 'Team Accountability',
          icon: Building,
          description: 'Your team or colleagues will track this commitment',
          color: 'bg-purple-500/20 border-purple-500/40 text-purple-400',
          buttonColor: 'bg-purple-500 hover:bg-purple-600'
        };
      case 'public':
        return {
          title: 'Public Accountability',
          icon: Users,
          description: 'Share your commitment publicly for social accountability',
          color: 'bg-yellow-500/20 border-yellow-500/40 text-yellow-400',
          buttonColor: 'bg-yellow-500 hover:bg-yellow-600'
        };
      default:
        return {
          title: 'Accountability',
          icon: Users,
          description: 'Track your commitment',
          color: 'bg-gray-500/20 border-gray-500/40 text-gray-400',
          buttonColor: 'bg-gray-500 hover:bg-gray-600'
        };
    }
  };

  // Conflict Detection
  const detectConflicts = (newTask: Partial<Task>, excludeTaskId?: number): ConflictResolution | null => {
    if (!newTask.time || !newTask.duration || !newTask.date) return null;

    const newStartTime = new Date(`${newTask.date.toDateString()} ${newTask.time}`);
    const newEndTime = new Date(newStartTime.getTime() + newTask.duration * 60000);

    const conflictingTasks = tasks.filter(task => {
      if (excludeTaskId && task.id === excludeTaskId) return false;
      if (task.date.toDateString() !== newTask.date.toDateString()) return false;

      const taskStartTime = new Date(`${task.date.toDateString()} ${task.time}`);
      const taskEndTime = new Date(taskStartTime.getTime() + task.duration * 60000);

      return (newStartTime < taskEndTime && newEndTime > taskStartTime);
    });

    if (conflictingTasks.length === 0) return null;

    // Generate resolution suggestions
    const suggestions = [];

    // Suggestion 1: Reschedule to next available slot
    const nextAvailableTime = findNextAvailableSlot(newTask.date, newTask.duration);
    if (nextAvailableTime) {
      suggestions.push({
        type: 'reschedule' as const,
        description: `Reschedule to ${nextAvailableTime}`,
        newTime: nextAvailableTime,
        reasoning: 'Next available time slot that fits your task duration'
      });
    }

    // Suggestion 2: Shorten conflicting tasks
    if (conflictingTasks.length === 1) {
      const conflictTask = conflictingTasks[0];
      const possibleReduction = Math.min(15, conflictTask.duration - 15);
      if (possibleReduction > 0) {
        suggestions.push({
          type: 'shorten' as const,
          description: `Shorten "${conflictTask.title}" by ${possibleReduction} minutes`,
          newDuration: conflictTask.duration - possibleReduction,
          reasoning: 'Reduce duration of conflicting task to make room'
        });
      }
    }

    // Suggestion 3: Alternative time based on category
    const categoryOptimalTimes = {
      work: ['09:00', '10:00', '14:00', '15:00'],
      fitness: ['07:00', '18:00', '19:00'],
      wellness: ['07:00', '12:00', '21:00'],
      growth: ['20:00', '21:00', '22:00']
    };

    const optimalTimes = categoryOptimalTimes[newTask.category as keyof typeof categoryOptimalTimes] || [];
    for (const time of optimalTimes) {
      if (time !== newTask.time && !hasConflictAtTime(newTask.date, time, newTask.duration)) {
        suggestions.push({
          type: 'alternative_time' as const,
          description: `Try ${time} (optimal for ${newTask.category})`,
          newTime: time,
          reasoning: `${time} is typically optimal for ${newTask.category} activities`
        });
        break;
      }
    }

    return { conflictingTasks, suggestions };
  };

  const findNextAvailableSlot = (date: Date, duration: number): string | null => {
    const dayTasks = tasks.filter(task => task.date.toDateString() === date.toDateString());
    
    for (const slot of timeSlots) {
      const slotStart = new Date(`${date.toDateString()} ${slot.timeString}`);
      const slotEnd = new Date(slotStart.getTime() + duration * 60000);
      
      const hasConflict = dayTasks.some(task => {
        const taskStart = new Date(`${task.date.toDateString()} ${task.time}`);
        const taskEnd = new Date(taskStart.getTime() + task.duration * 60000);
        return (slotStart < taskEnd && slotEnd > taskStart);
      });
      
      if (!hasConflict && slotEnd.getHours() <= 23) {
        return slot.timeString;
      }
    }
    
    return null;
  };

  const hasConflictAtTime = (date: Date, time: string, duration: number): boolean => {
    const newStartTime = new Date(`${date.toDateString()} ${time}`);
    const newEndTime = new Date(newStartTime.getTime() + duration * 60000);

    return tasks.some(task => {
      if (task.date.toDateString() !== date.toDateString()) return false;
      const taskStartTime = new Date(`${task.date.toDateString()} ${task.time}`);
      const taskEndTime = new Date(taskStartTime.getTime() + task.duration * 60000);
      return (newStartTime < taskEndTime && newEndTime > taskStartTime);
    });
  };

  // Bulk Operations
  const handleBulkEdit = (updates: Partial<Task>) => {
    setTasks(prevTasks =>
      prevTasks.map(task =>
        selectedTasks.has(task.id) ? { ...task, ...updates } : task
      )
    );
    setSelectedTasks(new Set());
    setBulkEditMode(false);
    setShowBulkEditModal(false);
  };

  const handleBulkDelete = () => {
    setTasks(prevTasks => prevTasks.filter(task => !selectedTasks.has(task.id)));
    setSelectedTasks(new Set());
    setBulkEditMode(false);
  };

  const handleBulkReschedule = (days: number) => {
    setTasks(prevTasks =>
      prevTasks.map(task => {
        if (selectedTasks.has(task.id)) {
          const newDate = new Date(task.date);
          newDate.setDate(newDate.getDate() + days);
          return { ...task, date: newDate };
        }
        return task;
      })
    );
    setSelectedTasks(new Set());
    setBulkEditMode(false);
    setShowBulkEditModal(false);
  };

  // Template Operations
  const createTaskFromTemplate = (template: TaskTemplate, customizations?: Partial<Task>) => {
    const newTask: Task = {
      id: Date.now(),
      title: template.name,
      time: customizations?.time || template.defaultTime,
      duration: customizations?.duration || template.estimatedDuration,
      category: template.category,
      completed: false,
      date: customizations?.date || new Date(),
      templateId: template.id,
      ...customizations
    };

    // Check for conflicts
    const conflicts = detectConflicts(newTask);
    if (conflicts) {
      setShowConflictModal(conflicts);
      return;
    }

    setTasks(prev => [...prev, newTask]);
    
    // Update template usage count
    setTaskTemplates(prev =>
      prev.map(t => t.id === template.id ? { ...t, usageCount: t.usageCount + 1 } : t)
    );
  };

  const saveAsTemplate = (task: Task) => {
    const newTemplate: TaskTemplate = {
      id: `template-${Date.now()}`,
      name: task.title,
      description: `Template created from "${task.title}"`,
      category: task.category,
      estimatedDuration: task.duration,
      defaultTime: task.time,
      tags: [task.category],
      isPublic: false,
      usageCount: 0,
      createdBy: user.id
    };

    setTaskTemplates(prev => [...prev, newTemplate]);
  };

  // Drag and Drop Functions
  const handleDragStart = (e: React.DragEvent, task: Task) => {
    setDraggedTask(task);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, newTime: string, newDate?: Date) => {
    e.preventDefault();
    if (!draggedTask) return;

    const updatedTask = {
      ...draggedTask,
      time: newTime,
      date: newDate || draggedTask.date
    };

    // Check for conflicts
    const conflicts = detectConflicts(updatedTask, draggedTask.id);
    if (conflicts) {
      setShowConflictModal(conflicts);
      setDraggedTask(null);
      return;
    }

    setTasks(prevTasks => 
      prevTasks.map(task => 
        task.id === draggedTask.id ? updatedTask : task
      )
    );
    setDraggedTask(null);
  };

  // Task Editing Functions
  const startEditing = (task: Task) => {
    setEditingTask(task.id);
    setEditForm({
      title: task.title,
      time: task.time,
      duration: task.duration,
      category: task.category
    });
  };

  const saveEdit = () => {
    if (!editingTask) return;

    setTasks(prevTasks =>
      prevTasks.map(task =>
        task.id === editingTask
          ? { ...task, ...editForm }
          : task
      )
    );
    setEditingTask(null);
    setEditForm({});
  };

  const cancelEdit = () => {
    setEditingTask(null);
    setEditForm({});
  };

  const deleteTask = (taskId: number) => {
    setTasks(prevTasks => prevTasks.filter(task => task.id !== taskId));
  };

  const toggleTaskComplete = (taskId: number) => {
    setTasks(prevTasks =>
      prevTasks.map(task =>
        task.id === taskId
          ? { ...task, completed: !task.completed }
          : task
      )
    );
  };

  const handleCheckIn = (taskId: number) => {
    // Simulate check-in action
    alert('Check-in recorded! Great job staying accountable! 🎉');
    setShowAccountabilityModal(null);
  };

  const handleEditAccountability = (taskId: number) => {
    // This would open an accountability editing modal/form
    alert('Opening accountability editor... (Feature coming soon!)');
    setShowAccountabilityModal(null);
  };

  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    switch (currentView) {
      case 'day':
        newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1));
        break;
      case 'week':
        newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7));
        break;
      case 'month':
        newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
        break;
      case 'year':
        newDate.setFullYear(newDate.getFullYear() + (direction === 'next' ? 1 : -1));
        break;
    }
    setCurrentDate(newDate);
  };

  const getDateRangeText = () => {
    switch (currentView) {
      case 'day':
        return currentDate.toLocaleDateString('en-US', { 
          weekday: 'long',
          month: 'long', 
          day: 'numeric',
          year: 'numeric'
        });
      case 'week':
        const weekStart = new Date(currentDate);
        weekStart.setDate(currentDate.getDate() - currentDate.getDay());
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        return `${weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
      case 'month':
        return currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      case 'year':
        return currentDate.getFullYear().toString();
      case 'schedule':
        return 'Schedule View';
      default:
        return '';
    }
  };

  // Convert time string to minutes for positioning
  const timeToMinutes = (timeString: string) => {
    const [hours, minutes] = timeString.split(':').map(Number);
    return (hours - 6) * 60 + minutes; // Subtract 6 because we start at 6 AM
  };

  // Ultra micro pie chart component
  const MicroPieChart = ({ percentage, size = 16 }: { percentage: number; size?: number }) => {
    const radius = (size - 2) / 2;
    const circumference = 2 * Math.PI * radius;
    const strokeDasharray = circumference;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    return (
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="transform -rotate-90">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="rgb(75, 85, 99)"
            strokeWidth="1"
            fill="transparent"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="rgb(34, 197, 94)"
            strokeWidth="1"
            fill="transparent"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-300"
          />
        </svg>
      </div>
    );
  };

  // Enhanced Accountability Modal Component
  const AccountabilityModal = ({ task }: { task: Task }) => {
    const typeInfo = getAccountabilityTypeInfo(task.accountability?.type || '');
    const TypeIcon = typeInfo.icon;

    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-gray-900 rounded-xl border border-gray-800 max-w-md w-full max-h-[80vh] overflow-y-auto">
          <div className="p-4 border-b border-gray-800">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <TypeIcon className="w-5 h-5 text-yellow-400" />
                Accountability for "{task.title}"
              </h3>
              <button
                onClick={() => setShowAccountabilityModal(null)}
                className="p-1 hover:bg-gray-800 rounded"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
          </div>
          
          <div className="p-4 space-y-4">
            {task.accountability ? (
              <>
                <div className={`rounded-lg p-3 border ${typeInfo.color}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <TypeIcon className="w-5 h-5" />
                    <span className="text-white font-medium">{typeInfo.title}</span>
                  </div>
                  
                  {task.accountability.partner && (
                    <p className="text-gray-300 text-sm mb-2">
                      <strong>Partner:</strong> {task.accountability.partner}
                    </p>
                  )}
                  
                  {task.accountability.checkInTime && (
                    <p className="text-gray-300 text-sm">
                      <strong>Check-in Time:</strong> {task.accountability.checkInTime}
                    </p>
                  )}
                </div>

                {task.accountability.consequences && (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                    <h4 className="text-red-400 font-medium mb-1 flex items-center gap-1">
                      ⚠️ If I don't complete this:
                    </h4>
                    <p className="text-gray-300 text-sm">{task.accountability.consequences}</p>
                  </div>
                )}

                {task.accountability.rewards && (
                  <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
                    <h4 className="text-green-400 font-medium mb-1 flex items-center gap-1">
                      🎉 When I complete this:
                    </h4>
                    <p className="text-gray-300 text-sm">{task.accountability.rewards}</p>
                  </div>
                )}

                <div className="flex gap-2">
                  <button 
                    onClick={() => handleCheckIn(task.id)}
                    className="flex-1 bg-yellow-400 text-black py-2 px-4 rounded-lg font-medium hover:bg-yellow-300 transition-colors"
                  >
                    Check In Now
                  </button>
                  <button 
                    onClick={() => handleEditAccountability(task.id)}
                    className="flex-1 bg-gray-700 text-white py-2 px-4 rounded-lg font-medium hover:bg-gray-600 transition-colors"
                  >
                    Edit Accountability
                  </button>
                </div>
              </>
            ) : (
              <div className="text-center py-6">
                <Users className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                <h4 className="text-white font-medium mb-2">No Accountability Set</h4>
                <p className="text-gray-400 text-sm mb-4">
                  Add accountability to increase your chances of completing this task by up to 95%!
                </p>
                <button className="bg-yellow-400 text-black py-2 px-4 rounded-lg font-medium hover:bg-yellow-300 transition-colors">
                  Set Up Accountability
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Template Modal Component
  const TemplateModal = () => (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-xl border border-gray-800 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        <div className="p-4 border-b border-gray-800">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-400" />
              Task Templates
            </h3>
            <button
              onClick={() => setShowTemplateModal(false)}
              className="p-1 hover:bg-gray-800 rounded"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>
        
        <div className="p-4">
          <div className="grid gap-3">
            {taskTemplates.map(template => (
              <div key={template.id} className="bg-gray-800 rounded-lg p-4 hover:bg-gray-750 transition-colors">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h4 className="text-white font-medium">{template.name}</h4>
                    <p className="text-gray-400 text-sm">{template.description}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded">
                      {template.usageCount} uses
                    </span>
                    {template.isPublic && (
                      <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded">
                        Public
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-4 text-sm text-gray-400 mb-3">
                  <span className="capitalize">{template.category}</span>
                  <span>{template.estimatedDuration} min</span>
                  <span>{template.defaultTime}</span>
                </div>
                
                <div className="flex flex-wrap gap-1 mb-3">
                  {template.tags.map(tag => (
                    <span key={tag} className="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded">
                      {tag}
                    </span>
                  ))}
                </div>
                
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      createTaskFromTemplate(template);
                      setShowTemplateModal(false);
                    }}
                    className="flex-1 bg-yellow-400 text-black py-2 px-4 rounded-lg font-medium hover:bg-yellow-300 transition-colors"
                  >
                    Use Template
                  </button>
                  <button
                    onClick={() => {
                      createTaskFromTemplate(template, { date: new Date(Date.now() + 86400000) });
                      setShowTemplateModal(false);
                    }}
                    className="bg-gray-700 text-white py-2 px-4 rounded-lg font-medium hover:bg-gray-600 transition-colors"
                  >
                    Tomorrow
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  // Bulk Edit Modal Component
  const BulkEditModal = () => (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-xl border border-gray-800 max-w-md w-full">
        <div className="p-4 border-b border-gray-800">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <CheckSquare className="w-5 h-5 text-yellow-400" />
              Bulk Edit ({selectedTasks.size} tasks)
            </h3>
            <button
              onClick={() => setShowBulkEditModal(false)}
              className="p-1 hover:bg-gray-800 rounded"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>
        
        <div className="p-4 space-y-4">
          <div>
            <h4 className="text-white font-medium mb-3">Bulk Actions</h4>
            <div className="space-y-2">
              <button
                onClick={() => handleBulkReschedule(1)}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Move to Tomorrow
              </button>
              <button
                onClick={() => handleBulkReschedule(7)}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Move to Next Week
              </button>
              <button
                onClick={() => handleBulkEdit({ category: 'work' })}
                className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors"
              >
                Change Category to Work
              </button>
              <button
                onClick={() => handleBulkEdit({ completed: true })}
                className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors"
              >
                Mark All Complete
              </button>
              <button
                onClick={handleBulkDelete}
                className="w-full bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete All Selected
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Conflict Resolution Modal Component
  const ConflictModal = ({ conflicts }: { conflicts: ConflictResolution }) => (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-xl border border-gray-800 max-w-md w-full">
        <div className="p-4 border-b border-gray-800">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-400" />
              Schedule Conflict Detected
            </h3>
            <button
              onClick={() => setShowConflictModal(null)}
              className="p-1 hover:bg-gray-800 rounded"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>
        
        <div className="p-4 space-y-4">
          <div>
            <h4 className="text-white font-medium mb-2">Conflicting Tasks:</h4>
            <div className="space-y-2">
              {conflicts.conflictingTasks.map(task => (
                <div key={task.id} className="bg-red-500/10 border border-red-500/20 rounded-lg p-2">
                  <p className="text-white text-sm font-medium">{task.title}</p>
                  <p className="text-gray-400 text-xs">{task.time} - {task.duration} min</p>
                </div>
              ))}
            </div>
          </div>
          
          <div>
            <h4 className="text-white font-medium mb-2">Suggested Solutions:</h4>
            <div className="space-y-2">
              {conflicts.suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => {
                    // Apply the suggestion
                    if (suggestion.type === 'reschedule' && suggestion.newTime) {
                      // Handle reschedule logic
                    }
                    setShowConflictModal(null);
                  }}
                  className="w-full bg-gray-800 hover:bg-gray-700 text-left p-3 rounded-lg transition-colors"
                >
                  <p className="text-white text-sm font-medium">{suggestion.description}</p>
                  <p className="text-gray-400 text-xs">{suggestion.reasoning}</p>
                </button>
              ))}
            </div>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={() => setShowConflictModal(null)}
              className="flex-1 bg-gray-700 text-white py-2 px-4 rounded-lg hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                // Force create anyway
                setShowConflictModal(null);
              }}
              className="flex-1 bg-yellow-400 text-black py-2 px-4 rounded-lg hover:bg-yellow-300 transition-colors"
            >
              Create Anyway
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const renderDayView = () => (
    <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
      {/* Header */}
      <div className="grid grid-cols-[60px_1fr] border-b border-gray-800">
        <div className="p-2 text-xs text-gray-400 border-r border-gray-800 text-center">Time</div>
        <div className="p-3 text-center">
          <div className="text-sm text-gray-400">{weekDays[currentDate.getDay()]}</div>
          <div className="text-lg font-semibold text-yellow-400 mt-1">
            {currentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </div>
        </div>
      </div>

      {/* Time slots with tasks */}
      <div className="max-h-[600px] overflow-y-auto relative">
        <div className="grid grid-cols-[60px_1fr]">
          {/* Time column */}
          <div className="border-r border-gray-800">
            {timeSlots.map((slot, index) => (
              <div
                key={`${slot.hour}-${slot.minute}`}
                className={`h-4 flex items-center justify-center text-xs text-gray-500 border-b border-gray-800/50 ${
                  slot.minute === 0 ? 'border-gray-700 font-medium text-gray-400' : ''
                }`}
              >
                {slot.minute === 0 ? slot.timeString : ''}
              </div>
            ))}
          </div>

          {/* Tasks column */}
          <div className="relative">
            {/* Background grid with drop zones */}
            {timeSlots.map((slot, index) => (
              <div
                key={`bg-${slot.hour}-${slot.minute}`}
                className={`h-4 border-b border-gray-800/30 hover:bg-gray-800/20 transition-colors ${
                  slot.minute === 0 ? 'border-gray-700' : ''
                }`}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, slot.timeString, currentDate)}
              />
            ))}

            {/* Tasks positioned absolutely */}
            {tasks
              .filter(task => task.date.toDateString() === currentDate.toDateString())
              .map(task => {
                const startMinutes = timeToMinutes(task.time);
                const heightInPixels = (task.duration / 15) * 16; // 16px per 15-minute slot
                const topPosition = (startMinutes / 15) * 16; // 16px per 15-minute slot
                const isEditing = editingTask === task.id;
                const accountabilityInfo = task.accountability ? getAccountabilityTypeInfo(task.accountability.type) : null;

                if (isEditing) {
                  return (
                    <div
                      key={task.id}
                      className="absolute left-1 right-1 bg-gray-800 border-2 border-yellow-400 rounded-lg p-2 z-20"
                      style={{ 
                        top: `${topPosition}px`,
                        minHeight: '120px'
                      }}
                    >
                      <div className="space-y-2">
                        <input
                          type="text"
                          value={editForm.title || ''}
                          onChange={(e) => setEditForm({...editForm, title: e.target.value})}
                          className="w-full bg-gray-700 text-white text-sm px-2 py-1 rounded border border-gray-600 focus:border-yellow-400 focus:outline-none"
                          placeholder="Task title"
                        />
                        <div className="flex gap-2">
                          <input
                            type="time"
                            value={editForm.time || ''}
                            onChange={(e) => setEditForm({...editForm, time: e.target.value})}
                            className="bg-gray-700 text-white text-xs px-2 py-1 rounded border border-gray-600 focus:border-yellow-400 focus:outline-none"
                          />
                          <input
                            type="number"
                            value={editForm.duration || ''}
                            onChange={(e) => setEditForm({...editForm, duration: parseInt(e.target.value)})}
                            className="w-16 bg-gray-700 text-white text-xs px-2 py-1 rounded border border-gray-600 focus:border-yellow-400 focus:outline-none"
                            placeholder="min"
                          />
                          <select
                            value={editForm.category || ''}
                            onChange={(e) => setEditForm({...editForm, category: e.target.value})}
                            className="bg-gray-700 text-white text-xs px-2 py-1 rounded border border-gray-600 focus:border-yellow-400 focus:outline-none"
                          >
                            <option value="work">Work</option>
                            <option value="wellness">Wellness</option>
                            <option value="fitness">Fitness</option>
                            <option value="growth">Growth</option>
                          </select>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={saveEdit}
                            className="flex-1 bg-green-600 hover:bg-green-700 text-white text-xs px-2 py-1 rounded flex items-center justify-center gap-1"
                          >
                            <Save className="w-3 h-3" />
                            Save
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="flex-1 bg-gray-600 hover:bg-gray-700 text-white text-xs px-2 py-1 rounded flex items-center justify-center gap-1"
                          >
                            <X className="w-3 h-3" />
                            Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                }

                return (
                  <div
                    key={task.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, task)}
                    className={`absolute left-1 right-1 rounded-lg text-xs text-white cursor-move transition-all hover:scale-[1.02] hover:shadow-lg z-10 group ${
                      task.completed ? 'opacity-60' : ''
                    } ${getCategoryColor(task.category)} ${
                      draggedTask?.id === task.id ? 'opacity-50 scale-95' : ''
                    } ${
                      bulkEditMode && selectedTasks.has(task.id) ? 'ring-2 ring-yellow-400' : ''
                    }`}
                    style={{ 
                      top: `${topPosition}px`,
                      height: `${Math.max(heightInPixels, 32)}px`,
                      minHeight: '32px'
                    }}
                    onClick={() => {
                      if (bulkEditMode) {
                        const newSelected = new Set(selectedTasks);
                        if (newSelected.has(task.id)) {
                          newSelected.delete(task.id);
                        } else {
                          newSelected.add(task.id);
                        }
                        setSelectedTasks(newSelected);
                      }
                    }}
                  >
                    <div className="p-1 h-full flex flex-col justify-between relative">
                      <div className="flex items-center gap-1">
                        {bulkEditMode && (
                          <input
                            type="checkbox"
                            checked={selectedTasks.has(task.id)}
                            onChange={() => {}}
                            className="w-3 h-3 rounded"
                            onClick={(e) => e.stopPropagation()}
                          />
                        )}
                        <div className={`font-medium leading-tight flex-1 ${task.completed ? 'line-through' : ''}`}>
                          {task.title}
                        </div>
                        {task.recurring && <Repeat className="w-3 h-3 opacity-75" />}
                        {task.goalId && <Target className="w-3 h-3 opacity-75" />}
                        {task.templateId && <Star className="w-3 h-3 opacity-75" />}
                      </div>
                      
                      {heightInPixels > 24 && (
                        <div className="text-xs opacity-75 mt-0.5">
                          {task.time} • {task.duration}min
                          {task.goalTitle && <div className="text-xs opacity-60">🔗 {task.goalTitle}</div>}
                        </div>
                      )}

                      {/* Accountability Button */}
                      {task.accountability && accountabilityInfo && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowAccountabilityModal(task.id);
                          }}
                          className={`mt-1 px-2 py-1 rounded text-xs font-medium text-white transition-all ${accountabilityInfo.buttonColor} flex items-center gap-1 justify-center`}
                          title={`View ${accountabilityInfo.title}`}
                        >
                          <accountabilityInfo.icon className="w-3 h-3" />
                          {accountabilityInfo.title}
                        </button>
                      )}
                      
                      {/* Task controls */}
                      <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            saveAsTemplate(task);
                          }}
                          className="w-4 h-4 bg-black/50 hover:bg-black/70 rounded flex items-center justify-center"
                          title="Save as template"
                        >
                          <Star className="w-2 h-2" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            startEditing(task);
                          }}
                          className="w-4 h-4 bg-black/50 hover:bg-black/70 rounded flex items-center justify-center"
                        >
                          <Edit3 className="w-2 h-2" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteTask(task.id);
                          }}
                          className="w-4 h-4 bg-red-500/70 hover:bg-red-500 rounded flex items-center justify-center"
                        >
                          <Trash2 className="w-2 h-2" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            }

            {/* Current time indicator */}
            {(() => {
              const now = new Date();
              if (now.toDateString() === currentDate.toDateString()) {
                const currentMinutes = (now.getHours() - 6) * 60 + now.getMinutes();
                if (currentMinutes >= 0 && currentMinutes <= 18 * 60) {
                  const currentPosition = (currentMinutes / 15) * 16;
                  return (
                    <div
                      className="absolute left-0 right-0 z-20"
                      style={{ top: `${currentPosition}px` }}
                    >
                      <div className="flex items-center">
                        <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                        <div className="flex-1 h-0.5 bg-red-500"></div>
                      </div>
                    </div>
                  );
                }
              }
              return null;
            })()}
          </div>
        </div>
      </div>
    </div>
  );

  const renderWeekView = () => (
    <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
      <div className="grid grid-cols-8 border-b border-gray-800">
        <div className="p-3 text-sm text-gray-400 border-r border-gray-800">Time</div>
        {weekDays.map((day, index) => {
          const dayDate = new Date(currentDate);
          dayDate.setDate(currentDate.getDate() - currentDate.getDay() + index);
          const isToday = dayDate.toDateString() === new Date().toDateString();
          
          return (
            <div key={day} className="p-3 text-center border-r border-gray-800 last:border-r-0">
              <div className="text-sm text-gray-400">{day}</div>
              <div className={`text-lg font-semibold mt-1 ${
                isToday ? 'text-yellow-400' : 'text-white'
              }`}>
                {dayDate.getDate()}
              </div>
            </div>
          );
        })}
      </div>
      <div className="max-h-96 overflow-y-auto">
        {hours.filter(hour => hour >= 6 && hour <= 23).map((hour) => (
          <div key={hour} className="grid grid-cols-8 border-b border-gray-800 last:border-b-0 min-h-[60px]">
            <div className="p-3 text-sm text-gray-400 border-r border-gray-800 flex items-start">
              {hour.toString().padStart(2, '0')}:00
            </div>
            {weekDays.map((day, dayIndex) => {
              const dayDate = new Date(currentDate);
              dayDate.setDate(currentDate.getDate() - currentDate.getDay() + dayIndex);
              const hourTime = `${hour.toString().padStart(2, '0')}:00`;
              
              return (
                <div 
                  key={`${day}-${hour}`} 
                  className="border-r border-gray-800 last:border-r-0 p-2 relative hover:bg-gray-800/20 transition-colors"
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, hourTime, dayDate)}
                >
                  {tasks
                    .filter(task => 
                      parseInt(task.time.split(':')[0]) === hour &&
                      task.date.toDateString() === dayDate.toDateString()
                    )
                    .map(task => {
                      const accountabilityInfo = task.accountability ? getAccountabilityTypeInfo(task.accountability.type) : null;
                      
                      return (
                        <div
                          key={task.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, task)}
                          className={`absolute inset-x-2 top-1 p-2 rounded-lg text-xs text-white cursor-move transition-all hover:scale-105 group ${
                            task.completed ? 'opacity-50' : ''
                          } ${getCategoryColor(task.category)} ${
                            bulkEditMode && selectedTasks.has(task.id) ? 'ring-2 ring-yellow-400' : ''
                          }`}
                          style={{ height: `${Math.min(task.duration, 50)}px` }}
                          onClick={() => {
                            if (bulkEditMode) {
                              const newSelected = new Set(selectedTasks);
                              if (newSelected.has(task.id)) {
                                newSelected.delete(task.id);
                              } else {
                                newSelected.add(task.id);
                              }
                              setSelectedTasks(newSelected);
                            }
                          }}
                        >
                          <div className="flex items-center gap-1">
                            {bulkEditMode && (
                              <input
                                type="checkbox"
                                checked={selectedTasks.has(task.id)}
                                onChange={() => {}}
                                className="w-2 h-2 rounded"
                                onClick={(e) => e.stopPropagation()}
                              />
                            )}
                            <div className={`font-medium flex-1 ${task.completed ? 'line-through' : ''}`}>
                              {task.title}
                            </div>
                            {task.recurring && <Repeat className="w-2 h-2 opacity-75" />}
                            {task.goalId && <Target className="w-2 h-2 opacity-75" />}
                          </div>
                          <div className="text-xs opacity-75">{task.duration}min</div>
                          
                          {/* Accountability Button for Week View */}
                          {task.accountability && accountabilityInfo && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setShowAccountabilityModal(task.id);
                              }}
                              className={`mt-1 px-1 py-0.5 rounded text-xs font-medium text-white transition-all ${accountabilityInfo.buttonColor} flex items-center gap-1 justify-center`}
                            >
                              <accountabilityInfo.icon className="w-2 h-2" />
                              {accountabilityInfo.title.split(' ')[0]}
                            </button>
                          )}
                          
                          <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                startEditing(task);
                              }}
                              className="w-4 h-4 bg-black/50 hover:bg-black/70 rounded flex items-center justify-center"
                            >
                              <Edit3 className="w-2 h-2" />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  }
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );

  const renderMonthView = () => {
    const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const days = [];
    const currentDateObj = new Date(startDate);
    
    for (let i = 0; i < 42; i++) {
      days.push(new Date(currentDateObj));
      currentDateObj.setDate(currentDateObj.getDate() + 1);
    }

    return (
      <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
        <div className="grid grid-cols-7 border-b border-gray-800">
          {weekDays.map(day => (
            <div key={day} className="p-3 text-center text-sm text-gray-400 border-r border-gray-800 last:border-r-0">
              {day}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {days.map((day, index) => {
            const isCurrentMonth = day.getMonth() === currentDate.getMonth();
            const isToday = day.toDateString() === new Date().toDateString();
            const dayTasks = tasks.filter(task => task.date.toDateString() === day.toDateString());
            
            return (
              <div
                key={index}
                className={`min-h-[80px] p-2 border-r border-b border-gray-800 last:border-r-0 hover:bg-gray-800/20 transition-colors ${
                  !isCurrentMonth ? 'bg-gray-800/50' : ''
                }`}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, '09:00', day)}
              >
                <div className={`text-sm font-medium mb-1 ${
                  isToday ? 'text-yellow-400' : isCurrentMonth ? 'text-white' : 'text-gray-500'
                }`}>
                  {day.getDate()}
                </div>
                <div className="space-y-1">
                  {dayTasks.slice(0, 2).map(task => {
                    const accountabilityInfo = task.accountability ? getAccountabilityTypeInfo(task.accountability.type) : null;
                    
                    return (
                      <div
                        key={task.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, task)}
                        className={`text-xs p-1 rounded cursor-move hover:scale-105 transition-transform ${getCategoryColor(task.category)} text-white ${
                          bulkEditMode && selectedTasks.has(task.id) ? 'ring-1 ring-yellow-400' : ''
                        }`}
                        onClick={() => {
                          if (bulkEditMode) {
                            const newSelected = new Set(selectedTasks);
                            if (newSelected.has(task.id)) {
                              newSelected.delete(task.id);
                            } else {
                              newSelected.add(task.id);
                            }
                            setSelectedTasks(newSelected);
                          }
                        }}
                      >
                        <div className="truncate flex items-center gap-1">
                          {bulkEditMode && (
                            <input
                              type="checkbox"
                              checked={selectedTasks.has(task.id)}
                              onChange={() => {}}
                              className="w-2 h-2 rounded"
                              onClick={(e) => e.stopPropagation()}
                            />
                          )}
                          <span className="flex-1 truncate">{task.title}</span>
                          {task.recurring && <Repeat className="w-2 h-2 opacity-75" />}
                          {task.goalId && <Target className="w-2 h-2 opacity-75" />}
                        </div>
                        {task.accountability && accountabilityInfo && (
                          <div className="flex items-center gap-1 mt-1">
                            <accountabilityInfo.icon className="w-2 h-2" />
                            <span className="text-xs opacity-75">{accountabilityInfo.title.split(' ')[0]}</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {dayTasks.length > 2 && (
                    <div className="text-xs text-gray-400">+{dayTasks.length - 2} more</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderYearView = () => {
    const months = Array.from({ length: 12 }, (_, i) => i);
    
    return (
      <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
        <div className="grid grid-cols-3 md:grid-cols-4 gap-4">
          {months.map(monthIndex => {
            const monthDate = new Date(currentDate.getFullYear(), monthIndex, 1);
            const monthTasks = tasks.filter(task => 
              task.date.getMonth() === monthIndex && 
              task.date.getFullYear() === currentDate.getFullYear()
            );
            
            return (
              <div
                key={monthIndex}
                className="bg-gray-800 rounded-lg p-3 hover:bg-gray-700 transition-colors cursor-pointer"
                onClick={() => {
                  setCurrentDate(monthDate);
                  setCurrentView('month');
                }}
              >
                <h3 className="text-white font-medium mb-2">{monthNames[monthIndex]}</h3>
                <div className="text-sm text-gray-400">
                  {monthTasks.length} tasks
                </div>
                <div className="mt-2 space-y-1">
                  {monthTasks.slice(0, 3).map(task => {
                    const accountabilityInfo = task.accountability ? getAccountabilityTypeInfo(task.accountability.type) : null;
                    
                    return (
                      <div key={task.id} className="text-xs text-gray-300 truncate flex items-center gap-1">
                        <span className="flex-1">{task.title}</span>
                        {task.recurring && <Repeat className="w-2 h-2 opacity-75" />}
                        {task.goalId && <Target className="w-2 h-2 opacity-75" />}
                        {task.accountability && accountabilityInfo && (
                          <accountabilityInfo.icon className="w-2 h-2 opacity-75" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderScheduleView = () => (
    <div className="bg-gray-900 rounded-xl border border-gray-800">
      <div className="p-4 border-b border-gray-800">
        <h3 className="text-lg font-semibold text-white">Upcoming Tasks</h3>
      </div>
      <div className="divide-y divide-gray-800">
        {tasks
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
          .map(task => {
            const accountabilityInfo = task.accountability ? getAccountabilityTypeInfo(task.accountability.type) : null;
            
            return (
              <div 
                key={task.id} 
                className={`p-4 hover:bg-gray-800/50 transition-colors group ${
                  bulkEditMode && selectedTasks.has(task.id) ? 'bg-yellow-400/10 border-l-4 border-yellow-400' : ''
                }`}
                onClick={() => {
                  if (bulkEditMode) {
                    const newSelected = new Set(selectedTasks);
                    if (newSelected.has(task.id)) {
                      newSelected.delete(task.id);
                    } else {
                      newSelected.add(task.id);
                    }
                    setSelectedTasks(newSelected);
                  }
                }}
              >
                <div className="flex items-center gap-4">
                  {bulkEditMode && (
                    <input
                      type="checkbox"
                      checked={selectedTasks.has(task.id)}
                      onChange={() => {}}
                      className="w-4 h-4 rounded"
                      onClick={(e) => e.stopPropagation()}
                    />
                  )}
                  <div className={`w-3 h-3 rounded-full ${getCategoryColor(task.category)}`}></div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className={`font-medium text-white ${task.completed ? 'line-through opacity-50' : ''}`}>
                        {task.title}
                      </h4>
                      {task.recurring && <Repeat className="w-4 h-4 text-gray-400" />}
                      {task.goalId && <Target className="w-4 h-4 text-gray-400" />}
                      {task.templateId && <Star className="w-4 h-4 text-gray-400" />}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-400 mt-1">
                      <span>{task.date.toLocaleDateString()}</span>
                      <span>{task.time}</span>
                      <span>{task.duration} min</span>
                      <span className="capitalize">{task.category}</span>
                      {task.goalTitle && <span className="text-blue-400">🔗 {task.goalTitle}</span>}
                    </div>
                    
                    {/* Accountability Button in Schedule View */}
                    {task.accountability && accountabilityInfo && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowAccountabilityModal(task.id);
                        }}
                        className={`mt-2 px-3 py-1 rounded text-xs font-medium text-white transition-all ${accountabilityInfo.buttonColor} flex items-center gap-1`}
                      >
                        <accountabilityInfo.icon className="w-3 h-3" />
                        {accountabilityInfo.title}
                      </button>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        saveAsTemplate(task);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-700 rounded transition-all"
                      title="Save as template"
                    >
                      <Star className="w-4 h-4 text-gray-400" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        startEditing(task);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-700 rounded transition-all"
                    >
                      <Edit3 className="w-4 h-4 text-gray-400" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteTask(task.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-700 rounded transition-all"
                    >
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </button>
                    <input
                      type="checkbox"
                      checked={task.completed}
                      onChange={(e) => {
                        e.stopPropagation();
                        toggleTaskComplete(task.id);
                      }}
                      className="w-5 h-5 rounded border-gray-600 text-yellow-400 focus:ring-yellow-400"
                    />
                  </div>
                </div>
              </div>
            );
          })
        }
      </div>
    </div>
  );

  const renderCalendarView = () => {
    switch (currentView) {
      case 'day':
        return renderDayView();
      case 'week':
        return renderWeekView();
      case 'month':
        return renderMonthView();
      case 'year':
        return renderYearView();
      case 'schedule':
        return renderScheduleView();
      default:
        return renderWeekView();
    }
  };

  return (
    <div className="p-4 md:p-6 pb-20 md:pb-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
            Good morning, Goal Crusher! 🌟
          </h1>
          <p className="text-gray-400">Ready to make today legendary?</p>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={() => setShowTemplateModal(true)}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-purple-700 transition-colors flex items-center gap-2"
          >
            <Star className="w-4 h-4" />
            Templates
          </button>
          <button
            onClick={() => setBulkEditMode(!bulkEditMode)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
              bulkEditMode 
                ? 'bg-yellow-400 text-black hover:bg-yellow-300' 
                : 'bg-gray-700 text-white hover:bg-gray-600'
            }`}
          >
            <CheckSquare className="w-4 h-4" />
            {bulkEditMode ? 'Exit Bulk' : 'Bulk Edit'}
          </button>
          <button
            onClick={() => onNavigate('goal-wizard')}
            className="bg-yellow-400 text-black px-4 py-2 rounded-lg font-semibold hover:bg-yellow-300 transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Goal
          </button>
        </div>
      </div>

      {/* Bulk Edit Controls */}
      {bulkEditMode && (
        <div className="bg-yellow-400/10 border border-yellow-400/20 rounded-xl p-4 mb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <span className="text-yellow-400 font-medium">
                {selectedTasks.size} task{selectedTasks.size !== 1 ? 's' : ''} selected
              </span>
              <button
                onClick={() => {
                  const allTaskIds = new Set(tasks.map(t => t.id));
                  setSelectedTasks(allTaskIds);
                }}
                className="text-yellow-400 hover:text-yellow-300 text-sm underline"
              >
                Select All
              </button>
              <button
                onClick={() => setSelectedTasks(new Set())}
                className="text-yellow-400 hover:text-yellow-300 text-sm underline"
              >
                Clear Selection
              </button>
            </div>
            
            {selectedTasks.size > 0 && (
              <button
                onClick={() => setShowBulkEditModal(true)}
                className="bg-yellow-400 text-black px-4 py-2 rounded-lg font-medium hover:bg-yellow-300 transition-colors"
              >
                Bulk Actions
              </button>
            )}
          </div>
        </div>
      )}

      {/* Ultra Micro Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4 mb-6">
        <div className="bg-gray-900 rounded-lg p-2 md:p-3 border border-gray-800">
          <div className="flex items-center gap-1 md:gap-2">
            <Flame className="w-3 md:w-4 h-3 md:h-4 text-orange-500" />
            <span className="text-xs text-gray-400">Streak</span>
          </div>
          <p className="text-lg md:text-xl font-bold text-white">47</p>
          <p className="text-xs text-gray-500">days</p>
        </div>
        
        <div className="bg-gray-900 rounded-lg p-2 md:p-3 border border-gray-800">
          <div className="flex items-center gap-1 md:gap-2">
            <Zap className="w-3 md:w-4 h-3 md:h-4 text-yellow-400" />
            <span className="text-xs text-gray-400">XP Today</span>
          </div>
          <p className="text-lg md:text-xl font-bold text-white">340</p>
          <p className="text-xs text-gray-500">+12 from yesterday</p>
        </div>
        
        <div className="bg-gray-900 rounded-lg p-2 md:p-3 border border-gray-800">
          <div className="flex items-center gap-1 md:gap-2">
            <Calendar className="w-3 md:w-4 h-3 md:h-4 text-blue-500" />
            <span className="text-xs text-gray-400">Completed</span>
          </div>
          <p className="text-lg md:text-xl font-bold text-white">3/8</p>
          <p className="text-xs text-gray-500">tasks today</p>
        </div>
        
        <div className="bg-gray-900 rounded-lg p-2 md:p-3 border border-gray-800">
          <div className="flex items-center gap-1 md:gap-2">
            <Target className="w-3 md:w-4 h-3 md:h-4 text-green-500" />
            <span className="text-xs text-gray-400">Weekly Goal</span>
          </div>
          <div className="flex items-center gap-1 md:gap-2">
            <MicroPieChart percentage={weeklyGoalProgress.completed} size={12} />
            <div>
              <p className="text-sm md:text-base font-bold text-white">{weeklyGoalProgress.completed}%</p>
              <p className="text-xs text-gray-500">{weeklyGoalProgress.daysLeft} days left</p>
            </div>
          </div>
        </div>
      </div>

      {/* Calendar Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <div className="flex items-center gap-2 md:gap-4">
          <button
            onClick={() => navigateDate('prev')}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-gray-400" />
          </button>
          
          <h2 className="text-lg md:text-xl font-semibold text-white min-w-0 flex-1 md:min-w-[200px]">
            {getDateRangeText()}
          </h2>
          
          <button
            onClick={() => navigateDate('next')}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="flex bg-gray-800 rounded-lg p-1 overflow-x-auto">
          {(['day', 'week', 'month', 'year', 'schedule'] as const).map((view) => (
            <button
              key={view}
              onClick={() => setCurrentView(view)}
              className={`px-2 md:px-3 py-1 md:py-2 rounded-md text-xs md:text-sm capitalize transition-colors whitespace-nowrap ${
                currentView === view
                  ? 'bg-yellow-400 text-black font-semibold'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {view}
            </button>
          ))}
        </div>
      </div>

      {/* Dynamic Calendar View */}
      {renderCalendarView()}

      {/* Modals */}
      {showAccountabilityModal && (
        <AccountabilityModal 
          task={tasks.find(t => t.id === showAccountabilityModal)!} 
        />
      )}

      {showTemplateModal && <TemplateModal />}
      {showBulkEditModal && <BulkEditModal />}
      {showConflictModal && <ConflictModal conflicts={showConflictModal} />}

      {/* Drag and Drop Instructions */}
      {draggedTask && (
        <div className="fixed bottom-20 md:bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 bg-yellow-400 text-black p-3 rounded-lg shadow-lg z-50">
          <p className="text-sm font-medium">
            📅 Dragging "{draggedTask.title}" - Drop on any time slot to reschedule!
          </p>
        </div>
      )}

      {/* Bulk Edit Instructions */}
      {bulkEditMode && selectedTasks.size === 0 && (
        <div className="fixed bottom-20 md:bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 bg-blue-400 text-black p-3 rounded-lg shadow-lg z-50">
          <p className="text-sm font-medium">
            ✅ Bulk Edit Mode: Click tasks to select them, then use bulk actions!
          </p>
        </div>
      )}
    </div>
  );
};