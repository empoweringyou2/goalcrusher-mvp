/*
  # Remove Guest User Functionality

  This migration completely removes guest user functionality from the database:
  1. Deletes all guest user data
  2. Drops the user_type column and its constraints
  3. Simplifies RLS policies for authenticated users only
  4. Revokes anonymous permissions
*/

-- First, delete any existing guest users and their associated data
DELETE FROM user_profiles WHERE user_id IN (
  SELECT id FROM users WHERE user_type = 'guest'
);

DELETE FROM user_settings WHERE user_id IN (
  SELECT id FROM users WHERE user_type = 'guest'
);

DELETE FROM tasks WHERE user_id IN (
  SELECT id FROM users WHERE user_type = 'guest'
);

DELETE FROM goals WHERE user_id IN (
  SELECT id FROM users WHERE user_type = 'guest'
);

DELETE FROM life_domains WHERE user_id IN (
  SELECT id FROM users WHERE user_type = 'guest'
);

DELETE FROM habits WHERE user_id IN (
  SELECT id FROM users WHERE user_type = 'guest'
);

DELETE FROM daily_checkins WHERE user_id IN (
  SELECT id FROM users WHERE user_type = 'guest'
);

DELETE FROM users WHERE user_type = 'guest';

-- Drop ALL existing RLS policies on users table that might reference user_type
DROP POLICY IF EXISTS "Allow anon to create guest users" ON users;
DROP POLICY IF EXISTS "Allow anon to read guest users" ON users;
DROP POLICY IF EXISTS "Allow authenticated users to create profile" ON users;
DROP POLICY IF EXISTS "Users can read own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;
DROP POLICY IF EXISTS "Users can create own profile" ON users;

-- Drop guest user policies on user_profiles
DROP POLICY IF EXISTS "Allow anon to manage guest profiles" ON user_profiles;

-- Now we can safely drop the user_type column and its constraint
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_user_type_check;
ALTER TABLE users DROP COLUMN IF EXISTS user_type;

-- Recreate simplified RLS policies for authenticated users only
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
  WITH CHECK (auth.uid() = id OR ((auth.jwt() ->> 'email') = email AND id = auth.uid()));

CREATE POLICY "Users can create own profile"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Ensure user_profiles has proper RLS for authenticated users only
DROP POLICY IF EXISTS "Users can manage own profile" ON user_profiles;

CREATE POLICY "Users can manage own profile"
  ON user_profiles
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid());

-- Revoke any permissions granted to anon role on relevant tables
REVOKE ALL ON TABLE public.users FROM anon;
REVOKE ALL ON TABLE public.user_profiles FROM anon;
REVOKE ALL ON TABLE public.user_settings FROM anon;

-- Add comment to document the change
COMMENT ON TABLE users IS 'User accounts table - guest user functionality removed';