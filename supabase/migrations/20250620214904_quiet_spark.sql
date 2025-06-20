/*
  # Complete CharacterVerse Database Setup

  1. Database Schema
    - Creates all necessary tables with proper relationships
    - Sets up Row Level Security (RLS) policies
    - Creates indexes for performance
    - Sets up storage buckets for images

  2. Demo Data
    - Creates demo user accounts
    - Adds sample characters with rich backstories
    - Includes sample posts and interactions
    - Sets up notifications and comments

  3. Security
    - Enables RLS on all tables
    - Creates appropriate policies for data access
    - Sets up proper foreign key constraints
*/

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables if they exist (in correct order to handle dependencies)
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS chat_participants CASCADE;
DROP TABLE IF EXISTS chats CASCADE;
DROP TABLE IF EXISTS comments CASCADE;
DROP TABLE IF EXISTS post_interactions CASCADE;
DROP TABLE IF EXISTS posts CASCADE;
DROP TABLE IF EXISTS blocks CASCADE;
DROP TABLE IF EXISTS follows CASCADE;
DROP TABLE IF EXISTS characters CASCADE;
DROP TABLE IF EXISTS privacy_settings CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- Drop existing functions
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create profiles table (independent of auth.users for demo purposes)
CREATE TABLE profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username TEXT UNIQUE NOT NULL,
    display_name TEXT NOT NULL,
    avatar_url TEXT DEFAULT 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=150&h=150',
    header_image_url TEXT DEFAULT 'https://images.pexels.com/photos/1323550/pexels-photo-1323550.jpeg?auto=compress&cs=tinysrgb&w=800&h=300',
    bio TEXT DEFAULT '',
    writers_tag TEXT NOT NULL,
    email TEXT,
    two_factor_enabled BOOLEAN DEFAULT FALSE,
    followers TEXT[] DEFAULT '{}',
    following TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create privacy settings table
CREATE TABLE privacy_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    profile_visibility TEXT DEFAULT 'public' CHECK (profile_visibility IN ('public', 'followers', 'private')),
    message_permissions TEXT DEFAULT 'everyone' CHECK (message_permissions IN ('everyone', 'followers', 'none')),
    tag_notifications BOOLEAN DEFAULT TRUE,
    direct_message_notifications BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create characters table
CREATE TABLE characters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    username TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    title TEXT NOT NULL,
    avatar_url TEXT DEFAULT 'https://images.pexels.com/photos/1382734/pexels-photo-1382734.jpeg?auto=compress&cs=tinysrgb&w=150&h=150',
    header_url TEXT DEFAULT 'https://images.pexels.com/photos/1323550/pexels-photo-1323550.jpeg?auto=compress&cs=tinysrgb&w=800&h=300',
    bio TEXT NOT NULL,
    universe TEXT NOT NULL,
    verse_tag TEXT NOT NULL,
    traits TEXT[] DEFAULT '{}',
    custom_color TEXT DEFAULT '#8b5cf6',
    custom_font TEXT DEFAULT 'Inter',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create posts table
CREATE TABLE posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    character_id UUID REFERENCES characters(id) ON DELETE SET NULL,
    content TEXT NOT NULL,
    visibility TEXT DEFAULT 'public' CHECK (visibility IN ('public', 'followers', 'private')),
    is_thread BOOLEAN DEFAULT FALSE,
    thread_id UUID REFERENCES posts(id) ON DELETE CASCADE,
    parent_post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
    tags TEXT[] DEFAULT '{}',
    media_urls TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create post interactions table (likes, reposts, bookmarks)
CREATE TABLE post_interactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
    interaction_type TEXT NOT NULL CHECK (interaction_type IN ('like', 'repost', 'bookmark')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, post_id, interaction_type)
);

-- Create comments table
CREATE TABLE comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
    character_id UUID REFERENCES characters(id) ON DELETE SET NULL,
    content TEXT NOT NULL,
    parent_comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create follows table
CREATE TABLE follows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    follower_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    following_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(follower_id, following_id),
    CHECK (follower_id != following_id)
);

-- Create blocks table
CREATE TABLE blocks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    blocker_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    blocked_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(blocker_id, blocked_id),
    CHECK (blocker_id != blocked_id)
);

-- Create chats table
CREATE TABLE chats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT,
    is_group BOOLEAN DEFAULT FALSE,
    created_by UUID REFERENCES profiles(id) ON DELETE CASCADE,
    is_encrypted BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create chat participants table
CREATE TABLE chat_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chat_id UUID REFERENCES chats(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(chat_id, user_id)
);

-- Create messages table
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chat_id UUID REFERENCES chats(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_encrypted BOOLEAN DEFAULT TRUE,
    read_by UUID[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create notifications table
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    from_user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('like', 'repost', 'comment', 'follow', 'mention', 'message')),
    post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
    message TEXT,
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_profiles_username ON profiles(username);
CREATE INDEX idx_profiles_writers_tag ON profiles(writers_tag);
CREATE INDEX idx_characters_user_id ON characters(user_id);
CREATE INDEX idx_characters_username ON characters(username);
CREATE INDEX idx_characters_verse_tag ON characters(verse_tag);
CREATE INDEX idx_posts_user_id ON posts(user_id);
CREATE INDEX idx_posts_character_id ON posts(character_id);
CREATE INDEX idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX idx_posts_thread_id ON posts(thread_id);
CREATE INDEX idx_post_interactions_user_id ON post_interactions(user_id);
CREATE INDEX idx_post_interactions_post_id ON post_interactions(post_id);
CREATE INDEX idx_comments_post_id ON comments(post_id);
CREATE INDEX idx_follows_follower_id ON follows(follower_id);
CREATE INDEX idx_follows_following_id ON follows(following_id);
CREATE INDEX idx_chat_participants_chat_id ON chat_participants(chat_id);
CREATE INDEX idx_chat_participants_user_id ON chat_participants(user_id);
CREATE INDEX idx_messages_chat_id ON messages(chat_id);
CREATE INDEX idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);

-- Enable Row Level Security on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE privacy_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE characters ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (allow all for demo purposes)
CREATE POLICY "Allow all operations on profiles" ON profiles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on privacy_settings" ON privacy_settings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on characters" ON characters FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on posts" ON posts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on post_interactions" ON post_interactions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on comments" ON comments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on follows" ON follows FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on blocks" ON blocks FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on chats" ON chats FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on chat_participants" ON chat_participants FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on messages" ON messages FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on notifications" ON notifications FOR ALL USING (true) WITH CHECK (true);

-- Create triggers for updated_at columns
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_privacy_settings_updated_at BEFORE UPDATE ON privacy_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_characters_updated_at BEFORE UPDATE ON characters
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_posts_updated_at BEFORE UPDATE ON posts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_comments_updated_at BEFORE UPDATE ON comments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chats_updated_at BEFORE UPDATE ON chats
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_messages_updated_at BEFORE UPDATE ON messages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert demo users
DO $$
DECLARE
    alice_id uuid := '11111111-1111-1111-1111-111111111111'::uuid;
    bob_id uuid := '22222222-2222-2222-2222-222222222222'::uuid;
    carol_id uuid := '33333333-3333-3333-3333-333333333333'::uuid;
    david_id uuid := '44444444-4444-4444-4444-444444444444'::uuid;
    
    -- Character IDs
    aria_id uuid := gen_random_uuid();
    zara_id uuid := gen_random_uuid();
    marcus_id uuid := gen_random_uuid();
    luna_id uuid := gen_random_uuid();
    kai_id uuid := gen_random_uuid();
    nova_id uuid := gen_random_uuid();
    thor_id uuid := gen_random_uuid();
    maya_id uuid := gen_random_uuid();
    
    -- Post IDs
    post1_id uuid := gen_random_uuid();
    post2_id uuid := gen_random_uuid();
    post3_id uuid := gen_random_uuid();
    post4_id uuid := gen_random_uuid();
    post5_id uuid := gen_random_uuid();
    post6_id uuid := gen_random_uuid();
    post7_id uuid := gen_random_uuid();
    post8_id uuid := gen_random_uuid();
BEGIN
    -- Insert demo profiles
    INSERT INTO profiles (id, username, display_name, bio, writers_tag, email, avatar_url, header_image_url) VALUES
        (
            alice_id,
            'alice_writer',
            'Alice Wordsmith',
            'Fantasy writer with a passion for epic adventures and complex characters. Currently working on a 7-book series about magical realms.',
            'fantasy',
            'alice@demo.com',
            'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=150&h=150',
            'https://images.pexels.com/photos/1323550/pexels-photo-1323550.jpeg?auto=compress&cs=tinysrgb&w=800&h=300'
        ),
        (
            bob_id,
            'bob_scifi',
            'Bob Nebula',
            'Sci-fi enthusiast exploring the boundaries of technology and humanity. Love cyberpunk, space opera, and hard science fiction.',
            'scifi',
            'bob@demo.com',
            'https://images.pexels.com/photos/1043471/pexels-photo-1043471.jpeg?auto=compress&cs=tinysrgb&w=150&h=150',
            'https://images.pexels.com/photos/1323550/pexels-photo-1323550.jpeg?auto=compress&cs=tinysrgb&w=800&h=300'
        ),
        (
            carol_id,
            'carol_modern',
            'Carol Sterling',
            'Contemporary fiction writer focusing on character-driven stories. Interested in exploring modern relationships and social dynamics.',
            'contemporary',
            'carol@demo.com',
            'https://images.pexels.com/photos/1181686/pexels-photo-1181686.jpeg?auto=compress&cs=tinysrgb&w=150&h=150',
            'https://images.pexels.com/photos/1323550/pexels-photo-1323550.jpeg?auto=compress&cs=tinysrgb&w=800&h=300'
        ),
        (
            david_id,
            'david_marvel',
            'David Heroic',
            'Superhero and comic book writer. Creating original heroes and exploring what it means to have power and responsibility.',
            'superhero',
            'david@demo.com',
            'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=150&h=150',
            'https://images.pexels.com/photos/1323550/pexels-photo-1323550.jpeg?auto=compress&cs=tinysrgb&w=800&h=300'
        );

    -- Insert privacy settings for demo users
    INSERT INTO privacy_settings (user_id, profile_visibility, message_permissions, tag_notifications, direct_message_notifications) VALUES
        (alice_id, 'public', 'everyone', true, true),
        (bob_id, 'public', 'everyone', true, true),
        (carol_id, 'public', 'followers', true, false),
        (david_id, 'public', 'everyone', false, true);

    -- Insert demo characters
    INSERT INTO characters (id, user_id, username, name, title, bio, universe, verse_tag, traits, custom_color, custom_font, avatar_url, header_url) VALUES
        (
            aria_id,
            alice_id,
            'aria_shadowblade',
            'Aria Shadowblade',
            'Elven Assassin',
            'A skilled assassin from the shadow realm, trained in the ancient arts of stealth and blade mastery. She walks the line between light and darkness, seeking redemption for her past.',
            'Elderwood Chronicles',
            'fantasy',
            ARRAY['Stealthy', 'Mysterious', 'Loyal', 'Conflicted'],
            '#6366f1',
            'Crimson Text',
            'https://images.pexels.com/photos/1382734/pexels-photo-1382734.jpeg?auto=compress&cs=tinysrgb&w=150&h=150',
            'https://images.pexels.com/photos/1323550/pexels-photo-1323550.jpeg?auto=compress&cs=tinysrgb&w=800&h=300'
        ),
        (
            luna_id,
            alice_id,
            'luna_starweaver',
            'Luna Starweaver',
            'Celestial Mage',
            'A powerful mage who draws her magic from the stars themselves. Guardian of the cosmic balance and protector of the realm.',
            'Elderwood Chronicles',
            'fantasy',
            ARRAY['Wise', 'Powerful', 'Compassionate', 'Ancient'],
            '#8b5cf6',
            'Playfair Display',
            'https://images.pexels.com/photos/1382734/pexels-photo-1382734.jpeg?auto=compress&cs=tinysrgb&w=150&h=150',
            'https://images.pexels.com/photos/1323550/pexels-photo-1323550.jpeg?auto=compress&cs=tinysrgb&w=800&h=300'
        ),
        (
            zara_id,
            bob_id,
            'zara_nova',
            'Zara Nova',
            'Cybernetic Detective',
            'A cybernetically enhanced detective in Neo-Tokyo 2087. Half-human, half-machine, she investigates crimes that blur the line between the digital and physical worlds.',
            'Neo-Tokyo 2087',
            'cyberpunk',
            ARRAY['Analytical', 'Determined', 'Tech-savvy', 'Cynical'],
            '#ec4899',
            'Courier New',
            'https://images.pexels.com/photos/1382734/pexels-photo-1382734.jpeg?auto=compress&cs=tinysrgb&w=150&h=150',
            'https://images.pexels.com/photos/1323550/pexels-photo-1323550.jpeg?auto=compress&cs=tinysrgb&w=800&h=300'
        ),
        (
            kai_id,
            bob_id,
            'kai_voidwalker',
            'Kai Voidwalker',
            'Space Explorer',
            'A fearless explorer of the void between stars. Captain of the starship Nebula, seeking new worlds and ancient mysteries.',
            'Galactic Frontier',
            'spaceopera',
            ARRAY['Brave', 'Curious', 'Independent', 'Charismatic'],
            '#10b981',
            'Roboto',
            'https://images.pexels.com/photos/1382734/pexels-photo-1382734.jpeg?auto=compress&cs=tinysrgb&w=150&h=150',
            'https://images.pexels.com/photos/1323550/pexels-photo-1323550.jpeg?auto=compress&cs=tinysrgb&w=800&h=300'
        ),
        (
            marcus_id,
            carol_id,
            'marcus_steel',
            'Marcus Steel',
            'Wasteland Survivor',
            'A hardened survivor of the nuclear apocalypse, Marcus leads a small community of survivors in the irradiated wasteland. His past as a military engineer helps him build hope from the ashes.',
            'Atomic Wasteland',
            'postapocalyptic',
            ARRAY['Resourceful', 'Brave', 'Protective', 'Pragmatic'],
            '#f59e0b',
            'Roboto',
            'https://images.pexels.com/photos/1382734/pexels-photo-1382734.jpeg?auto=compress&cs=tinysrgb&w=150&h=150',
            'https://images.pexels.com/photos/1323550/pexels-photo-1323550.jpeg?auto=compress&cs=tinysrgb&w=800&h=300'
        ),
        (
            nova_id,
            carol_id,
            'nova_chen',
            'Nova Chen',
            'Urban Artist',
            'A street artist in modern-day San Francisco, using her art to tell stories of the city and its people. Balancing creativity with activism.',
            'City Stories',
            'contemporary',
            ARRAY['Creative', 'Passionate', 'Rebellious', 'Empathetic'],
            '#ef4444',
            'Inter',
            'https://images.pexels.com/photos/1382734/pexels-photo-1382734.jpeg?auto=compress&cs=tinysrgb&w=150&h=150',
            'https://images.pexels.com/photos/1323550/pexels-photo-1323550.jpeg?auto=compress&cs=tinysrgb&w=800&h=300'
        ),
        (
            thor_id,
            david_id,
            'thor_lightning',
            'Thor Lightning',
            'Thunder Guardian',
            'A modern-day superhero with the power to control lightning and storms. Protector of Metro City and defender of the innocent.',
            'Metro City Heroes',
            'superhero',
            ARRAY['Heroic', 'Noble', 'Powerful', 'Just'],
            '#3b82f6',
            'Montserrat',
            'https://images.pexels.com/photos/1382734/pexels-photo-1382734.jpeg?auto=compress&cs=tinysrgb&w=150&h=150',
            'https://images.pexels.com/photos/1323550/pexels-photo-1323550.jpeg?auto=compress&cs=tinysrgb&w=800&h=300'
        ),
        (
            maya_id,
            david_id,
            'maya_shadow',
            'Maya Shadow',
            'Night Vigilante',
            'A mysterious vigilante who operates in the shadows of Metro City. Uses stealth and martial arts to fight crime where the law cannot reach.',
            'Metro City Heroes',
            'superhero',
            ARRAY['Stealthy', 'Skilled', 'Mysterious', 'Determined'],
            '#6b7280',
            'Georgia',
            'https://images.pexels.com/photos/1382734/pexels-photo-1382734.jpeg?auto=compress&cs=tinysrgb&w=150&h=150',
            'https://images.pexels.com/photos/1323550/pexels-photo-1323550.jpeg?auto=compress&cs=tinysrgb&w=800&h=300'
        );

    -- Insert demo posts
    INSERT INTO posts (id, user_id, character_id, content, visibility, tags) VALUES
        (
            post1_id,
            alice_id,
            aria_id,
            'The moonlight filters through the ancient trees as I make my way through the Whispering Woods. Every shadow could hide an enemy, every sound could be a trap. But tonight, I hunt for answers, not blood. The truth about my past lies somewhere in these cursed woods. #fantasy #elderwood #shadowblade #mystery',
            'public',
            ARRAY['fantasy', 'elderwood', 'shadowblade', 'mystery']
        ),
        (
            post2_id,
            bob_id,
            zara_id,
            'Another glitch in the matrix today. The crime scene data doesn''t add up - someone''s been tampering with the digital evidence. In this city, you can''t trust what you see, only what you can prove. Time to dive deeper into the net. #cyberpunk #detective #neotokyo #investigation',
            'public',
            ARRAY['cyberpunk', 'detective', 'neotokyo', 'investigation']
        ),
        (
            post3_id,
            carol_id,
            marcus_id,
            'Found an old pre-war bunker today. Solar panels still functional after all these years. Sometimes the old world''s ingenuity amazes me. We''ll have power for the settlement through winter. Hope is a powerful thing in the wasteland. #postapocalyptic #survival #hope #community',
            'public',
            ARRAY['postapocalyptic', 'survival', 'hope', 'community']
        ),
        (
            post4_id,
            alice_id,
            NULL,
            'Working on a new character concept - a time-traveling librarian who accidentally keeps changing historical events while trying to return overdue books. Sometimes the best ideas come from the most mundane situations! What''s the weirdest character concept you''ve ever created? #writing #characterdevelopment #timetravel #humor',
            'public',
            ARRAY['writing', 'characterdevelopment', 'timetravel', 'humor']
        ),
        (
            post5_id,
            david_id,
            thor_id,
            'The storm clouds gather over Metro City, but I''m ready. With great power comes great responsibility - and today, that responsibility weighs heavy on my shoulders. The city needs its guardian. #superhero #metrocity #thunder #responsibility',
            'public',
            ARRAY['superhero', 'metrocity', 'thunder', 'responsibility']
        ),
        (
            post6_id,
            bob_id,
            kai_id,
            'Day 847 in the void. Discovered a new star system today - three planets, one showing signs of ancient civilization. The universe never stops surprising me. Setting course for the third planet. Adventure awaits! #spaceopera #exploration #discovery #adventure',
            'public',
            ARRAY['spaceopera', 'exploration', 'discovery', 'adventure']
        ),
        (
            post7_id,
            carol_id,
            nova_id,
            'Finished a new mural today on the side of the old warehouse. It tells the story of the neighborhood - past, present, and future. Art has the power to heal, to inspire, to change. One wall at a time. #contemporary #streetart #community #inspiration',
            'public',
            ARRAY['contemporary', 'streetart', 'community', 'inspiration']
        ),
        (
            post8_id,
            alice_id,
            luna_id,
            'The stars whisper secrets tonight. Ancient magic stirs in the cosmic winds. Something is coming - I can feel it in the very fabric of reality. The balance must be maintained, whatever the cost. #fantasy #celestial #magic #prophecy',
            'public',
            ARRAY['fantasy', 'celestial', 'magic', 'prophecy']
        );

    -- Insert some follows
    INSERT INTO follows (follower_id, following_id) VALUES
        (alice_id, bob_id),
        (alice_id, carol_id),
        (bob_id, alice_id),
        (bob_id, david_id),
        (carol_id, alice_id),
        (carol_id, david_id),
        (david_id, bob_id),
        (david_id, carol_id);

    -- Insert post interactions
    INSERT INTO post_interactions (user_id, post_id, interaction_type) VALUES
        (bob_id, post1_id, 'like'),
        (carol_id, post1_id, 'like'),
        (david_id, post1_id, 'like'),
        (alice_id, post2_id, 'like'),
        (carol_id, post2_id, 'like'),
        (alice_id, post3_id, 'like'),
        (bob_id, post3_id, 'like'),
        (david_id, post4_id, 'like'),
        (bob_id, post4_id, 'bookmark'),
        (carol_id, post5_id, 'like'),
        (alice_id, post6_id, 'like'),
        (david_id, post7_id, 'like'),
        (bob_id, post8_id, 'like');

    -- Insert comments
    INSERT INTO comments (user_id, post_id, content) VALUES
        (
            bob_id,
            post1_id,
            'The atmosphere you''ve created here is incredible! I can almost feel the tension in the air. Aria''s internal conflict really comes through.'
        ),
        (
            carol_id,
            post4_id,
            'This sounds hilarious! I''d love to read about their adventures. Have you thought about what historical event they mess up first?'
        ),
        (
            alice_id,
            post2_id,
            'Love the cyberpunk noir feel! Zara''s struggle with her dual nature is fascinating. The tech vs humanity theme is so relevant.'
        ),
        (
            david_id,
            post3_id,
            'Marcus is such a compelling character. The way he finds hope in the darkest circumstances is inspiring. Great world-building!'
        ),
        (
            carol_id,
            post5_id,
            'Thor''s sense of duty really shines through. The weight of responsibility is palpable. Classic superhero storytelling!'
        );

    -- Insert notifications
    INSERT INTO notifications (user_id, from_user_id, type, post_id, message) VALUES
        (
            alice_id,
            bob_id,
            'like',
            post1_id,
            'Bob Nebula liked your post'
        ),
        (
            alice_id,
            bob_id,
            'comment',
            post1_id,
            'Bob Nebula commented on your post'
        ),
        (
            alice_id,
            carol_id,
            'like',
            post4_id,
            'Carol Sterling liked your post'
        ),
        (
            bob_id,
            alice_id,
            'follow',
            NULL,
            'Alice Wordsmith started following you'
        ),
        (
            carol_id,
            david_id,
            'like',
            post7_id,
            'David Heroic liked your post'
        );

END $$;

-- Create storage buckets for images
INSERT INTO storage.buckets (id, name, public) 
VALUES 
    ('avatars', 'avatars', true),
    ('headers', 'headers', true),
    ('media', 'media', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies (allow all for demo)
DO $$
BEGIN
    -- Avatar policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Avatar images are publicly accessible') THEN
        CREATE POLICY "Avatar images are publicly accessible" ON storage.objects
            FOR SELECT USING (bucket_id = 'avatars');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Anyone can upload avatar images') THEN
        CREATE POLICY "Anyone can upload avatar images" ON storage.objects
            FOR INSERT WITH CHECK (bucket_id = 'avatars');
    END IF;

    -- Header policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Header images are publicly accessible') THEN
        CREATE POLICY "Header images are publicly accessible" ON storage.objects
            FOR SELECT USING (bucket_id = 'headers');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Anyone can upload header images') THEN
        CREATE POLICY "Anyone can upload header images" ON storage.objects
            FOR INSERT WITH CHECK (bucket_id = 'headers');
    END IF;

    -- Media policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Media files are publicly accessible') THEN
        CREATE POLICY "Media files are publicly accessible" ON storage.objects
            FOR SELECT USING (bucket_id = 'media');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Anyone can upload media files') THEN
        CREATE POLICY "Anyone can upload media files" ON storage.objects
            FOR INSERT WITH CHECK (bucket_id = 'media');
    END IF;
END $$;