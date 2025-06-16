/*
  # Add Habits and Calendar Features

  1. New Tables
    - habits: Daily rituals and habit tracking
    - habit_completions: Track when habits are completed
    - habit_streaks: Track habit streaks
    - calendar_events: Calendar integration
    - recurring_patterns: For recurring events
    - daily_checkins: Daily mood and productivity tracking

  2. Security
    - Enable RLS on all new tables
    - Add policies for user data access
*/

-- Calendar & Scheduling
CREATE TABLE IF NOT EXISTS calendar_events (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  task_id uuid REFERENCES tasks(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  start_time timestamptz NOT NULL,
  end_time timestamptz NOT NULL,
  all_day boolean DEFAULT false,
  event_type text DEFAULT 'task' CHECK (event_type IN ('task', 'goal', 'habit', 'personal', 'work')),
  recurring_pattern_id uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS recurring_patterns (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  pattern_type text NOT NULL CHECK (pattern_type IN ('daily', 'weekly', 'monthly', 'yearly')),
  interval_value integer DEFAULT 1,
  days_of_week integer[],
  day_of_month integer,
  end_date date,
  max_occurrences integer,
  created_at timestamptz DEFAULT now()
);

-- Habits & Rituals
CREATE TABLE IF NOT EXISTS habits (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  description text,
  category text DEFAULT 'wellness' CHECK (category IN ('wellness', 'personal', 'growth', 'fitness', 'work')),
  icon text DEFAULT 'Target',
  target_time time,
  estimated_duration integer DEFAULT 15,
  xp_reward integer DEFAULT 25,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS habit_completions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  habit_id uuid REFERENCES habits(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  completion_date date NOT NULL,
  completed_at timestamptz DEFAULT now(),
  notes text,
  mood_rating integer CHECK (mood_rating >= 1 AND mood_rating <= 5),
  UNIQUE(habit_id, completion_date)
);

CREATE TABLE IF NOT EXISTS habit_streaks (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  habit_id uuid REFERENCES habits(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  current_streak integer DEFAULT 0,
  longest_streak integer DEFAULT 0,
  last_completion_date date,
  streak_start_date date,
  updated_at timestamptz DEFAULT now(),
  UNIQUE(habit_id, user_id)
);

-- Check-ins & Tracking
CREATE TABLE IF NOT EXISTS daily_checkins (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  checkin_date date NOT NULL,
  energy_level integer CHECK (energy_level >= 1 AND energy_level <= 10),
  mood_rating integer CHECK (mood_rating >= 1 AND mood_rating <= 10),
  productivity_rating integer CHECK (productivity_rating >= 1 AND productivity_rating <= 10),
  stress_level integer CHECK (stress_level >= 1 AND stress_level <= 10),
  sleep_hours decimal(3,1),
  notes text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, checkin_date)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_habits_user_id ON habits(user_id);
CREATE INDEX IF NOT EXISTS idx_habit_completions_user_date ON habit_completions(user_id, completion_date);
CREATE INDEX IF NOT EXISTS idx_daily_checkins_user_date ON daily_checkins(user_id, checkin_date);

-- Enable RLS
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE recurring_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE habits ENABLE ROW LEVEL SECURITY;
ALTER TABLE habit_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE habit_streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_checkins ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage own calendar events" ON calendar_events FOR ALL TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can manage own recurring patterns" ON recurring_patterns FOR ALL TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can manage own habits" ON habits FOR ALL TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can manage own habit completions" ON habit_completions FOR ALL TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can manage own habit streaks" ON habit_streaks FOR ALL TO authenticated USING (user_id = auth.uid());
CREATE POLICY "Users can manage own daily checkins" ON daily_checkins FOR ALL TO authenticated USING (user_id = auth.uid());

-- Update triggers
CREATE TRIGGER update_calendar_events_updated_at BEFORE UPDATE ON calendar_events FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_habits_updated_at BEFORE UPDATE ON habits FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_habit_streaks_updated_at BEFORE UPDATE ON habit_streaks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();