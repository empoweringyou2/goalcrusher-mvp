/*
  # Remove Guest User Functionality

  This migration removes all guest user functionality from the database:
  1. Removes guest user RLS policies
  2. Updates user_type column constraint to only allow 'registered'
  3. Cleans up any existing guest user data
  4. Simplifies RLS policies to only handle authenticated users

  IMPORTANT: This will delete any existing guest user data!
*/

-- First, delete any existing guest users and their associated data
DELETE FROM user_profiles WHERE user_id IN (
  SELECT id FROM users WHERE user_type = 'guest'
);

DELETE FROM user_settings WHERE user_id IN (
  SELECT id FROM users WHERE user_type = 'guest'
);

DELETE FROM users WHERE user_type = 'guest';

-- Drop all existing RLS policies on users table
DROP POLICY IF EXISTS "Allow anon to create guest users" ON users;
DROP POLICY IF EXISTS "Allow anon to read guest users" ON users;
DROP POLICY IF EXISTS "Allow authenticated users to create profile" ON users;
DROP POLICY IF EXISTS "Users can read own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;

-- Drop guest user policies on user_profiles
DROP POLICY IF EXISTS "Allow anon to manage guest profiles" ON user_profiles;

-- Update the user_type column constraint to only allow 'registered'
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_user_type_check;
ALTER TABLE users ADD CONSTRAINT users_user_type_check 
  CHECK (user_type = 'registered');

-- Set default value for user_type to 'registered'
ALTER TABLE users ALTER COLUMN user_type SET DEFAULT 'registered';

-- Update any remaining users to be 'registered' type
UPDATE users SET user_type = 'registered' WHERE user_type != 'registered';

-- Create simplified RLS policies for authenticated users only
CREATE POLICY "Users can read own data" 
  ON users 
  FOR SELECT 
  TO authenticated 
  USING (auth.uid() = id);

CREATE POLICY "Users can update own data" 
  ON users 
  FOR UPDATE 
  TO authenticated 
  USING (auth.uid() = id OR (auth.jwt() ->> 'email') = email)
  WITH CHECK (auth.uid() = id OR (auth.jwt() ->> 'email') = email AND id = auth.uid());

CREATE POLICY "Users can create own profile" 
  ON users 
  FOR INSERT 
  TO authenticated 
  WITH CHECK (auth.uid() = id AND user_type = 'registered');

-- Simplify user_profiles RLS policy
DROP POLICY IF EXISTS "Users can manage own profile" ON user_profiles;

CREATE POLICY "Users can manage own profile" 
  ON user_profiles 
  FOR ALL 
  TO authenticated 
  USING (user_id = auth.uid());

-- Revoke any permissions granted to anon role
REVOKE ALL ON TABLE users FROM anon;
REVOKE ALL ON TABLE user_profiles FROM anon;
REVOKE ALL ON TABLE user_settings FROM anon;

-- Add comment to document the change
COMMENT ON TABLE users IS 'User accounts table - guest user functionality removed';