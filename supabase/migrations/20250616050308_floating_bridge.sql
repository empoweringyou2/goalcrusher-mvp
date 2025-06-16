/*
  # Fix RLS policies for users table

  1. Security Updates
    - Add policy for anonymous users to create guest users
    - Add policy for authenticated users to create their own profiles
    - Ensure existing policies work correctly with new INSERT policies

  2. Changes
    - Allow anon role to INSERT guest users (user_type = 'guest')
    - Allow authenticated users to INSERT their own profile (auth.uid() = id)
    - Keep existing SELECT and UPDATE policies intact
*/

-- Drop existing INSERT policy if it exists to avoid conflicts
DROP POLICY IF EXISTS "Allow guest user creation" ON users;
DROP POLICY IF EXISTS "Allow authenticated users to create their own profile" ON users;

-- Policy to allow anonymous users to create guest users
CREATE POLICY "Allow anon to create guest users"
  ON users
  FOR INSERT
  TO anon
  WITH CHECK (user_type = 'guest');

-- Policy to allow authenticated users to create their own profile
CREATE POLICY "Allow authenticated users to create profile"
  ON users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id AND user_type = 'registered');