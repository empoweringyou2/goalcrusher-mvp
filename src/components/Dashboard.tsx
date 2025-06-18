import React, { useState, useRef, useEffect } from 'react';
import { Calendar, Clock, Plus, ChevronLeft, ChevronRight, Flame, Zap, Target, Edit3, Save, X, Trash2, Users, Bot, UserCheck, Building } from 'lucide-react';
import { Screen } from '../App';
import { User, AppConfig } from '../types/user';

interface Task {
  id: string;
  title: string;
  time: string;
  duration: number;
  category: string;
  completed: boolean;
  date: Date;
  completed_at?: Date;
  accountability?: {
    type: 'ai' | 'partner' | 'team' | 'public';
    partner?: string;
    checkInTime?: string;
    consequences?: string;
    rewards?: string;
  };
}

interface NewTask {
  title: string;
  time: string;
  duration: number;
  category: string;
  description?: string;
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
  const [editingTask, setEditingTask] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Task>>({});
  const [showAccountabilityModal, setShowAccountabilityModal] = useState<string | null>(null);
  
  // New task creation state
  const [showNewTaskModal, setShowNewTaskModal] = useState(false);
  const [newTaskTime, setNewTaskTime] = useState('');
  const [newTaskDate, setNewTaskDate] = useState<Date>(new Date());
  const [newTaskForm, setNewTaskForm] = useState<NewTask>({
    title: '',
    time: '',
    duration: 30,
    category: 'general',
    description: ''
  });

  const [tasks, setTasks] = useState<Task[]>([
    { 
      id: '1', 
      title: 'Morning Meditation', 
      time: '07:00', 
      duration: 20, 
      category: 'wellness', 
      completed: true, 
      date: new Date(),
      completed_at: new Date(Date.now() - 3600000), // 1 hour ago
      accountability: {
        type: 'partner',
        partner: 'Sarah',
        checkInTime: '07:30',
        consequences: 'Buy coffee for Sarah',
        rewards: 'Feel energized all day'
      }
    },
    { 
      id: '2', 
      title: 'Project Review', 
      time: '09:15', 
      duration: 60, 
      category: 'work', 
      completed: false, 
      date: new Date(),
      accountability: {
        type: 'team',
        checkInTime: '10:15',
        consequences: 'Update team on delays',
        rewards: 'Project milestone bonus'
      }
    },
    { id: '3', title: 'Quick Call', time: '10:30', duration: 15, category: 'work', completed: false, date: new Date() },
    { id: '4', title: 'Lunch Break', time: '12:00', duration: 45, category: 'wellness', completed: false, date: new Date() },
    { 
      id: '5', 
      title: 'Gym Workout', 
      time: '18:00', 
      duration: 90, 
      category: 'fitness', 
      completed: false, 
      date: new Date(),
      accountability: {
        type: 'ai',
        checkInTime: '19:30',
        consequences: 'Crushion will send motivational reminders',
        rewards: 'Unlock new fitness achievement'
      }
    },
    { id: '6', title: 'Read 20 pages', time: '21:15', duration: 30, category: 'growth', completed: false, date: new Date() },
    { id: '7', title: 'Team Meeting', time: '14:00', duration: 45, category: 'work', completed: false, date: new Date(Date.now() + 86400000) },
    { id: '8', title: 'Yoga Session', time: '08:30', duration: 30, category: 'wellness', completed: false, date: new Date(Date.now() + 86400000) },
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
      general: 'bg-gray-500',
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

  // Task creation functions
  const handleTimeSlotClick = (timeString: string, date: Date) => {
    // Don't create task if there's already a task at this time
    const existingTask = tasks.find(task => 
      task.time === timeString && 
      task.date.toDateString() === date.toDateString()
    );
    
    if (existingTask) return;

    setNewTaskTime(timeString);
    setNewTaskDate(date);
    setNewTaskForm({
      title: '',
      time: timeString,
      duration: 30,
      category: 'general',
      description: ''
    });
    setShowNewTaskModal(true);
  };

  const handleCreateTask = async () => {
    if (!newTaskForm.title.trim()) return;

    const newTask: Task = {
      id: Date.now().toString(),
      title: newTaskForm.title,
      time: newTaskForm.time,
      duration: newTaskForm.duration,
      category: newTaskForm.category,
      completed: false,
      date: newTaskDate
    };

    // Add to local state
    setTasks(prev => [...prev, newTask]);

    // Here you would typically call your backend API to create the task
    console.log('Creating new task:', newTask);

    // Reset form and close modal
    setNewTaskForm({
      title: '',
      time: '',
      duration: 30,
      category: 'general',
      description: ''
    });
    setShowNewTaskModal(false);
  };

  const handleCancelNewTask = () => {
    setNewTaskForm({
      title: '',
      time: '',
      duration: 30,
      category: 'general',
      description: ''
    });
    setShowNewTaskModal(false);
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

    setTasks(prevTasks => 
      prevTasks.map(task => 
        task.id === draggedTask.id 
          ? { 
              ...task, 
              time: newTime,
              date: newDate || task.date
            }
          : task
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

  const deleteTask = (taskId: string) => {
    setTasks(prevTasks => prevTasks.filter(task => task.id !== taskId));
  };

  const toggleTaskComplete = async (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task || task.completed) return; // Don't allow unchecking completed tasks

    try {
      // Call the backend function to mark task complete
      const { markTaskComplete } = await import('../lib/supabase');
      const result = await markTaskComplete(taskId, user.id);

      if (result.error) {
        console.error('Failed to mark task complete:', result.error);
        return;
      }

      console.log('Task completion result:', result.data);
      if (result.data?.xp_gained) {
        console.log(`🎉 Task completed! +${result.data.xp_gained} XP gained!`);
      }

      // Update local state
      setTasks(prevTasks =>
        prevTasks.map(t =>
          t.id === taskId
            ? { ...t, completed: true, completed_at: new Date() }
            : t
        )
      );
    } catch (error) {
      console.error('Error marking task complete:', error);
    }
  };

  const handleCheckIn = (taskId: string) => {
    // Simulate check-in action
    alert('Check-in recorded! Great job staying accountable! 🎉');
    setShowAccountabilityModal(null);
  };

  const handleEditAccountability = (taskId: string) => {
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

  // Convert position back to time
  const positionToTime = (position: number) => {
    const totalMinutes = Math.round((position / 16) * 15); // 16px per 15-minute slot
    const hours = Math.floor(totalMinutes / 60) + 6; // Add 6 because we start at 6 AM
    const minutes = totalMinutes % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
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

                {/* Accountability type specific info */}
                <div className={`rounded-lg p-3 border ${typeInfo.color}`}>
                  <h4 className="font-medium mb-1 flex items-center gap-1">
                    💡 About {typeInfo.title}:
                  </h4>
                  <p className="text-gray-300 text-sm">{typeInfo.description}</p>
                  
                  {task.accountability.type === 'ai' && (
                    <p className="text-gray-400 text-xs mt-2">
                      Crushion uses advanced AI to provide personalized motivation and track your progress patterns.
                    </p>
                  )}
                  
                  {task.accountability.type === 'partner' && (
                    <p className="text-gray-400 text-xs mt-2">
                      Studies show accountability partners increase success rates by up to 95%!
                    </p>
                  )}
                  
                  {task.accountability.type === 'team' && (
                    <p className="text-gray-400 text-xs mt-2">
                      Team accountability creates shared responsibility and collective motivation.
                    </p>
                  )}
                </div>
              </>
            ) : (
              <div className="text-center py-6">
                <Users className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                <h4 className="text-white font-medium mb-2">No Accountability Set</h4>
                <p className="text-gray-400 text-sm mb-4">
                  Add accountability to increase your chances of completing this task by up to 95%!
                </p>
                
                {/* Accountability type options */}
                <div className="grid grid-cols-2 gap-2 mb-4">
                  <button className="bg-gray-800 hover:bg-gray-700 p-3 rounded-lg text-left transition-colors">
                    <div className="flex items-center gap-2 mb-1">
                      <Bot className="w-4 h-4 text-blue-400" />
                      <span className="text-white text-sm font-medium">AI</span>
                    </div>
                    <p className="text-xs text-gray-400">Smart tracking</p>
                  </button>
                  
                  <button className="bg-gray-800 hover:bg-gray-700 p-3 rounded-lg text-left transition-colors">
                    <div className="flex items-center gap-2 mb-1">
                      <UserCheck className="w-4 h-4 text-green-400" />
                      <span className="text-white text-sm font-medium">Partner</span>
                    </div>
                    <p className="text-xs text-gray-400">Personal support</p>
                  </button>
                  
                  <button className="bg-gray-800 hover:bg-gray-700 p-3 rounded-lg text-left transition-colors">
                    <div className="flex items-center gap-2 mb-1">
                      <Building className="w-4 h-4 text-purple-400" />
                      <span className="text-white text-sm font-medium">Team</span>
                    </div>
                    <p className="text-xs text-gray-400">Group commitment</p>
                  </button>
                  
                  <button className="bg-gray-800 hover:bg-gray-700 p-3 rounded-lg text-left transition-colors">
                    <div className="flex items-center gap-2 mb-1">
                      <Users className="w-4 h-4 text-yellow-400" />
                      <span className="text-white text-sm font-medium">Public</span>
                    </div>
                    <p className="text-xs text-gray-400">Social pressure</p>
                  </button>
                </div>
                
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

  // New Task Creation Modal
  const NewTaskModal = () => (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-xl border border-gray-800 max-w-md w-full">
        <div className="p-4 border-b border-gray-800">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <Plus className="w-5 h-5 text-yellow-400" />
              Create New Task
            </h3>
            <button
              onClick={handleCancelNewTask}
              className="p-1 hover:bg-gray-800 rounded"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </div>
        
        <div className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Task Title
            </label>
            <input
              type="text"
              value={newTaskForm.title}
              onChange={(e) => setNewTaskForm({...newTaskForm, title: e.target.value})}
              placeholder="What do you want to accomplish?"
              className="w-full bg-gray-800 text-white px-3 py-2 rounded border border-gray-700 focus:border-yellow-400 focus:outline-none"
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Time
              </label>
              <input
                type="time"
                value={newTaskForm.time}
                onChange={(e) => setNewTaskForm({...newTaskForm, time: e.target.value})}
                className="w-full bg-gray-800 text-white px-3 py-2 rounded border border-gray-700 focus:border-yellow-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Duration (min)
              </label>
              <input
                type="number"
                value={newTaskForm.duration}
                onChange={(e) => setNewTaskForm({...newTaskForm, duration: parseInt(e.target.value) || 30})}
                min="5"
                max="480"
                className="w-full bg-gray-800 text-white px-3 py-2 rounded border border-gray-700 focus:border-yellow-400 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Category
            </label>
            <select
              value={newTaskForm.category}
              onChange={(e) => setNewTaskForm({...newTaskForm, category: e.target.value})}
              className="w-full bg-gray-800 text-white px-3 py-2 rounded border border-gray-700 focus:border-yellow-400 focus:outline-none"
            >
              <option value="general">General</option>
              <option value="work">Work</option>
              <option value="wellness">Wellness</option>
              <option value="fitness">Fitness</option>
              <option value="growth">Growth</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Description (optional)
            </label>
            <textarea
              value={newTaskForm.description}
              onChange={(e) => setNewTaskForm({...newTaskForm, description: e.target.value})}
              placeholder="Add any additional details..."
              rows={3}
              className="w-full bg-gray-800 text-white px-3 py-2 rounded border border-gray-700 focus:border-yellow-400 focus:outline-none resize-none"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={handleCancelNewTask}
              className="flex-1 bg-gray-700 text-white py-2 px-4 rounded-lg font-medium hover:bg-gray-600 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleCreateTask}
              disabled={!newTaskForm.title.trim()}
              className="flex-1 bg-yellow-400 text-black py-2 px-4 rounded-lg font-medium hover:bg-yellow-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Create Task
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
            {/* Background grid with drop zones and click handlers */}
            {timeSlots.map((slot, index) => {
              const hasTask = tasks.some(task => 
                task.time === slot.timeString && 
                task.date.toDateString() === currentDate.toDateString()
              );

              return (
                <div
                  key={`bg-${slot.hour}-${slot.minute}`}
                  className={`h-4 border-b border-gray-800/30 transition-colors cursor-pointer ${
                    slot.minute === 0 ? 'border-gray-700' : ''
                  } ${
                    hasTask 
                      ? 'hover:bg-gray-800/10' 
                      : 'hover:bg-yellow-400/10 hover:border-yellow-400/20'
                  }`}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, slot.timeString, currentDate)}
                  onClick={() => !hasTask && handleTimeSlotClick(slot.timeString, currentDate)}
                  title={hasTask ? '' : `Click to create task at ${slot.timeString}`}
                />
              );
            })}

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
                            <option value="general">General</option>
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
                    }`}
                    style={{ 
                      top: `${topPosition}px`,
                      height: `${Math.max(heightInPixels, 32)}px`,
                      minHeight: '32px'
                    }}
                  >
                    <div className="p-1 h-full flex flex-col justify-between relative">
                      <div className="flex items-center gap-1">
                        <input
                          type="checkbox"
                          checked={task.completed}
                          onChange={() => toggleTaskComplete(task.id)}
                          disabled={task.completed}
                          className="w-3 h-3 rounded border-gray-300 text-yellow-400 focus:ring-yellow-400 focus:ring-1 flex-shrink-0"
                          onClick={(e) => e.stopPropagation()}
                        />
                        <div className={`font-medium leading-tight flex-1 ${task.completed ? 'line-through' : ''}`}>
                          {task.title}
                        </div>
                      </div>
                      
                      {heightInPixels > 24 && (
                        <div className="text-xs opacity-75 mt-0.5 flex items-center justify-between">
                          <span>{task.time} • {task.duration}min</span>
                          {task.completed && task.completed_at && (
                            <span className="text-green-300">
                              ✓ {task.completed_at.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Accountability Button - Always visible when accountability is set */}
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
                      
                      {/* Task controls - only visible on hover */}
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
                if (currentMinutes >= 0 && currentMinutes <= 18 * 60) { // 6 AM to 12 AM
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
                  className="border-r border-gray-800 last:border-r-0 p-2 relative hover:bg-gray-800/20 transition-colors cursor-pointer"
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, hourTime, dayDate)}
                  onClick={() => handleTimeSlotClick(hourTime, dayDate)}
                  title={`Click to create task at ${hourTime}`}
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
                          } ${getCategoryColor(task.category)}`}
                          style={{ height: `${Math.min(task.duration, 50)}px` }}
                        >
                          <div className="flex items-center gap-1">
                            <input
                              type="checkbox"
                              checked={task.completed}
                              onChange={() => toggleTaskComplete(task.id)}
                              disabled={task.completed}
                              className="w-3 h-3 rounded border-gray-300 text-yellow-400 focus:ring-yellow-400 focus:ring-1 flex-shrink-0"
                              onClick={(e) => e.stopPropagation()}
                            />
                            <div className={`font-medium flex-1 ${task.completed ? 'line-through' : ''}`}>
                              {task.title}
                            </div>
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
                className={`min-h-[80px] p-2 border-r border-b border-gray-800 last:border-r-0 hover:bg-gray-800/20 transition-colors cursor-pointer ${
                  !isCurrentMonth ? 'bg-gray-800/50' : ''
                }`}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, '09:00', day)}
                onClick={() => handleTimeSlotClick('09:00', day)}
                title={`Click to create task on ${day.toLocaleDateString()}`}
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
                        className={`text-xs p-1 rounded cursor-move hover:scale-105 transition-transform ${getCategoryColor(task.category)} text-white flex items-center gap-1`}
                      >
                        <input
                          type="checkbox"
                          checked={task.completed}
                          onChange={() => toggleTaskComplete(task.id)}
                          disabled={task.completed}
                          className="w-2 h-2 rounded border-gray-300 text-yellow-400 focus:ring-yellow-400 focus:ring-1 flex-shrink-0"
                          onClick={(e) => e.stopPropagation()}
                        />
                        <div className={`truncate ${task.completed ? 'line-through' : ''}`}>{task.title}</div>
                        {task.accountability && accountabilityInfo && (
                          <accountabilityInfo.icon className="w-2 h-2 flex-shrink-0" />
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
              <div key={task.id} className="p-4 hover:bg-gray-800/50 transition-colors group">
                <div className="flex items-center gap-4">
                  <div className={`w-3 h-3 rounded-full ${getCategoryColor(task.category)}`}></div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className={`font-medium text-white ${task.completed ? 'line-through opacity-50' : ''}`}>
                        {task.title}
                      </h4>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-400 mt-1">
                      <span>{task.date.toLocaleDateString()}</span>
                      <span>{task.time}</span>
                      <span>{task.duration} min</span>
                      <span className="capitalize">{task.category}</span>
                      {task.completed && task.completed_at && (
                        <span className="text-green-400">
                          ✓ Completed at {task.completed_at.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                    </div>
                    
                    {/* Accountability Button in Schedule View */}
                    {task.accountability && accountabilityInfo && (
                      <button
                        onClick={() => setShowAccountabilityModal(task.id)}
                        className={`mt-2 px-3 py-1 rounded text-xs font-medium text-white transition-all ${accountabilityInfo.buttonColor} flex items-center gap-1`}
                      >
                        <accountabilityInfo.icon className="w-3 h-3" />
                        {accountabilityInfo.title}
                      </button>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => startEditing(task)}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-700 rounded transition-all"
                    >
                      <Edit3 className="w-4 h-4 text-gray-400" />
                    </button>
                    <button
                      onClick={() => deleteTask(task.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-700 rounded transition-all"
                    >
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </button>
                    <input
                      type="checkbox"
                      checked={task.completed}
                      onChange={() => toggleTaskComplete(task.id)}
                      disabled={task.completed}
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
        
        <button
          onClick={() => onNavigate('goal-wizard')}
          className="bg-yellow-400 text-black px-4 md:px-6 py-2 md:py-3 rounded-xl font-semibold hover:bg-yellow-300 transition-colors flex items-center gap-2 w-fit"
        >
          <Plus className="w-4 md:w-5 h-4 md:h-5" />
          <span className="text-sm md:text-base">Add Goal</span>
        </button>
      </div>

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

      {/* Accountability Modal */}
      {showAccountabilityModal && (
        <AccountabilityModal 
          task={tasks.find(t => t.id === showAccountabilityModal)!} 
        />
      )}

      {/* New Task Modal */}
      {showNewTaskModal && <NewTaskModal />}

      {/* Drag and Drop Instructions */}
      {draggedTask && (
        <div className="fixed bottom-20 md:bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 bg-yellow-400 text-black p-3 rounded-lg shadow-lg z-50">
          <p className="text-sm font-medium">
            📅 Dragging "{draggedTask.title}" - Drop on any time slot to reschedule!
          </p>
        </div>
      )}

      {/* Click to Create Instructions */}
      {currentView === 'day' && (
        <div className="fixed bottom-32 md:bottom-16 left-4 right-4 md:left-auto md:right-4 md:w-80 bg-blue-500/20 border border-blue-500/40 text-blue-400 p-3 rounded-lg shadow-lg z-40">
          <p className="text-sm font-medium">
            💡 Click on any empty time slot to create a new task!
          </p>
        </div>
      )}
    </div>
  );
};