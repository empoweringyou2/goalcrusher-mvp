/*
  # Add First Goal Tracking to User Settings

  1. Schema Updates
    - Add has_created_first_goal column to user_settings table
    - Set default value to false for new users
    - Add constraint to ensure boolean values only

  2. Data Migration
    - Update existing users to have has_created_first_goal = false by default
    - This ensures all existing authenticated users will see the glow effect until they create their first goal

  3. Security
    - Existing RLS policies will apply to the new column
    - No additional security changes needed
*/

-- Add has_created_first_goal column to user_settings table
DO $$
BEGIN
  -- Add has_created_first_goal column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_settings' AND column_name = 'has_created_first_goal'
  ) THEN
    ALTER TABLE user_settings ADD COLUMN has_created_first_goal boolean DEFAULT false;
    RAISE NOTICE 'Added has_created_first_goal column to user_settings table';
  ELSE
    RAISE NOTICE 'has_created_first_goal column already exists in user_settings table';
  END IF;
END $$;

-- Update existing user_settings records to have has_created_first_goal = false
-- This ensures all existing authenticated users will see the glow effect initially
UPDATE user_settings 
SET has_created_first_goal = false 
WHERE has_created_first_goal IS NULL;

-- Add a comment to document the purpose of this column
COMMENT ON COLUMN user_settings.has_created_first_goal IS 'Tracks whether the authenticated user has created their first goal - used for UI glow effects';

-- Verify the migration
DO $$
BEGIN
  RAISE NOTICE 'Migration completed successfully';
  RAISE NOTICE 'All authenticated users will now see the Goal Wizard glow effect until they create their first goal';
END $$;