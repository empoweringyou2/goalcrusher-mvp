/*
  # Auto User Creation Trigger

  This migration creates a trigger that automatically creates user records
  in public.users, user_settings, and user_profiles when a new user
  is authenticated in auth.users.

  1. Functions
    - handle_new_user(): Creates user records automatically
    - extract_name_from_metadata(): Helper to extract name from user metadata

  2. Trigger
    - on_auth_user_created: Fires when new user is inserted into auth.users

  3. Security
    - Uses SECURITY DEFINER to bypass RLS for automatic user creation
    - Ensures data consistency across all user-related tables
*/

-- Helper function to extract name from user metadata
CREATE OR REPLACE FUNCTION extract_name_from_metadata(metadata jsonb, email text)
RETURNS text
LANGUAGE plpgsql
AS $$
BEGIN
  -- Try to get name from various metadata fields
  IF metadata ? 'full_name' AND metadata->>'full_name' != '' THEN
    RETURN metadata->>'full_name';
  ELSIF metadata ? 'name' AND metadata->>'name' != '' THEN
    RETURN metadata->>'name';
  ELSIF metadata ? 'display_name' AND metadata->>'display_name' != '' THEN
    RETURN metadata->>'display_name';
  ELSIF email IS NOT NULL THEN
    -- Fallback to email username
    RETURN split_part(email, '@', 1);
  ELSE
    -- Final fallback
    RETURN 'Goal Crusher';
  END IF;
END;
$$;

-- Helper function to extract avatar from user metadata
CREATE OR REPLACE FUNCTION extract_avatar_from_metadata(metadata jsonb)
RETURNS text
LANGUAGE plpgsql
AS $$
BEGIN
  -- Try to get avatar from various metadata fields
  IF metadata ? 'avatar_url' AND metadata->>'avatar_url' != '' THEN
    RETURN metadata->>'avatar_url';
  ELSIF metadata ? 'picture' AND metadata->>'picture' != '' THEN
    RETURN metadata->>'picture';
  ELSIF metadata ? 'photo_url' AND metadata->>'photo_url' != '' THEN
    RETURN metadata->>'photo_url';
  ELSE
    -- Default avatar
    RETURN '🧙‍♂️';
  END IF;
END;
$$;

-- Main function to handle new user creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_name text;
  user_avatar text;
  existing_user_id uuid;
BEGIN
  -- Log the trigger execution
  RAISE LOG 'handle_new_user triggered for user: % with email: %', NEW.id, NEW.email;

  -- Extract name and avatar from metadata
  user_name := extract_name_from_metadata(NEW.raw_user_meta_data, NEW.email);
  user_avatar := extract_avatar_from_metadata(NEW.raw_user_meta_data);

  -- Check if a user with this email already exists in public.users
  SELECT id INTO existing_user_id
  FROM public.users
  WHERE email = NEW.email
  LIMIT 1;

  IF existing_user_id IS NOT NULL THEN
    -- User exists with this email but different auth.uid()
    -- Update the existing user's ID to match the new auth.uid()
    RAISE LOG 'Updating existing user ID from % to % for email: %', existing_user_id, NEW.id, NEW.email;
    
    UPDATE public.users
    SET 
      id = NEW.id,
      name = COALESCE(user_name, name),
      avatar = COALESCE(user_avatar, avatar),
      updated_at = now()
    WHERE email = NEW.email;

    -- Update user_settings user_id if it exists
    UPDATE public.user_settings
    SET user_id = NEW.id
    WHERE user_id = existing_user_id;

    -- Update user_profiles user_id if it exists
    UPDATE public.user_profiles
    SET user_id = NEW.id
    WHERE user_id = existing_user_id;

  ELSE
    -- Create new user record
    RAISE LOG 'Creating new user record for: % with email: %', NEW.id, NEW.email;
    
    INSERT INTO public.users (
      id,
      email,
      name,
      avatar,
      plan,
      beta_access,
      timezone
    ) VALUES (
      NEW.id,
      NEW.email,
      user_name,
      user_avatar,
      'free',
      true,
      'UTC'
    );
  END IF;

  -- Ensure user_settings exists (create if not exists)
  INSERT INTO public.user_settings (
    user_id,
    dark_mode,
    notifications_enabled,
    sound_enabled,
    gamification_enabled,
    achievements_enabled,
    crushion_voice_style,
    data_training_consent,
    email_frequency,
    accountability_type,
    completion_method_setting,
    default_proof_time_minutes,
    has_created_first_goal
  ) VALUES (
    NEW.id,
    true,
    true,
    true,
    true,
    true,
    'friendly',
    false,
    'daily',
    'self',
    'user',
    10,
    false
  )
  ON CONFLICT (user_id) DO UPDATE SET
    updated_at = now();

  -- Ensure user_profiles exists (create if not exists)
  INSERT INTO public.user_profiles (
    user_id,
    profile_completed
  ) VALUES (
    NEW.id,
    false
  )
  ON CONFLICT (user_id) DO UPDATE SET
    updated_at = now();

  RAISE LOG 'Successfully processed user creation for: %', NEW.id;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail the auth process
    RAISE LOG 'Error in handle_new_user for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

-- Create the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Grant necessary permissions for the trigger function
GRANT USAGE ON SCHEMA public TO postgres;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres;

-- Add unique constraint on user_settings.user_id if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'user_settings' AND constraint_name = 'user_settings_user_id_key'
  ) THEN
    ALTER TABLE public.user_settings ADD CONSTRAINT user_settings_user_id_key UNIQUE (user_id);
  END IF;
END $$;

-- Ensure user_profiles has unique constraint on user_id (should already exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'user_profiles' AND constraint_name = 'user_profiles_user_id_key'
  ) THEN
    ALTER TABLE public.user_profiles ADD CONSTRAINT user_profiles_user_id_key UNIQUE (user_id);
  END IF;
END $$;

-- Log successful migration
DO $$
BEGIN
  RAISE NOTICE 'Auto user creation trigger installed successfully';
  RAISE NOTICE 'New users will automatically get records in users, user_settings, and user_profiles tables';
END $$;