/*
  # Add followers and following columns to characters table

  1. Changes
    - Add `followers` column to `characters` table (text array, default empty array)
    - Add `following` column to `characters` table (text array, default empty array)
  
  2. Notes
    - These columns will store arrays of user/character IDs that follow or are followed by each character
    - Default values are set to empty arrays to ensure consistency
    - Columns are nullable to allow for flexibility
*/

-- Add followers column to characters table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'characters' AND column_name = 'followers'
  ) THEN
    ALTER TABLE characters ADD COLUMN followers text[] DEFAULT '{}';
  END IF;
END $$;

-- Add following column to characters table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'characters' AND column_name = 'following'
  ) THEN
    ALTER TABLE characters ADD COLUMN following text[] DEFAULT '{}';
  END IF;
END $$;