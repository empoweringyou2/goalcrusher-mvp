/*
  # Fix guest user creation policy

  1. Security Changes
    - Drop and recreate the RLS policy for anonymous guest user creation
    - Ensure the policy allows INSERT operations for anon role with proper conditions
    - Add proper constraints for guest user email format and user_type

  This migration fixes the RLS policy violation that prevents guest users from being created.
*/

-- Drop the existing policy if it exists
DROP POLICY IF EXISTS "Allow anon to create guest users" ON users;

-- Create a new policy that properly allows anonymous users to create guest accounts
CREATE POLICY "Allow anon to create guest users"
  ON users
  FOR INSERT
  TO anon
  WITH CHECK (
    user_type = 'guest' AND 
    email LIKE 'guest-%@goalcrusher.app' AND 
    plan = 'free'
  );

-- Also ensure we have a policy for anon users to read guest user data
DROP POLICY IF EXISTS "Allow anon to read guest users" ON users;

CREATE POLICY "Allow anon to read guest users"
  ON users
  FOR SELECT
  TO anon
  USING (
    user_type = 'guest' AND 
    email LIKE 'guest-%@goalcrusher.app'
  );