/*
  # Create user sessions table for token management

  1. New Tables
    - `user_sessions`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to profiles)
      - `session_token` (text, unique)
      - `refresh_token` (text, unique)
      - `expires_at` (timestamp)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
      - `is_active` (boolean)
      - `user_agent` (text, optional)
      - `ip_address` (text, optional)

  2. Security
    - Enable RLS on `user_sessions` table
    - Add policy for users to manage their own sessions
    - Add indexes for performance

  3. Functions
    - Function to clean up expired sessions
    - Function to validate session tokens
*/

-- Create user_sessions table
CREATE TABLE IF NOT EXISTS user_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  session_token text UNIQUE NOT NULL,
  refresh_token text UNIQUE NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  is_active boolean DEFAULT true,
  user_agent text,
  ip_address text
);

-- Enable RLS
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can manage their own sessions"
  ON user_sessions
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires ON user_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_user_sessions_active ON user_sessions(is_active);

-- Create updated_at trigger
CREATE TRIGGER update_user_sessions_updated_at
  BEFORE UPDATE ON user_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to clean up expired sessions
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Mark expired sessions as inactive
  UPDATE user_sessions 
  SET is_active = false, updated_at = now()
  WHERE expires_at < now() AND is_active = true;
  
  -- Delete sessions older than 30 days
  DELETE FROM user_sessions 
  WHERE created_at < now() - interval '30 days';
END;
$$;

-- Function to validate session token
CREATE OR REPLACE FUNCTION validate_session_token(token text)
RETURNS TABLE(
  user_id uuid,
  expires_at timestamptz,
  is_valid boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    us.user_id,
    us.expires_at,
    (us.is_active AND us.expires_at > now()) as is_valid
  FROM user_sessions us
  WHERE us.session_token = token;
END;
$$;

-- Function to create new session
CREATE OR REPLACE FUNCTION create_user_session(
  p_user_id uuid,
  p_session_token text,
  p_refresh_token text,
  p_expires_at timestamptz,
  p_user_agent text DEFAULT NULL,
  p_ip_address text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  session_id uuid;
BEGIN
  -- Deactivate old sessions for this user (optional - keep only one active session)
  UPDATE user_sessions 
  SET is_active = false, updated_at = now()
  WHERE user_id = p_user_id AND is_active = true;
  
  -- Create new session
  INSERT INTO user_sessions (
    user_id,
    session_token,
    refresh_token,
    expires_at,
    user_agent,
    ip_address
  ) VALUES (
    p_user_id,
    p_session_token,
    p_refresh_token,
    p_expires_at,
    p_user_agent,
    p_ip_address
  ) RETURNING id INTO session_id;
  
  RETURN session_id;
END;
$$;

-- Function to refresh session
CREATE OR REPLACE FUNCTION refresh_user_session(
  p_refresh_token text,
  p_new_session_token text,
  p_new_refresh_token text,
  p_new_expires_at timestamptz
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  session_exists boolean;
BEGIN
  -- Check if refresh token exists and is valid
  SELECT EXISTS(
    SELECT 1 FROM user_sessions 
    WHERE refresh_token = p_refresh_token 
    AND is_active = true 
    AND expires_at > now()
  ) INTO session_exists;
  
  IF NOT session_exists THEN
    RETURN false;
  END IF;
  
  -- Update session with new tokens
  UPDATE user_sessions 
  SET 
    session_token = p_new_session_token,
    refresh_token = p_new_refresh_token,
    expires_at = p_new_expires_at,
    updated_at = now()
  WHERE refresh_token = p_refresh_token;
  
  RETURN true;
END;
$$;

-- Function to invalidate session
CREATE OR REPLACE FUNCTION invalidate_session(p_session_token text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE user_sessions 
  SET is_active = false, updated_at = now()
  WHERE session_token = p_session_token;
  
  RETURN FOUND;
END;
$$;

-- Function to invalidate all user sessions
CREATE OR REPLACE FUNCTION invalidate_all_user_sessions(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE user_sessions 
  SET is_active = false, updated_at = now()
  WHERE user_id = p_user_id AND is_active = true;
END;
$$;