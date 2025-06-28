-- Drop the user_type column and its constraint (idempotent operations)
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_user_type_check;
ALTER TABLE users DROP COLUMN IF EXISTS user_type;

-- Drop all existing RLS policies on users table
DROP POLICY IF EXISTS "Allow anon to create guest users" ON users;
DROP POLICY IF EXISTS "Allow anon to read guest users" ON users;
DROP POLICY IF EXISTS "Allow authenticated users to create profile" ON users;
DROP POLICY IF EXISTS "Users can read own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;
DROP POLICY IF EXISTS "Users can create own profile" ON users;

-- Drop guest user policies on user_profiles
DROP POLICY IF EXISTS "Allow anon to manage guest profiles" ON user_profiles;

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
  WITH CHECK (auth.uid() = id OR (auth.jwt() ->> 'email') = email AND id = auth.uid());

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