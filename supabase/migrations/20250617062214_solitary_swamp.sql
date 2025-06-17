/*
  # Grant INSERT permission to anon role on users table

  This migration grants the INSERT permission on the users table to the anon role,
  which is required for the existing RLS policy to work properly for guest user creation.
*/

-- Grant INSERT permission on users table to anon role
GRANT INSERT ON TABLE public.users TO anon;

-- Grant USAGE on the sequence used by the users table's UUID generation
GRANT USAGE ON SCHEMA public TO anon;