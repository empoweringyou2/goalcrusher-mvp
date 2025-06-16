/*
  # Add Guest User Support

  1. Schema Changes
    - Add user_type column to users table to distinguish between registered and guest users
    - Update constraints to allow guest users

  2. Security
    - Update RLS policies to handle guest users
    - Ensure guest users can only access their own data
*/

-- Add user_type column to users table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'user_type'
  ) THEN
    ALTER TABLE users ADD COLUMN user_type text DEFAULT 'registered' CHECK (user_type IN ('registered', 'guest'));
  END IF;
END $$;

-- Update RLS policies to handle guest users
DROP POLICY IF EXISTS "Users can read own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;

-- New policies that work for both authenticated and guest users
CREATE POLICY "Users can read own data" ON users FOR SELECT USING (
  (auth.uid() = id) OR 
  (user_type = 'guest' AND id::text = current_setting('app.current_user_id', true))
);

CREATE POLICY "Users can update own data" ON users FOR UPDATE USING (
  (auth.uid() = id) OR 
  (user_type = 'guest' AND id::text = current_setting('app.current_user_id', true))
);

-- Allow guest user creation
CREATE POLICY "Allow guest user creation" ON users FOR INSERT WITH CHECK (
  user_type = 'guest' OR auth.uid() = id
);