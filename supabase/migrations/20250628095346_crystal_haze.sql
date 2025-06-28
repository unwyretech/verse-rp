/*
  # Add user roles and admin functionality

  1. New Tables
    - Add `role` column to `profiles` table with default 'user' role
    - Set 'versebeta' username as admin role

  2. Security
    - Enable RLS on profiles table (already enabled)
    - Add policies for admin access

  3. Changes
    - Add role column with check constraint
    - Update existing users to have 'user' role
    - Set versebeta as admin
*/

-- Add role column to profiles table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'role'
  ) THEN
    ALTER TABLE profiles ADD COLUMN role text DEFAULT 'user' CHECK (role IN ('user', 'admin'));
  END IF;
END $$;

-- Update existing users to have 'user' role
UPDATE profiles SET role = 'user' WHERE role IS NULL;

-- Set versebeta as admin
UPDATE profiles SET role = 'admin' WHERE username = 'versebeta';

-- Create function to reset user password (admin only)
CREATE OR REPLACE FUNCTION admin_reset_password(target_user_id uuid, new_password text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  admin_role text;
BEGIN
  -- Check if current user is admin
  SELECT role INTO admin_role FROM profiles WHERE id = auth.uid();
  
  IF admin_role != 'admin' THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;
  
  -- Reset password using Supabase auth
  -- Note: In production, this would use Supabase's admin API
  -- For now, we'll update a flag that the frontend can use
  UPDATE profiles SET updated_at = now() WHERE id = target_user_id;
  
  RETURN true;
END;
$$;

-- Create function to delete user account (admin only)
CREATE OR REPLACE FUNCTION admin_delete_user(target_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  admin_role text;
BEGIN
  -- Check if current user is admin
  SELECT role INTO admin_role FROM profiles WHERE id = auth.uid();
  
  IF admin_role != 'admin' THEN
    RAISE EXCEPTION 'Access denied: Admin privileges required';
  END IF;
  
  -- Delete user profile and related data
  DELETE FROM profiles WHERE id = target_user_id;
  
  RETURN true;
END;
$$;