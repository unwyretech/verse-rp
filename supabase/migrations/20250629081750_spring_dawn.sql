/*
  # Simplify followers and following system

  1. New Tables
    - `follows` table to create simple user-to-user relationships
    - Remove complex array-based following from profiles and characters

  2. Changes
    - Create simple follows table with follower_id and following_id
    - Add indexes for performance
    - Enable RLS with proper policies

  3. Security
    - Users can manage their own follow relationships
    - Public read access for follow counts
*/

-- Create follows table if it doesn't exist
CREATE TABLE IF NOT EXISTS follows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  following_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(follower_id, following_id),
  CHECK (follower_id != following_id)
);

-- Enable RLS
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view all follows"
  ON follows
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Users can manage their own follows"
  ON follows
  FOR ALL
  TO authenticated
  USING (auth.uid() = follower_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_follows_follower_id ON follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following_id ON follows(following_id);

-- Function to get follower count
CREATE OR REPLACE FUNCTION get_follower_count(user_id uuid)
RETURNS bigint
LANGUAGE sql
STABLE
AS $$
  SELECT COUNT(*) FROM follows WHERE following_id = user_id;
$$;

-- Function to get following count
CREATE OR REPLACE FUNCTION get_following_count(user_id uuid)
RETURNS bigint
LANGUAGE sql
STABLE
AS $$
  SELECT COUNT(*) FROM follows WHERE follower_id = user_id;
$$;

-- Function to check if user A follows user B
CREATE OR REPLACE FUNCTION is_following(follower_id uuid, following_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT EXISTS(
    SELECT 1 FROM follows 
    WHERE follows.follower_id = is_following.follower_id 
    AND follows.following_id = is_following.following_id
  );
$$;