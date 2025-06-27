/*
  # Fix User RLS Policy for ID Synchronization

  This migration fixes the Row-Level Security policy on the users table to allow
  the updateUserProfileIdByEmail function to work properly when a Google login
  results in a new auth.uid() for an existing user.

  1. Security Changes
    - Update the "Users can update own data" policy to allow ID updates when:
      - The authenticated user's email matches the email in the record
      - The new ID being set is the current auth.uid()
    - This enables seamless re-authentication for existing users with new auth IDs

  2. Policy Logic
    - USING clause: Allow access to records where auth.uid() matches OR email matches
    - WITH CHECK clause: Ensure updates maintain security constraints
*/

-- Drop the existing UPDATE policy
DROP POLICY IF EXISTS "Users can update own data" ON users;

-- Create new UPDATE policy that allows ID synchronization
CREATE POLICY "Users can update own data"
  ON users
  FOR UPDATE
  TO public
  USING (
    -- Allow if the user owns the record by ID
    (auth.uid() = id) OR 
    -- Allow if this is a guest user (existing logic)
    (
      user_type = 'guest' AND 
      (id)::text = current_setting('app.current_user_id'::text, true)
    ) OR
    -- NEW: Allow if authenticated user's email matches the record's email
    -- This enables ID synchronization for existing users with new auth.uid()
    (
      auth.role() = 'authenticated' AND 
      auth.jwt() ->> 'email' = email
    )
  )
  WITH CHECK (
    -- Ensure the user can only update their own record by ID
    (auth.uid() = id) OR 
    -- Allow guest user updates (existing logic)
    (
      user_type = 'guest' AND 
      (id)::text = current_setting('app.current_user_id'::text, true)
    ) OR
    -- NEW: Allow ID updates when authenticated user's email matches
    -- and the new ID is set to their current auth.uid()
    (
      auth.role() = 'authenticated' AND 
      auth.jwt() ->> 'email' = email AND
      id = auth.uid()
    )
  );