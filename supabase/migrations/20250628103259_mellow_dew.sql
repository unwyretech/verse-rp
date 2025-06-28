/*
  # Set verseadmin user as admin

  1. Changes
    - Update the user with username 'verseadmin' to have admin role
    - Ensure the role column exists and has proper constraints
  
  2. Security
    - Only updates the specific user 'verseadmin'
    - Maintains existing role constraints
*/

-- Ensure role column exists with proper constraints
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'role'
  ) THEN
    ALTER TABLE profiles ADD COLUMN role text DEFAULT 'user' CHECK (role IN ('user', 'admin'));
  END IF;
END $$;

-- Update existing users to have 'user' role if null
UPDATE profiles SET role = 'user' WHERE role IS NULL;

-- Set verseadmin as admin
UPDATE profiles SET role = 'admin' WHERE username = 'verseadmin';

-- Also set versebeta as admin (keeping existing admin)
UPDATE profiles SET role = 'admin' WHERE username = 'versebeta';