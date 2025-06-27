/*
  # Remove Guest User Functionality (Fixed)

  This migration removes guest user functionality from the database:
  1. Safely deletes any guest user data (if user_type column exists)
  2. Drops the user_type column and its constraints (if they exist)
  3. Simplifies RLS policies for authenticated users only
  4. Revokes anonymous permissions

  This migration is safe to run even if guest user functionality was already partially removed.
*/

-- First, check if user_type column exists and delete guest users if it does
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'user_type'
  ) THEN
    -- Delete guest user data from related tables
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

    DELETE FROM habit_completions WHERE user_id IN (
      SELECT id FROM users WHERE user_type = 'guest'
    );

    DELETE FROM habit_streaks WHERE user_id IN (
      SELECT id FROM users WHERE user_type = 'guest'
    );

    DELETE FROM daily_checkins WHERE user_id IN (
      SELECT id FROM users WHERE user_type = 'guest'
    );

    DELETE FROM calendar_events WHERE user_id IN (
      SELECT id FROM users WHERE user_type = 'guest'
    );

    DELETE FROM recurring_patterns WHERE user_id IN (
      SELECT id FROM users WHERE user_type = 'guest'
    );

    DELETE FROM friendships WHERE requester_id IN (
      SELECT id FROM users WHERE user_type = 'guest'
    ) OR addressee_id IN (
      SELECT id FROM users WHERE user_type = 'guest'
    );

    DELETE FROM team_memberships WHERE user_id IN (
      SELECT id FROM users WHERE user_type = 'guest'
    );

    DELETE FROM accountability_partnerships WHERE user_id IN (
      SELECT id FROM users WHERE user_type = 'guest'
    ) OR partner_id IN (
      SELECT id FROM users WHERE user_type = 'guest'
    );

    DELETE FROM accountability_logs WHERE user_id IN (
      SELECT id FROM users WHERE user_type = 'guest'
    );

    DELETE FROM analytics_snapshots WHERE user_id IN (
      SELECT id FROM users WHERE user_type = 'guest'
    );

    DELETE FROM success_happiness_logs WHERE user_id IN (
      SELECT id FROM users WHERE user_type = 'guest'
    );

    DELETE FROM feature_flags WHERE user_id IN (
      SELECT id FROM users WHERE user_type = 'guest'
    );

    DELETE FROM audit_logs WHERE user_id IN (
      SELECT id FROM users WHERE user_type = 'guest'
    );

    DELETE FROM goal_templates WHERE user_id IN (
      SELECT id FROM users WHERE user_type = 'guest'
    );

    -- Finally delete the guest users themselves
    DELETE FROM users WHERE user_type = 'guest';

    RAISE NOTICE 'Guest user data has been cleaned up';
  ELSE
    RAISE NOTICE 'user_type column does not exist, skipping guest user cleanup';
  END IF;
END $$;

-- Drop ALL existing RLS policies on users table that might reference user_type
DROP POLICY IF EXISTS "Allow anon to create guest users" ON users;
DROP POLICY IF EXISTS "Allow anon to read guest users" ON users;
DROP POLICY IF EXISTS "Allow authenticated users to create profile" ON users;
DROP POLICY IF EXISTS "Users can read own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;
DROP POLICY IF EXISTS "Users can create own profile" ON users;
DROP POLICY IF EXISTS "Allow guest user creation" ON users;
DROP POLICY IF EXISTS "Allow authenticated users to create their own profile" ON users;

-- Drop guest user policies on user_profiles
DROP POLICY IF EXISTS "Allow anon to manage guest profiles" ON user_profiles;

-- Drop the user_type column and its constraint if they exist
DO $$
BEGIN
  -- Drop constraint if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'users_user_type_check'
  ) THEN
    ALTER TABLE users DROP CONSTRAINT users_user_type_check;
    RAISE NOTICE 'Dropped users_user_type_check constraint';
  END IF;

  -- Drop column if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'user_type'
  ) THEN
    ALTER TABLE users DROP COLUMN user_type;
    RAISE NOTICE 'Dropped user_type column';
  END IF;
END $$;

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
DO $$
BEGIN
  -- Revoke permissions if they exist
  BEGIN
    REVOKE ALL ON TABLE public.users FROM anon;
  EXCEPTION
    WHEN insufficient_privilege THEN
      RAISE NOTICE 'No permissions to revoke on users table for anon role';
  END;

  BEGIN
    REVOKE ALL ON TABLE public.user_profiles FROM anon;
  EXCEPTION
    WHEN insufficient_privilege THEN
      RAISE NOTICE 'No permissions to revoke on user_profiles table for anon role';
  END;

  BEGIN
    REVOKE ALL ON TABLE public.user_settings FROM anon;
  EXCEPTION
    WHEN insufficient_privilege THEN
      RAISE NOTICE 'No permissions to revoke on user_settings table for anon role';
  END;
END $$;

-- Add comment to document the change
COMMENT ON TABLE users IS 'User accounts table - guest user functionality removed';