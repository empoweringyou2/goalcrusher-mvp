/*
  # Create user_profiles table

  1. New Tables
    - `user_profiles`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to users)
      - `values` (text array)
      - `preferred_planning_style` (text)
      - `voice_tone` (text)
      - `rituals` (text array)
      - `accountability_type` (text)
      - `celebration_type` (text)
      - `distraction_types` (text array)
      - `autonomy_preference` (text)
      - `focus_style` (text)
      - `communication_preference` (text)
      - `profile_completed` (boolean)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `user_profiles` table
    - Add policy for users to manage their own profiles
*/

CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  values text[],
  preferred_planning_style text,
  voice_tone text,
  rituals text[],
  accountability_type text,
  celebration_type text,
  distraction_types text[],
  autonomy_preference text,
  focus_style text,
  communication_preference text,
  profile_completed boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can manage own profile" ON user_profiles FOR ALL TO authenticated USING (user_id = auth.uid());

-- Allow anon users to manage guest user profiles
CREATE POLICY "Allow anon to manage guest profiles" ON user_profiles FOR ALL TO anon USING (
  user_id IN (
    SELECT id FROM users WHERE user_type = 'guest' AND email LIKE 'guest-%@goalcrusher.app'
  )
);

-- Update trigger
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);