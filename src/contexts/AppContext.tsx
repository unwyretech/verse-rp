import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { User, Character, Post, Chat, Message, Notification } from '../types';

interface AppContextType {
  // Data
  posts: Post[];
  characters: Character[];
  allUsers: User[];
  chats: Chat[];
  notifications: Notification[];
  unreadNotifications: number;
  unreadMessages: number;
  bookmarkedPosts: string[];
  bookmarkedCharacters: string[];
  bookmarkedUsers: string[];
  
  // Timeline state
  selectedCharacter: Character | null;
  setSelectedCharacter: (character: Character | null) => void;
  
  // Actions
  addPost: (postData: Partial<Post>) => Promise<void>;
  updatePost: (postId: string, updates: Partial<Post>) => void;
  deletePost: (postId: string) => void;
  likePost: (postId: string) => void;
  repostPost: (postId: string) => void;
  pinPost: (postId: string) => void;
  unpinPost: (postId: string) => void;
  bookmarkPost: (postId: string) => void;
  unbookmarkPost: (postId: string) => void;
  
  addCharacter: (character: Character) => void;
  updateCharacter: (characterId: string, updates: Partial<Character>) => void;
  deleteCharacter: (characterId: string) => void;
  followCharacter: (characterId: string) => void;
  unfollowCharacter: (characterId: string) => void;
  bookmarkCharacter: (characterId: string) => void;
  unbookmarkCharacter: (characterId: string) => void;
  
  followUser: (userId: string) => void;
  unfollowUser: (userId: string) => void;
  bookmarkUser: (userId: string) => void;
  unbookmarkUser: (userId: string) => void;
  
  sendMessage: (chatId: string, content: string, senderId: string, mediaUrl?: string) => Promise<void>;
  createChat: (participantIds: string[], isGroup: boolean, name?: string) => Promise<Chat>;
  getChatMessages: (chatId: string) => Promise<Message[]>;
  markMessagesAsRead: (chatId: string) => Promise<void>;
  deleteChatForUser: (chatId: string, userId: string) => Promise<void>;
  clearAllMessageNotifications: () => void;
  searchUsers: (query: string) => Promise<User[]>;
  
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => void;
  markNotificationAsRead: (notificationId: string) => void;
  clearAllNotifications: () => void;
  
  addComment: (postId: string, content: string, characterId?: string) => Promise<void>;
  
  // Search and recommendations
  searchContent: (query: string) => { posts: Post[]; characters: Character[]; users: User[] };
  getRecommendations: () => { writers: User[]; characters: Character[] };
  getFilteredPosts: (viewingAs: Character | 'user') => Post[];
  
  // Admin functions
  getAllUsersAdmin: () => Promise<User[]>;
  deleteUserAdmin: (userId: string) => Promise<void>;
  resetPasswordAdmin: (userId: string, newPassword: string) => Promise<void>;
  updateUserRoleAdmin: (userId: string, role: 'user' | 'admin') => Promise<void>;
  
  // Relationship functions
  getUserFollowers: (userId: string) => Promise<User[]>;
  getUserFollowing: (userId: string) => Promise<User[]>;
  getCharacterFollowers: (characterId: string) => Promise<User[]>;
  getCharacterFollowing: (characterId: string) => Promise<(User | Character)[]>;
  getPostComments: (postId: string) => Promise<any[]>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [chats, setChats] = useState<Chat[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [bookmarkedPosts, setBookmarkedPosts] = useState<string[]>([]);
  const [bookmarkedCharacters, setBookmarkedCharacters] = useState<string[]>([]);
  const [bookmarkedUsers, setBookmarkedUsers] = useState<string[]>([]);
  const [selectedCharacter, setSelectedCharacterState] = useState<Character | null>(null);
  const [loading, setLoading] = useState(false);

  // Persistent character selection
  const setSelectedCharacter = (character: Character | null) => {
    setSelectedCharacterState(character);
    // Store in localStorage for persistence
    if (character) {
      localStorage.setItem('verse_selected_character', JSON.stringify(character));
    } else {
      localStorage.removeItem('verse_selected_character');
    }
  };

  // Load selected character from localStorage on mount
  useEffect(() => {
    const savedCharacter = localStorage.getItem('verse_selected_character');
    if (savedCharacter) {
      try {
        const character = JSON.parse(savedCharacter);
        setSelectedCharacterState(character);
      } catch (error) {
        console.error('Error loading saved character:', error);
        localStorage.removeItem('verse_selected_character');
      }
    }
  }, []);

  // Update selected character when characters list changes
  useEffect(() => {
    if (selectedCharacter) {
      const updatedCharacter = characters.find(c => c.id === selectedCharacter.id);
      if (updatedCharacter) {
        setSelectedCharacterState(updatedCharacter);
        localStorage.setItem('verse_selected_character', JSON.stringify(updatedCharacter));
      } else {
        // Character was deleted
        setSelectedCharacterState(null);
        localStorage.removeItem('verse_selected_character');
      }
    }
  }, [characters, selectedCharacter]);

  // Load data from database when user is authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      loadAllData();
      
      // Set up real-time subscriptions
      const interval = setInterval(() => {
        loadAllData();
      }, 1000); // Refresh every second

      return () => clearInterval(interval);
    }
  }, [isAuthenticated, user]);

  const loadAllData = async () => {
    if (!user || loading) return;
    
    setLoading(true);
    try {
      await Promise.all([
        loadUsers(),
        loadCharacters(),
        loadPosts(),
        loadChats(),
        loadNotifications()
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const users: User[] = profiles.map(profile => ({
        id: profile.id,
        username: profile.username,
        displayName: profile.display_name,
        avatar: profile.avatar_url || 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=350&h=350',
        headerImage: profile.header_image_url || 'https://images.pexels.com/photos/1323550/pexels-photo-1323550.jpeg?auto=compress&cs=tinysrgb&w=800&h=300',
        bio: profile.bio || '',
        writersTag: profile.writers_tag,
        email: profile.email,
        twoFactorEnabled: profile.two_factor_enabled || false,
        characters: [],
        followers: [], // Will be populated by follows table
        following: [], // Will be populated by follows table
        createdAt: new Date(profile.created_at),
        role: profile.role || 'user',
        privacySettings: {
          profileVisibility: 'public',
          messagePermissions: 'everyone',
          tagNotifications: true,
          directMessageNotifications: true
        }
      }));

      setAllUsers(users);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const loadCharacters = async () => {
    try {
      const { data: charactersData, error } = await supabase
        .from('characters')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const characters: Character[] = charactersData.map(char => ({
        id: char.id,
        username: char.username,
        name: char.name,
        title: char.title,
        avatar: char.avatar_url || 'https://images.pexels.com/photos/1382734/pexels-photo-1382734.jpeg?auto=compress&cs=tinysrgb&w=350&h=350',
        headerImage: char.header_url || 'https://images.pexels.com/photos/1323550/pexels-photo-1323550.jpeg?auto=compress&cs=tinysrgb&w=800&h=300',
        bio: char.bio,
        universe: char.universe,
        verseTag: char.verse_tag,
        traits: char.traits || [],
        userId: char.user_id,
        customColor: char.custom_color || '#8b5cf6',
        customFont: char.custom_font || 'Inter',
        followers: char.followers || [],
        following: char.following || [],
        createdAt: new Date(char.created_at)
      }));

      setCharacters(characters);
    } catch (error) {
      console.error('Error loading characters:', error);
    }
  };

  const loadPosts = async () => {
    try {
      const { data: postsData, error } = await supabase
        .from('posts')
        .select(`
          *,
          profiles:user_id(id, username, display_name, avatar_url),
          characters:character_id(id, username, name, title, avatar_url, universe, verse_tag),
          comments(count)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const posts: Post[] = postsData.map(post => ({
        id: post.id,
        content: post.content,
        characterId: post.character_id,
        character: post.characters ? {
          id: post.characters.id,
          username: post.characters.username,
          name: post.characters.name,
          title: post.characters.title,
          avatar: post.characters.avatar_url || 'https://images.pexels.com/photos/1382734/pexels-photo-1382734.jpeg?auto=compress&cs=tinysrgb&w=350&h=350',
          headerImage: 'https://images.pexels.com/photos/1323550/pexels-photo-1323550.jpeg?auto=compress&cs=tinysrgb&w=800&h=300',
          bio: '',
          universe: post.characters.universe,
          verseTag: post.characters.verse_tag,
          traits: [],
          userId: post.user_id,
          customColor: '#8b5cf6',
          customFont: 'Inter',
          followers: [],
          following: [],
          createdAt: new Date()
        } : undefined,
        userId: post.user_id,
        user: post.profiles ? {
          id: post.profiles.id,
          username: post.profiles.username,
          displayName: post.profiles.display_name,
          avatar: post.profiles.avatar_url || 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=350&h=350',
          headerImage: 'https://images.pexels.com/photos/1323550/pexels-photo-1323550.jpeg?auto=compress&cs=tinysrgb&w=800&h=300',
          bio: '',
          writersTag: '',
          twoFactorEnabled: false,
          characters: [],
          followers: [],
          following: [],
          createdAt: new Date(),
          privacySettings: {
            profileVisibility: 'public',
            messagePermissions: 'everyone',
            tagNotifications: true,
            directMessageNotifications: true
          }
        } : undefined,
        timestamp: new Date(post.created_at),
        likes: 0, // TODO: Calculate from post_interactions
        reposts: 0, // TODO: Calculate from post_interactions
        comments: Array.isArray(post.comments) ? post.comments.length : 0,
        isLiked: false, // TODO: Check user interactions
        isReposted: false, // TODO: Check user interactions
        isPinned: false, // TODO: Add to database schema
        isThread: post.is_thread || false,
        threadId: post.thread_id,
        parentPostId: post.parent_post_id,
        visibility: post.visibility || 'public',
        tags: post.tags || [],
        mediaUrls: post.media_urls || []
      }));

      setPosts(posts);
    } catch (error) {
      console.error('Error loading posts:', error);
    }
  };

  const loadChats = async () => {
    try {
      if (!user) return;

      const { data: chatsData, error } = await supabase
        .from('chats')
        .select(`
          *,
          chat_participants!inner(
            user_id,
            profiles:user_id(id, username, display_name, avatar_url)
          ),
          messages(
            id,
            content,
            sender_id,
            created_at,
            read_by,
            is_encrypted,
            profiles:sender_id(id, username, display_name, avatar_url)
          )
        `)
        .eq('chat_participants.user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      const chats: Chat[] = chatsData.map(chat => {
        const lastMessage = chat.messages && chat.messages.length > 0 
          ? chat.messages[chat.messages.length - 1] 
          : null;

        // Get participants with user info
        const participants = chat.chat_participants?.map((p: any) => ({
          id: p.user_id,
          username: p.profiles?.username || 'Unknown',
          displayName: p.profiles?.display_name || 'Unknown User',
          avatar: p.profiles?.avatar_url || 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=350&h=350'
        })) || [];

        return {
          id: chat.id,
          participants: participants.map(p => p.id),
          participantInfo: participants,
          isGroup: chat.is_group || false,
          name: chat.name,
          createdAt: new Date(chat.created_at),
          isEncrypted: chat.is_encrypted || true,
          lastMessage: lastMessage ? {
            id: lastMessage.id,
            content: lastMessage.is_encrypted ? '🔒 Encrypted message' : lastMessage.content,
            senderId: lastMessage.sender_id,
            senderInfo: lastMessage.profiles ? {
              username: lastMessage.profiles.username,
              displayName: lastMessage.profiles.display_name,
              avatar: lastMessage.profiles.avatar_url || 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=350&h=350'
            } : undefined,
            chatId: chat.id,
            timestamp: new Date(lastMessage.created_at),
            isEncrypted: lastMessage.is_encrypted || true,
            readBy: lastMessage.read_by || []
          } : undefined
        };
      });

      setChats(chats);
    } catch (error) {
      console.error('Error loading chats:', error);
    }
  };

  const loadNotifications = async () => {
    try {
      const { data: notificationsData, error } = await supabase
        .from('notifications')
        .select(`
          *,
          profiles:from_user_id(id, username, display_name, avatar_url)
        `)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const notifications: Notification[] = notificationsData.map(notif => ({
        id: notif.id,
        type: notif.type,
        userId: notif.user_id,
        fromUserId: notif.from_user_id,
        fromUser: notif.profiles ? {
          id: notif.profiles.id,
          username: notif.profiles.username,
          displayName: notif.profiles.display_name,
          avatar: notif.profiles.avatar_url || 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=350&h=350',
          headerImage: 'https://images.pexels.com/photos/1323550/pexels-photo-1323550.jpeg?auto=compress&cs=tinysrgb&w=800&h=300',
          bio: '',
          writersTag: '',
          twoFactorEnabled: false,
          characters: [],
          followers: [],
          following: [],
          createdAt: new Date(),
          privacySettings: {
            profileVisibility: 'public',
            messagePermissions: 'everyone',
            tagNotifications: true,
            directMessageNotifications: true
          }
        } : undefined,
        postId: notif.post_id,
        message: notif.message,
        timestamp: new Date(notif.created_at),
        read: notif.read || false
      }));

      setNotifications(notifications);
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  const unreadNotifications = notifications.filter(n => !n.read).length;
  const unreadMessages = chats.reduce((count, chat) => {
    if (chat.lastMessage && !chat.lastMessage.readBy.includes(user?.id || '')) {
      return count + 1;
    }
    return count;
  }, 0);

  // Post actions
  const addPost = async (postData: Partial<Post>) => {
    if (!user) return;

    try {
      console.log('Creating post with data:', postData);
      
      const { data, error } = await supabase
        .from('posts')
        .insert({
          content: postData.content,
          user_id: user.id,
          character_id: postData.characterId || null,
          is_thread: postData.isThread || false,
          thread_id: postData.threadId || null,
          parent_post_id: postData.parentPostId || null,
          visibility: postData.visibility || 'public',
          tags: postData.tags || [],
          media_urls: postData.mediaUrls || []
        })
        .select()
        .single();

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      console.log('Post created successfully:', data);

      // Reload posts to get the new post with relations
      await loadPosts();
    } catch (error) {
      console.error('Error adding post:', error);
      throw error;
    }
  };

  const updatePost = async (postId: string, updates: Partial<Post>) => {
    try {
      const { error } = await supabase
        .from('posts')
        .update({
          content: updates.content,
          visibility: updates.visibility,
          tags: updates.tags,
          media_urls: updates.mediaUrls,
          updated_at: new Date().toISOString()
        })
        .eq('id', postId);

      if (error) throw error;

      // Update local state
      setPosts(prev => prev.map(post => 
        post.id === postId ? { ...post, ...updates } : post
      ));
    } catch (error) {
      console.error('Error updating post:', error);
    }
  };

  const deletePost = async (postId: string) => {
    try {
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', postId);

      if (error) throw error;

      setPosts(prev => prev.filter(post => post.id !== postId));
    } catch (error) {
      console.error('Error deleting post:', error);
    }
  };

  const likePost = (postId: string) => {
    setPosts(prev => prev.map(post => {
      if (post.id === postId) {
        return {
          ...post,
          isLiked: !post.isLiked,
          likes: post.isLiked ? post.likes - 1 : post.likes + 1
        };
      }
      return post;
    }));
  };

  const repostPost = (postId: string) => {
    setPosts(prev => prev.map(post => {
      if (post.id === postId) {
        return {
          ...post,
          isReposted: !post.isReposted,
          reposts: post.isReposted ? post.reposts - 1 : post.reposts + 1
        };
      }
      return post;
    }));
  };

  const pinPost = (postId: string) => {
    setPosts(prev => prev.map(post => 
      post.id === postId ? { ...post, isPinned: true } : post
    ));
  };

  const unpinPost = (postId: string) => {
    setPosts(prev => prev.map(post => 
      post.id === postId ? { ...post, isPinned: false } : post
    ));
  };

  const bookmarkPost = (postId: string) => {
    setBookmarkedPosts(prev => [...prev, postId]);
  };

  const unbookmarkPost = (postId: string) => {
    setBookmarkedPosts(prev => prev.filter(id => id !== postId));
  };

  // Character actions
  const addCharacter = async (character: Character) => {
    try {
      const { data, error } = await supabase
        .from('characters')
        .insert({
          username: character.username,
          name: character.name,
          title: character.title,
          avatar_url: character.avatar,
          header_url: character.headerImage,
          bio: character.bio,
          universe: character.universe,
          verse_tag: character.verseTag,
          traits: character.traits,
          user_id: character.userId,
          custom_color: character.customColor,
          custom_font: character.customFont,
          followers: character.followers,
          following: character.following
        })
        .select()
        .single();

      if (error) throw error;

      // Reload characters to get the new character
      await loadCharacters();
    } catch (error) {
      console.error('Error adding character:', error);
    }
  };

  const updateCharacter = async (characterId: string, updates: Partial<Character>) => {
    try {
      const { error } = await supabase
        .from('characters')
        .update({
          username: updates.username,
          name: updates.name,
          title: updates.title,
          avatar_url: updates.avatar,
          header_url: updates.headerImage,
          bio: updates.bio,
          universe: updates.universe,
          verse_tag: updates.verseTag,
          traits: updates.traits,
          custom_color: updates.customColor,
          custom_font: updates.customFont,
          updated_at: new Date().toISOString()
        })
        .eq('id', characterId);

      if (error) throw error;

      setCharacters(prev => prev.map(char => 
        char.id === characterId ? { ...char, ...updates } : char
      ));
    } catch (error) {
      console.error('Error updating character:', error);
    }
  };

  const deleteCharacter = async (characterId: string) => {
    try {
      const { error } = await supabase
        .from('characters')
        .delete()
        .eq('id', characterId);

      if (error) throw error;

      setCharacters(prev => prev.filter(char => char.id !== characterId));
      // Clear selected character if it was deleted
      if (selectedCharacter?.id === characterId) {
        setSelectedCharacter(null);
      }
    } catch (error) {
      console.error('Error deleting character:', error);
    }
  };

  const followCharacter = (characterId: string) => {
    // Implementation for following characters
    console.log('Following character:', characterId);
  };

  const unfollowCharacter = (characterId: string) => {
    // Implementation for unfollowing characters
    console.log('Unfollowing character:', characterId);
  };

  const bookmarkCharacter = (characterId: string) => {
    setBookmarkedCharacters(prev => [...prev, characterId]);
  };

  const unbookmarkCharacter = (characterId: string) => {
    setBookmarkedCharacters(prev => prev.filter(id => id !== characterId));
  };

  // User actions - simplified follow system
  const followUser = async (userId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('follows')
        .insert({
          follower_id: user.id,
          following_id: userId
        });

      if (error) throw error;

      // Update local state
      setAllUsers(prev => prev.map(u => {
        if (u.id === userId) {
          return { ...u, followers: [...u.followers, user.id] };
        }
        if (u.id === user.id) {
          return { ...u, following: [...u.following, userId] };
        }
        return u;
      }));
    } catch (error) {
      console.error('Error following user:', error);
    }
  };

  const unfollowUser = async (userId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('follows')
        .delete()
        .eq('follower_id', user.id)
        .eq('following_id', userId);

      if (error) throw error;

      // Update local state
      setAllUsers(prev => prev.map(u => {
        if (u.id === userId) {
          return { ...u, followers: u.followers.filter(id => id !== user.id) };
        }
        if (u.id === user.id) {
          return { ...u, following: u.following.filter(id => id !== userId) };
        }
        return u;
      }));
    } catch (error) {
      console.error('Error unfollowing user:', error);
    }
  };

  const bookmarkUser = (userId: string) => {
    setBookmarkedUsers(prev => [...prev, userId]);
  };

  const unbookmarkUser = (userId: string) => {
    setBookmarkedUsers(prev => prev.filter(id => id !== userId));
  };

  // Chat actions
  const sendMessage = async (chatId: string, content: string, senderId: string, mediaUrl?: string): Promise<void> => {
    try {
      const { error } = await supabase
        .from('messages')
        .insert({
          chat_id: chatId,
          sender_id: senderId,
          content,
          media_url: mediaUrl,
          is_encrypted: true,
          read_by: [senderId]
        });

      if (error) throw error;

      // Update chat's updated_at timestamp
      await supabase
        .from('chats')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', chatId);

      // Reload chats to update last message
      await loadChats();
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const createChat = async (participantIds: string[], isGroup: boolean, name?: string): Promise<Chat> => {
    try {
      if (!user) throw new Error('User not authenticated');

      const { data: chatData, error: chatError } = await supabase
        .from('chats')
        .insert({
          name,
          is_group: isGroup,
          created_by: user.id,
          is_encrypted: true
        })
        .select()
        .single();

      if (chatError) throw chatError;

      // Add participants including current user
      const allParticipants = [...participantIds, user.id].filter(Boolean);
      const participantInserts = allParticipants.map(userId => ({
        chat_id: chatData.id,
        user_id: userId
      }));

      const { error: participantError } = await supabase
        .from('chat_participants')
        .insert(participantInserts);

      if (participantError) throw participantError;

      // Get participant info
      const { data: participantData, error: participantInfoError } = await supabase
        .from('profiles')
        .select('id, username, display_name, avatar_url')
        .in('id', allParticipants);

      if (participantInfoError) throw participantInfoError;

      const participantInfo = participantData.map(p => ({
        id: p.id,
        username: p.username,
        displayName: p.display_name,
        avatar: p.avatar_url || 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=350&h=350'
      }));

      const newChat: Chat = {
        id: chatData.id,
        participants: allParticipants,
        participantInfo,
        isGroup,
        name,
        createdAt: new Date(chatData.created_at),
        isEncrypted: true
      };

      setChats(prev => [newChat, ...prev]);
      return newChat;
    } catch (error) {
      console.error('Error creating chat:', error);
      throw error;
    }
  };

  const getChatMessages = async (chatId: string): Promise<Message[]> => {
    try {
      const { data: messagesData, error } = await supabase
        .from('messages')
        .select(`
          *,
          profiles:sender_id(id, username, display_name, avatar_url)
        `)
        .eq('chat_id', chatId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      return messagesData.map(msg => ({
        id: msg.id,
        content: msg.content,
        senderId: msg.sender_id,
        senderInfo: msg.profiles ? {
          username: msg.profiles.username,
          displayName: msg.profiles.display_name,
          avatar: msg.profiles.avatar_url || 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=350&h=350'
        } : undefined,
        chatId: msg.chat_id,
        timestamp: new Date(msg.created_at),
        isEncrypted: msg.is_encrypted || true,
        readBy: msg.read_by || [],
        mediaUrl: msg.media_url
      }));
    } catch (error) {
      console.error('Error loading messages:', error);
      return [];
    }
  };

  const markMessagesAsRead = async (chatId: string): Promise<void> => {
    if (!user) return;

    try {
      await supabase.rpc('mark_messages_as_read', {
        chat_id_param: chatId,
        user_id_param: user.id
      });

      // Update local chat state
      setChats(prev => prev.map(chat => {
        if (chat.id === chatId && chat.lastMessage) {
          return {
            ...chat,
            lastMessage: {
              ...chat.lastMessage,
              readBy: [...chat.lastMessage.readBy, user.id]
            }
          };
        }
        return chat;
      }));
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  const deleteChatForUser = async (chatId: string, userId: string): Promise<void> => {
    try {
      const { error } = await supabase
        .from('chat_participants')
        .delete()
        .eq('chat_id', chatId)
        .eq('user_id', userId);

      if (error) throw error;

      setChats(prev => prev.filter(chat => chat.id !== chatId));
    } catch (error) {
      console.error('Error deleting chat:', error);
    }
  };

  const clearAllMessageNotifications = () => {
    // Mark all messages as read locally
    setChats(prev => prev.map(chat => {
      if (chat.lastMessage && !chat.lastMessage.readBy.includes(user?.id || '')) {
        return {
          ...chat,
          lastMessage: {
            ...chat.lastMessage,
            readBy: [...chat.lastMessage.readBy, user?.id || '']
          }
        };
      }
      return chat;
    }));
  };

  // Search users for messaging
  const searchUsers = async (query: string): Promise<User[]> => {
    try {
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*')
        .or(`username.ilike.%${query}%,display_name.ilike.%${query}%`)
        .limit(10);

      if (error) throw error;

      return profiles.map(profile => ({
        id: profile.id,
        username: profile.username,
        displayName: profile.display_name,
        avatar: profile.avatar_url || 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=350&h=350',
        headerImage: profile.header_image_url || 'https://images.pexels.com/photos/1323550/pexels-photo-1323550.jpeg?auto=compress&cs=tinysrgb&w=800&h=300',
        bio: profile.bio || '',
        writersTag: profile.writers_tag,
        email: profile.email,
        twoFactorEnabled: profile.two_factor_enabled || false,
        characters: [],
        followers: [],
        following: [],
        createdAt: new Date(profile.created_at),
        role: profile.role || 'user',
        privacySettings: {
          profileVisibility: 'public',
          messagePermissions: 'everyone',
          tagNotifications: true,
          directMessageNotifications: true
        }
      }));
    } catch (error) {
      console.error('Error searching users:', error);
      return [];
    }
  };

  // Notification actions
  const addNotification = (notificationData: Omit<Notification, 'id' | 'timestamp'>) => {
    const newNotification: Notification = {
      ...notificationData,
      id: Date.now().toString(),
      timestamp: new Date(),
      read: false
    };

    setNotifications(prev => [newNotification, ...prev]);
  };

  const markNotificationAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId);

      if (error) throw error;

      setNotifications(prev => prev.map(notification => 
        notification.id === notificationId ? { ...notification, read: true } : notification
      ));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const clearAllNotifications = async () => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user?.id);

      if (error) throw error;

      setNotifications([]);
    } catch (error) {
      console.error('Error clearing notifications:', error);
    }
  };

  // Comment actions
  const addComment = async (postId: string, content: string, characterId?: string) => {
    try {
      if (!user) return;

      console.log('Adding comment:', { postId, content, characterId, userId: user.id });

      const { data, error } = await supabase
        .from('comments')
        .insert({
          post_id: postId,
          user_id: user.id,
          character_id: characterId || null,
          content
        })
        .select()
        .single();

      if (error) {
        console.error('Supabase error adding comment:', error);
        throw error;
      }

      console.log('Comment added successfully:', data);

      // Update post comment count locally
      setPosts(prev => prev.map(post => 
        post.id === postId ? { ...post, comments: post.comments + 1 } : post
      ));

      // Reload posts to get updated comment count
      await loadPosts();
    } catch (error) {
      console.error('Error adding comment:', error);
      throw error;
    }
  };

  // Search and recommendations
  const searchContent = (query: string) => {
    const lowerQuery = query.toLowerCase();
    
    const matchingPosts = posts.filter(post =>
      post.content.toLowerCase().includes(lowerQuery) ||
      post.character?.name.toLowerCase().includes(lowerQuery) ||
      post.user?.displayName.toLowerCase().includes(lowerQuery) ||
      post.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
    );

    const matchingCharacters = characters.filter(char =>
      char.name.toLowerCase().includes(lowerQuery) ||
      char.username.toLowerCase().includes(lowerQuery) ||
      char.verseTag.toLowerCase().includes(lowerQuery) ||
      char.universe.toLowerCase().includes(lowerQuery)
    );

    const matchingUsers = allUsers.filter(user =>
      user.displayName.toLowerCase().includes(lowerQuery) ||
      user.username.toLowerCase().includes(lowerQuery) ||
      user.writersTag.toLowerCase().includes(lowerQuery)
    );

    return { posts: matchingPosts, characters: matchingCharacters, users: matchingUsers };
  };

  const getRecommendations = () => {
    // Simple recommendation logic
    const writers = allUsers.slice(0, 5);
    const recommendedCharacters = characters.slice(0, 5);
    
    return { writers, characters: recommendedCharacters };
  };

  const getFilteredPosts = (viewingAs: Character | 'user') => {
    // For now, return all posts - in real app, this would filter based on following relationships
    return posts.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  };

  // Admin functions
  const getAllUsersAdmin = async (): Promise<User[]> => {
    return allUsers;
  };

  const deleteUserAdmin = async (userId: string): Promise<void> => {
    try {
      const { error } = await supabase.rpc('admin_delete_user', {
        target_user_id: userId
      });

      if (error) throw error;

      setAllUsers(prev => prev.filter(user => user.id !== userId));
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  };

  const resetPasswordAdmin = async (userId: string, newPassword: string): Promise<void> => {
    try {
      const { error } = await supabase.rpc('admin_reset_password', {
        target_user_id: userId,
        new_password: newPassword
      });

      if (error) throw error;
    } catch (error) {
      console.error('Error resetting password:', error);
      throw error;
    }
  };

  const updateUserRoleAdmin = async (userId: string, role: 'user' | 'admin'): Promise<void> => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role })
        .eq('id', userId);

      if (error) throw error;

      setAllUsers(prev => prev.map(user => 
        user.id === userId ? { ...user, role } : user
      ));
    } catch (error) {
      console.error('Error updating user role:', error);
      throw error;
    }
  };

  // Relationship functions
  const getUserFollowers = async (userId: string): Promise<User[]> => {
    try {
      const { data: followsData, error } = await supabase
        .from('follows')
        .select(`
          follower_id,
          profiles:follower_id(*)
        `)
        .eq('following_id', userId);

      if (error) throw error;

      return followsData.map(follow => ({
        id: follow.profiles.id,
        username: follow.profiles.username,
        displayName: follow.profiles.display_name,
        avatar: follow.profiles.avatar_url || 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=350&h=350',
        headerImage: follow.profiles.header_image_url || 'https://images.pexels.com/photos/1323550/pexels-photo-1323550.jpeg?auto=compress&cs=tinysrgb&w=800&h=300',
        bio: follow.profiles.bio || '',
        writersTag: follow.profiles.writers_tag,
        email: follow.profiles.email,
        twoFactorEnabled: follow.profiles.two_factor_enabled || false,
        characters: [],
        followers: [],
        following: [],
        createdAt: new Date(follow.profiles.created_at),
        role: follow.profiles.role || 'user',
        privacySettings: {
          profileVisibility: 'public',
          messagePermissions: 'everyone',
          tagNotifications: true,
          directMessageNotifications: true
        }
      }));
    } catch (error) {
      console.error('Error loading followers:', error);
      return [];
    }
  };

  const getUserFollowing = async (userId: string): Promise<User[]> => {
    try {
      const { data: followsData, error } = await supabase
        .from('follows')
        .select(`
          following_id,
          profiles:following_id(*)
        `)
        .eq('follower_id', userId);

      if (error) throw error;

      return followsData.map(follow => ({
        id: follow.profiles.id,
        username: follow.profiles.username,
        displayName: follow.profiles.display_name,
        avatar: follow.profiles.avatar_url || 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=350&h=350',
        headerImage: follow.profiles.header_image_url || 'https://images.pexels.com/photos/1323550/pexels-photo-1323550.jpeg?auto=compress&cs=tinysrgb&w=800&h=300',
        bio: follow.profiles.bio || '',
        writersTag: follow.profiles.writers_tag,
        email: follow.profiles.email,
        twoFactorEnabled: follow.profiles.two_factor_enabled || false,
        characters: [],
        followers: [],
        following: [],
        createdAt: new Date(follow.profiles.created_at),
        role: follow.profiles.role || 'user',
        privacySettings: {
          profileVisibility: 'public',
          messagePermissions: 'everyone',
          tagNotifications: true,
          directMessageNotifications: true
        }
      }));
    } catch (error) {
      console.error('Error loading following:', error);
      return [];
    }
  };

  const getCharacterFollowers = async (characterId: string): Promise<User[]> => {
    return [];
  };

  const getCharacterFollowing = async (characterId: string): Promise<(User | Character)[]> => {
    return [];
  };

  const getPostComments = async (postId: string): Promise<any[]> => {
    try {
      const { data: commentsData, error } = await supabase
        .from('comments')
        .select(`
          *,
          profiles:user_id(id, username, display_name, avatar_url),
          characters:character_id(id, username, name, avatar_url)
        `)
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      return commentsData || [];
    } catch (error) {
      console.error('Error loading comments:', error);
      return [];
    }
  };

  return (
    <AppContext.Provider value={{
      // Data
      posts,
      characters,
      allUsers,
      chats,
      notifications,
      unreadNotifications,
      unreadMessages,
      bookmarkedPosts,
      bookmarkedCharacters,
      bookmarkedUsers,
      
      // Timeline state
      selectedCharacter,
      setSelectedCharacter,
      
      // Actions
      addPost,
      updatePost,
      deletePost,
      likePost,
      repostPost,
      pinPost,
      unpinPost,
      bookmarkPost,
      unbookmarkPost,
      
      addCharacter,
      updateCharacter,
      deleteCharacter,
      followCharacter,
      unfollowCharacter,
      bookmarkCharacter,
      unbookmarkCharacter,
      
      followUser,
      unfollowUser,
      bookmarkUser,
      unbookmarkUser,
      
      sendMessage,
      createChat,
      getChatMessages,
      markMessagesAsRead,
      deleteChatForUser,
      clearAllMessageNotifications,
      searchUsers,
      
      addNotification,
      markNotificationAsRead,
      clearAllNotifications,
      
      addComment,
      
      // Search and recommendations
      searchContent,
      getRecommendations,
      getFilteredPosts,
      
      // Admin functions
      getAllUsersAdmin,
      deleteUserAdmin,
      resetPasswordAdmin,
      updateUserRoleAdmin,
      
      // Relationship functions
      getUserFollowers,
      getUserFollowing,
      getCharacterFollowers,
      getCharacterFollowing,
      getPostComments
    }}>
      {children}
    </AppContext.Provider>
  );
};