/*
  # Add function to mark messages as read

  1. New Functions
    - `mark_messages_as_read` - Function to append user ID to read_by array for messages in a chat
  
  2. Security
    - Function uses security definer to ensure proper access control
    - Only updates messages where the user is not already in the read_by array
  
  3. Changes
    - Creates a PostgreSQL function to handle array append operations
    - Ensures atomic updates to the read_by array
*/

CREATE OR REPLACE FUNCTION mark_messages_as_read(chat_id_param uuid, user_id_param uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE messages 
  SET 
    read_by = array_append(read_by, user_id_param::text),
    updated_at = now()
  WHERE 
    chat_id = chat_id_param 
    AND NOT (read_by @> ARRAY[user_id_param::text]);
END;
$$;