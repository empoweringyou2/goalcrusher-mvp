/*
  # Fix Guest User Creation RLS Policies

  This migration fixes the Row-Level Security policies to allow anonymous users
  to create guest accounts while maintaining security for regular users.

  1. Updates RLS policies to use correct auth.uid() function
  2. Allows anonymous users to create guest users with proper validation
  3. Maintains security for authenticated user operations
*/

-- Drop the existing policy if it exists
DROP POLICY IF EXISTS "Allow anon to create guest users" ON users;

-- Create a new policy that properly allows anonymous users to create guest users
CREATE POLICY "Allow anon to create guest users"
  ON users
  FOR INSERT
  TO anon
  WITH CHECK (
    user_type = 'guest' AND
    email LIKE 'guest-%@goalcrusher.app' AND
    plan = 'free'
  );

-- Ensure the policy for authenticated users to create their profile still works
DROP POLICY IF EXISTS "Allow authenticated users to create profile" ON users;

CREATE POLICY "Allow authenticated users to create profile"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (
    (auth.uid() = id) AND 
    (user_type = 'registered')
  );

-- Update the SELECT policy to ensure guest users can be read properly
DROP POLICY IF EXISTS "Users can read own data" ON users;

CREATE POLICY "Users can read own data"
  ON users
  FOR SELECT
  TO public
  USING (
    (auth.uid() = id) OR 
    (
      user_type = 'guest' AND 
      (id)::text = current_setting('app.current_user_id'::text, true)
    )
  );

-- Update the UPDATE policy to ensure guest users can be updated properly
DROP POLICY IF EXISTS "Users can update own data" ON users;

CREATE POLICY "Users can update own data"
  ON users
  FOR UPDATE
  TO public
  USING (
    (auth.uid() = id) OR 
    (
      user_type = 'guest' AND 
      (id)::text = current_setting('app.current_user_id'::text, true)
    )
  )
  WITH CHECK (
    (auth.uid() = id) OR 
    (
      user_type = 'guest' AND 
      (id)::text = current_setting('app.current_user_id'::text, true)
    )
  );