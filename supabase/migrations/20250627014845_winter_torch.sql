/*
  # Insert user profile for manually created auth user

  This migration creates a user profile for an existing auth user
  that was created manually in Supabase Auth but doesn't have
  a corresponding profile in the public.users table.
*/

-- Insert user profile for manually created auth user
-- Using the correct UUID format from the auth logs
INSERT INTO public.users (
  id,
  email,
  name,
  avatar,
  plan,
  beta_access,
  user_type,
  created_at,
  updated_at
) VALUES (
  '9d37de9d-9e1f-43bc-b9b2-8d114f339c0d'::uuid,
  'masculinecc8@gmail.com',
  'Goal Crusher',
  '🧙‍♂️',
  'free',
  true,
  'registered',
  now(),
  now()
) ON CONFLICT (id) DO NOTHING;

-- Insert default user settings
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
  created_at,
  updated_at
) VALUES (
  '9d37de9d-9e1f-43bc-b9b2-8d114f339c0d'::uuid,
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
  now(),
  now()
) ON CONFLICT (user_id) DO NOTHING;