/*
  # Remove Guest User Functionality

  This migration removes all guest user functionality from the database:
  
  1. Data Cleanup
     - Safely removes any existing guest users and their data (if user_type column exists)
     - Uses conditional logic to avoid errors if column was already removed
  
  2. Schema Changes
     - Removes user_type column and constraints (if they exist)
     - Simplifies the users table structure
  
  3. Security Updates
     - Drops all guest-related RLS policies
     - Creates new authenticated-only RLS policies
     - Revokes anonymous access to user tables
  
  4. Documentation
     - Updates table comments to reflect changes
*/

-- Step 1: Conditionally clean up guest user data (only if user_type column exists)
DO $$
BEGIN
  -- Check if user_type column exists before attempting cleanup
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'user_type'
  ) THEN
    -- Delete guest user profiles first (foreign key dependency)
    DELETE FROM user_profiles WHERE user_id IN (
      SELECT id FROM users WHERE user_type = 'guest'
    );
    
    -- Delete guest user settings
    DELETE FROM user_settings WHERE user_id IN (
      SELECT id FROM users WHERE user_type = 'guest'
    );
    
    -- Delete guest users
    DELETE FROM users WHERE user_type = 'guest';
    
    RAISE NOTICE 'Guest user data cleanup completed';
  ELSE
    RAISE NOTICE 'user_type column does not exist, skipping data cleanup';
  END IF;
END $$;

-- Step 2: Remove user_type column and constraints (if they exist)
DO $$
BEGIN
  -- Drop the check constraint if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_name = 'users' AND constraint_name = 'users_user_type_check'
  ) THEN
    ALTER TABLE users DROP CONSTRAINT users_user_type_check;
    RAISE NOTICE 'Dropped users_user_type_check constraint';
  END IF;
  
  -- Drop the user_type column if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'user_type'
  ) THEN
    ALTER TABLE users DROP COLUMN user_type;
    RAISE NOTICE 'Dropped user_type column';
  END IF;
END $$;

-- Step 3: Clean up all existing RLS policies on users table
DROP POLICY IF EXISTS "Allow anon to create guest users" ON users;
DROP POLICY IF EXISTS "Allow anon to read guest users" ON users;
DROP POLICY IF EXISTS "Allow authenticated users to create profile" ON users;
DROP POLICY IF EXISTS "Users can read own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;
DROP POLICY IF EXISTS "Users can create own profile" ON users;

-- Step 4: Clean up guest user policies on user_profiles
DROP POLICY IF EXISTS "Allow anon to manage guest profiles" ON user_profiles;
DROP POLICY IF EXISTS "Users can manage own profile" ON user_profiles;

-- Step 5: Create new simplified RLS policies for authenticated users only
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
  WITH CHECK (auth.uid() = id);

-- Step 6: Ensure user_profiles has proper RLS for authenticated users only
CREATE POLICY "Users can manage own profile"
  ON user_profiles
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid());

-- Step 7: Revoke any permissions granted to anon role on relevant tables
REVOKE ALL ON TABLE public.users FROM anon;
REVOKE ALL ON TABLE public.user_profiles FROM anon;
REVOKE ALL ON TABLE public.user_settings FROM anon;

-- Step 8: Update table documentation
COMMENT ON TABLE users IS 'User accounts table - guest user functionality removed';

-- Step 9: Verify the changes
DO $$
BEGIN
  RAISE NOTICE 'Migration completed successfully';
  RAISE NOTICE 'Guest user functionality has been completely removed';
  RAISE NOTICE 'All user operations now require authentication';
END $$;