/*
  # Add Accountability Settings to User Settings

  1. Schema Updates
    - Add accountability_type column to user_settings
    - Add completion_method_setting column to user_settings  
    - Add default_proof_time_minutes column to user_settings
    - Add constraints for valid values

  2. Security
    - Existing RLS policies will apply to new columns
*/

-- Add new columns to user_settings table
DO $$
BEGIN
  -- Add accountability_type column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_settings' AND column_name = 'accountability_type'
  ) THEN
    ALTER TABLE user_settings ADD COLUMN accountability_type text DEFAULT 'self';
  END IF;

  -- Add completion_method_setting column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_settings' AND column_name = 'completion_method_setting'
  ) THEN
    ALTER TABLE user_settings ADD COLUMN completion_method_setting text DEFAULT 'user';
  END IF;

  -- Add default_proof_time_minutes column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_settings' AND column_name = 'default_proof_time_minutes'
  ) THEN
    ALTER TABLE user_settings ADD COLUMN default_proof_time_minutes integer DEFAULT 10;
  END IF;
END $$;

-- Add constraints for valid values
DO $$
BEGIN
  -- Add constraint for accountability_type
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'user_settings_accountability_type_check'
  ) THEN
    ALTER TABLE user_settings ADD CONSTRAINT user_settings_accountability_type_check
      CHECK (accountability_type IN ('self', 'ai', 'partner', 'group'));
  END IF;

  -- Add constraint for completion_method_setting
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'user_settings_completion_method_setting_check'
  ) THEN
    ALTER TABLE user_settings ADD CONSTRAINT user_settings_completion_method_setting_check
      CHECK (completion_method_setting IN ('user', 'ai', 'external'));
  END IF;

  -- Add constraint for default_proof_time_minutes
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'user_settings_default_proof_time_minutes_check'
  ) THEN
    ALTER TABLE user_settings ADD CONSTRAINT user_settings_default_proof_time_minutes_check
      CHECK (default_proof_time_minutes >= 1 AND default_proof_time_minutes <= 60);
  END IF;
END $$;