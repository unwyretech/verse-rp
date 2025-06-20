import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, encryptData, decryptData } from '../lib/supabase';
import { Character, Post, Notification, Chat, Message } from '../types';
import { useAuth } from './AuthContext';

interface AppContextType {
  characters: Character[];
  posts: Post[];
  notifications: Notification[];
  chats: Chat[];
  selectedCharacter: Character | null;
  unreadNotifications: number;
  setCharacters: (characters: Character[]) => void;
  setPosts: (posts: Post[]) => void;
  setNotifications: (notifications: Notification[]) => void;
  setChats: (chats: Chat[]) => void;
  setSelectedCharacter: (character: Character | null) => void;
  addCharacter: (character: Character) => void;
  updateCharacter: (id: string, updates: Partial<Character>) => void;
  deleteCharacter: (id: string) => void;
  addPost: (post: Post) => void;
  updatePost: (id: string, updates: Partial<Post>) => void;
  addNotification: (notification: Notification) => void;
  markNotificationAsRead: (id: string) => void;
  clearAllNotifications: () => void;
  sendMessage: (chatId: string, content: string, senderId: string) => void;
  createChat: (participants: string[], isGroup?: boolean, name?: string) => Chat;
  searchContent: (query: string) => { posts: Post[], characters: Character[], users: any[] };
  getRecommendations: () => { writers: any[], characters: Character[] };
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
  const { user } = useAuth();
  const [characters, setCharacters] = useState<Character[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);

  const unreadNotifications = notifications.filter(n => !n.read).length;

  // Load data when user changes
  useEffect(() => {
    if (user) {
      loadCharacters();
      loadPosts();
      loadNotifications();
      loadChats();
    }
  }, [user]);

  const loadCharacters = async () => {
    try {
      const { data, error } = await supabase
        .from('characters')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedCharacters: Character[] = data.map(char => ({
        id: char.id,
        username: char.username,
        name: char.name,
        title: char.title,
        avatar: char.avatar_url || 'https://images.pexels.com/photos/1382734/pexels-photo-1382734.jpeg?auto=compress&cs=tinysrgb&w=150&h=150',
        headerImage: char.header_url || 'https://images.pexels.com/photos/1323550/pexels-photo-1323550.jpeg?auto=compress&cs=tinysrgb&w=800&h=300',
        bio: char.bio,
        universe: char.universe,
        verseTag: char.verse_tag,
        traits: char.traits || [],
        userId: char.user_id,
        customColor: char.custom_color,
        customFont: char.custom_font,
        createdAt: new Date(char.created_at)
      }));

      setCharacters(formattedCharacters);
    } catch (error) {
      console.error('Error loading characters:', error);
    }
  };

  const loadPosts = async () => {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          character:characters(*),
          profile:profiles(*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedPosts: Post[] = data.map(post => ({
        id: post.id,
        content: post.content,
        characterId: post.character_id,
        character: post.character ? {
          id: post.character.id,
          username: post.character.username,
          name: post.character.name,
          title: post.character.title,
          avatar: post.character.avatar_url || 'https://images.pexels.com/photos/1382734/pexels-photo-1382734.jpeg?auto=compress&cs=tinysrgb&w=150&h=150',
          headerImage: post.character.header_url || 'https://images.pexels.com/photos/1323550/pexels-photo-1323550.jpeg?auto=compress&cs=tinysrgb&w=800&h=300',
          bio: post.character.bio,
          universe: post.character.universe,
          verseTag: post.character.verse_tag,
          traits: post.character.traits || [],
          userId: post.character.user_id,
          customColor: post.character.custom_color,
          customFont: post.character.custom_font,
          createdAt: new Date(post.character.created_at)
        } : undefined,
        userId: post.user_id,
        user: post.profile ? {
          id: post.profile.id,
          username: post.profile.username,
          displayName: post.profile.display_name,
          avatar: post.profile.avatar_url || 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=150&h=150',
          headerImage: post.profile.header_image_url || 'https://images.pexels.com/photos/1323550/pexels-photo-1323550.jpeg?auto=compress&cs=tinysrgb&w=800&h=300',
          bio: post.profile.bio,
          writersTag: post.profile.writers_tag,
          email: post.profile.email,
          twoFactorEnabled: post.profile.two_factor_enabled,
          characters: [],
          followers: [],
          following: [],
          createdAt: new Date(post.profile.created_at),
          privacySettings: {
            profileVisibility: 'public',
            messagePermissions: 'everyone',
            tagNotifications: true,
            directMessageNotifications: true
          }
        } : undefined,
        timestamp: new Date(post.created_at),
        likes: Math.floor(Math.random() * 50), // Mock data for demo
        reposts: Math.floor(Math.random() * 20),
        comments: Math.floor(Math.random() * 15),
        isLiked: Math.random() > 0.7,
        isReposted: Math.random() > 0.9,
        isThread: post.is_thread,
        visibility: post.visibility,
        tags: post.tags || []
      }));

      setPosts(formattedPosts);
    } catch (error) {
      console.error('Error loading posts:', error);
    }
  };

  const loadNotifications = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('notifications')
        .select(`
          *,
          from_profile:profiles!notifications_from_user_id_fkey(*)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedNotifications: Notification[] = data.map(notif => ({
        id: notif.id,
        type: notif.type,
        userId: notif.user_id,
        fromUserId: notif.from_user_id,
        fromUser: notif.from_profile ? {
          id: notif.from_profile.id,
          username: notif.from_profile.username,
          displayName: notif.from_profile.display_name,
          avatar: notif.from_profile.avatar_url || 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=150&h=150',
          headerImage: notif.from_profile.header_image_url || 'https://images.pexels.com/photos/1323550/pexels-photo-1323550.jpeg?auto=compress&cs=tinysrgb&w=800&h=300',
          bio: notif.from_profile.bio,
          writersTag: notif.from_profile.writers_tag,
          email: notif.from_profile.email,
          twoFactorEnabled: notif.from_profile.two_factor_enabled,
          characters: [],
          followers: [],
          following: [],
          createdAt: new Date(notif.from_profile.created_at),
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
        read: notif.read
      }));

      setNotifications(formattedNotifications);
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  const loadChats = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('chats')
        .select(`
          *,
          participants:chat_participants(
            user_id,
            profile:profiles(*)
          ),
          last_message:messages(*)
        `)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      // Filter chats where user is a participant
      const userChats = data.filter(chat => 
        chat.participants.some((p: any) => p.user_id === user.id)
      );

      const formattedChats: Chat[] = userChats.map(chat => ({
        id: chat.id,
        participants: chat.participants.map((p: any) => p.user_id),
        isGroup: chat.is_group,
        name: chat.name,
        createdAt: new Date(chat.created_at),
        isEncrypted: chat.is_encrypted,
        lastMessage: chat.last_message?.[0] ? {
          id: chat.last_message[0].id,
          content: decryptData(chat.last_message[0].content),
          senderId: chat.last_message[0].sender_id,
          chatId: chat.last_message[0].chat_id,
          timestamp: new Date(chat.last_message[0].created_at),
          isEncrypted: chat.last_message[0].is_encrypted,
          readBy: []
        } : undefined
      }));

      setChats(formattedChats);
    } catch (error) {
      console.error('Error loading chats:', error);
    }
  };

  const addCharacter = async (character: Omit<Character, 'id' | 'createdAt'>) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('characters')
        .insert({
          user_id: user.id,
          username: character.username,
          name: character.name,
          title: character.title,
          bio: character.bio,
          universe: character.universe,
          verse_tag: character.verseTag,
          traits: character.traits,
          custom_color: character.customColor,
          custom_font: character.customFont,
          avatar_url: character.avatar,
          header_url: character.headerImage
        })
        .select()
        .single();

      if (error) throw error;

      const newCharacter: Character = {
        id: data.id,
        username: data.username,
        name: data.name,
        title: data.title,
        avatar: data.avatar_url || 'https://images.pexels.com/photos/1382734/pexels-photo-1382734.jpeg?auto=compress&cs=tinysrgb&w=150&h=150',
        headerImage: data.header_url || 'https://images.pexels.com/photos/1323550/pexels-photo-1323550.jpeg?auto=compress&cs=tinysrgb&w=800&h=300',
        bio: data.bio,
        universe: data.universe,
        verseTag: data.verse_tag,
        traits: data.traits || [],
        userId: data.user_id,
        customColor: data.custom_color,
        customFont: data.custom_font,
        createdAt: new Date(data.created_at)
      };

      setCharacters(prev => [newCharacter, ...prev]);
    } catch (error) {
      console.error('Error adding character:', error);
    }
  };

  const updateCharacter = async (id: string, updates: Partial<Character>) => {
    try {
      const { error } = await supabase
        .from('characters')
        .update({
          username: updates.username,
          name: updates.name,
          title: updates.title,
          bio: updates.bio,
          universe: updates.universe,
          verse_tag: updates.verseTag,
          traits: updates.traits,
          custom_color: updates.customColor,
          custom_font: updates.customFont,
          avatar_url: updates.avatar,
          header_url: updates.headerImage,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;

      setCharacters(prev => prev.map(char => 
        char.id === id ? { ...char, ...updates } : char
      ));
    } catch (error) {
      console.error('Error updating character:', error);
    }
  };

  const deleteCharacter = async (id: string) => {
    try {
      const { error } = await supabase
        .from('characters')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setCharacters(prev => prev.filter(char => char.id !== id));
    } catch (error) {
      console.error('Error deleting character:', error);
    }
  };

  const addPost = async (post: Omit<Post, 'id' | 'timestamp' | 'likes' | 'reposts' | 'comments' | 'isLiked' | 'isReposted'>) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('posts')
        .insert({
          user_id: user.id,
          character_id: post.characterId,
          content: post.content,
          visibility: post.visibility,
          is_thread: post.isThread,
          tags: post.tags
        })
        .select()
        .single();

      if (error) throw error;

      const newPost: Post = {
        id: data.id,
        content: data.content,
        characterId: data.character_id,
        character: post.character,
        userId: data.user_id,
        user: post.user,
        timestamp: new Date(data.created_at),
        likes: 0,
        reposts: 0,
        comments: 0,
        isLiked: false,
        isReposted: false,
        isThread: data.is_thread,
        visibility: data.visibility,
        tags: data.tags || []
      };

      setPosts(prev => [newPost, ...prev]);
    } catch (error) {
      console.error('Error adding post:', error);
    }
  };

  const updatePost = (id: string, updates: Partial<Post>) => {
    setPosts(prev => prev.map(post => 
      post.id === id ? { ...post, ...updates } : post
    ));
  };

  const addNotification = (notification: Notification) => {
    setNotifications(prev => [notification, ...prev]);
  };

  const markNotificationAsRead = async (id: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', id);

      if (error) throw error;

      setNotifications(prev => prev.map(notif => 
        notif.id === id ? { ...notif, read: true } : notif
      ));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const clearAllNotifications = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('user_id', user.id);

      if (error) throw error;

      setNotifications([]);
    } catch (error) {
      console.error('Error clearing notifications:', error);
    }
  };

  const sendMessage = async (chatId: string, content: string, senderId: string) => {
    try {
      const encryptedContent = encryptData(content);
      
      const { data, error } = await supabase
        .from('messages')
        .insert({
          chat_id: chatId,
          sender_id: senderId,
          content: encryptedContent,
          is_encrypted: true
        })
        .select()
        .single();

      if (error) throw error;

      // Update chat's last message
      await supabase
        .from('chats')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', chatId);

      const message: Message = {
        id: data.id,
        content,
        senderId: data.sender_id,
        chatId: data.chat_id,
        timestamp: new Date(data.created_at),
        isEncrypted: data.is_encrypted,
        readBy: [senderId]
      };

      setChats(prev => prev.map(chat => 
        chat.id === chatId 
          ? { ...chat, lastMessage: message }
          : chat
      ));
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const createChat = async (participants: string[], isGroup = false, name?: string): Promise<Chat> => {
    if (!user) throw new Error('User not authenticated');

    try {
      const { data: chatData, error: chatError } = await supabase
        .from('chats')
        .insert({
          name,
          is_group: isGroup,
          is_encrypted: true,
          created_by: user.id
        })
        .select()
        .single();

      if (chatError) throw chatError;

      // Add participants
      const participantInserts = [user.id, ...participants].map(userId => ({
        chat_id: chatData.id,
        user_id: userId
      }));

      const { error: participantsError } = await supabase
        .from('chat_participants')
        .insert(participantInserts);

      if (participantsError) throw participantsError;

      const chat: Chat = {
        id: chatData.id,
        participants: [user.id, ...participants],
        isGroup,
        name,
        createdAt: new Date(chatData.created_at),
        isEncrypted: chatData.is_encrypted
      };

      setChats(prev => [chat, ...prev]);
      return chat;
    } catch (error) {
      console.error('Error creating chat:', error);
      throw error;
    }
  };

  const searchContent = (query: string) => {
    const lowerQuery = query.toLowerCase();
    
    const filteredPosts = posts.filter(post =>
      post.content.toLowerCase().includes(lowerQuery) ||
      post.tags.some(tag => tag.toLowerCase().includes(lowerQuery)) ||
      post.character?.name.toLowerCase().includes(lowerQuery) ||
      post.character?.verseTag.toLowerCase().includes(lowerQuery) ||
      post.user?.displayName.toLowerCase().includes(lowerQuery) ||
      post.user?.username.toLowerCase().includes(lowerQuery)
    );

    const filteredCharacters = characters.filter(char =>
      char.name.toLowerCase().includes(lowerQuery) ||
      char.username.toLowerCase().includes(lowerQuery) ||
      char.verseTag.toLowerCase().includes(lowerQuery) ||
      char.universe.toLowerCase().includes(lowerQuery) ||
      char.traits.some(trait => trait.toLowerCase().includes(lowerQuery))
    );

    // Mock user search - in real app, this would query profiles table
    const users: any[] = [];

    return { posts: filteredPosts, characters: filteredCharacters, users };
  };

  const getRecommendations = () => {
    if (!user) return { writers: [], characters: [] };

    // Get user's verse tags from their characters
    const userVerseTags = characters
      .filter(char => char.userId === user.id)
      .map(char => char.verseTag);

    // Recommend characters from similar verses
    const recommendedCharacters = characters
      .filter(char => 
        char.userId !== user.id && 
        userVerseTags.some(tag => char.verseTag.toLowerCase().includes(tag.toLowerCase()))
      )
      .slice(0, 5);

    // Mock writer recommendations based on verse tags
    const recommendedWriters: any[] = [];

    return { writers: recommendedWriters, characters: recommendedCharacters };
  };

  return (
    <AppContext.Provider value={{
      characters,
      posts,
      notifications,
      chats,
      selectedCharacter,
      unreadNotifications,
      setCharacters,
      setPosts,
      setNotifications,
      setChats,
      setSelectedCharacter,
      addCharacter,
      updateCharacter,
      deleteCharacter,
      addPost,
      updatePost,
      addNotification,
      markNotificationAsRead,
      clearAllNotifications,
      sendMessage,
      createChat,
      searchContent,
      getRecommendations
    }}>
      {children}
    </AppContext.Provider>
  );
};