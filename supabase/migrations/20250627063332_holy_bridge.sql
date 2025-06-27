/*
  # Fix Google OAuth User Creation

  This migration fixes the user creation process for Google OAuth by:
  1. Allowing authenticated users to create profiles with proper email validation
  2. Ensuring RLS policies work correctly for OAuth users
  3. Adding proper constraints for OAuth user creation

  1. Security Changes
    - Update RLS policies to handle OAuth user creation properly
    - Allow authenticated users to create their own profiles
    - Ensure email validation works correctly

  2. Policy Updates
    - Fix INSERT policy for authenticated users
    - Ensure SELECT and UPDATE policies work with OAuth
    - Add proper validation for user creation
*/

-- Drop existing policies to recreate them properly
DROP POLICY IF EXISTS "Allow authenticated users to create profile" ON users;
DROP POLICY IF EXISTS "Users can read own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;

-- Policy to allow authenticated users to create their own profile
CREATE POLICY "Allow authenticated users to create profile"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = id AND 
    user_type = 'registered'
  );

-- Policy for reading user data
CREATE POLICY "Users can read own data"
  ON users
  FOR SELECT
  TO public
  USING (
    -- Allow if the user owns the record by ID
    (auth.uid() = id) OR 
    -- Allow if this is a guest user
    (
      user_type = 'guest' AND 
      (id)::text = current_setting('app.current_user_id'::text, true)
    )
  );

-- Policy for updating user data
CREATE POLICY "Users can update own data"
  ON users
  FOR UPDATE
  TO public
  USING (
    -- Allow if the user owns the record by ID
    (auth.uid() = id) OR 
    -- Allow if this is a guest user
    (
      user_type = 'guest' AND 
      (id)::text = current_setting('app.current_user_id'::text, true)
    ) OR
    -- Allow if authenticated user's email matches (for ID synchronization)
    (
      auth.role() = 'authenticated' AND 
      (auth.jwt() ->> 'email') = email
    )
  )
  WITH CHECK (
    -- Ensure the user can only update their own record by ID
    (auth.uid() = id) OR 
    -- Allow guest user updates
    (
      user_type = 'guest' AND 
      (id)::text = current_setting('app.current_user_id'::text, true)
    ) OR
    -- Allow ID updates when authenticated user's email matches
    (
      auth.role() = 'authenticated' AND 
      (auth.jwt() ->> 'email') = email AND
      id = auth.uid()
    )
  );