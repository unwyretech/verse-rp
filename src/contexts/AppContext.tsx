import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, encryptData, decryptData } from '../lib/supabase';
import { Character, Post, Notification, Chat, Message, User } from '../types';
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
  addCharacter: (character: Omit<Character, 'id' | 'createdAt'>) => void;
  updateCharacter: (id: string, updates: Partial<Character>) => void;
  deleteCharacter: (id: string) => void;
  addPost: (post: Omit<Post, 'id' | 'timestamp' | 'likes' | 'reposts' | 'comments' | 'isLiked' | 'isReposted'>) => void;
  updatePost: (id: string, updates: Partial<Post>) => void;
  deletePost: (id: string) => void;
  likePost: (postId: string) => void;
  repostPost: (postId: string) => void;
  addComment: (postId: string, content: string, characterId?: string) => void;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => void;
  markNotificationAsRead: (id: string) => void;
  clearAllNotifications: () => void;
  sendMessage: (chatId: string, content: string, senderId: string) => void;
  createChat: (participants: string[], isGroup?: boolean, name?: string) => Chat;
  searchContent: (query: string) => { posts: Post[], characters: Character[], users: User[] };
  getRecommendations: () => { writers: User[], characters: Character[] };
  followUser: (userId: string) => void;
  unfollowUser: (userId: string) => void;
  followCharacter: (characterId: string, followerId?: string) => void;
  unfollowCharacter: (characterId: string, followerId?: string) => void;
  getPostComments: (postId: string) => Promise<any[]>;
  getFilteredPosts: (viewingAs?: Character | 'user') => Post[];
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

  // Real-time subscriptions
  useEffect(() => {
    if (!user) return;

    // Subscribe to posts
    const postsSubscription = supabase
      .channel('posts')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, () => {
        loadPosts();
      })
      .subscribe();

    // Subscribe to notifications
    const notificationsSubscription = supabase
      .channel('notifications')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'notifications',
        filter: `user_id=eq.${user.id}`
      }, () => {
        loadNotifications();
      })
      .subscribe();

    // Subscribe to post interactions
    const interactionsSubscription = supabase
      .channel('post_interactions')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'post_interactions' }, () => {
        loadPosts();
      })
      .subscribe();

    return () => {
      postsSubscription.unsubscribe();
      notificationsSubscription.unsubscribe();
      interactionsSubscription.unsubscribe();
    };
  }, [user]);

  // Auto-refresh timeline every second
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(() => {
      loadPosts();
    }, 1000);

    return () => clearInterval(interval);
  }, [user]);

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
        avatar: char.avatar_url,
        headerImage: char.header_url,
        bio: char.bio,
        universe: char.universe,
        verseTag: char.verse_tag,
        traits: char.traits || [],
        userId: char.user_id,
        customColor: char.custom_color,
        customFont: char.custom_font,
        followers: char.followers || [],
        following: char.following || [],
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
          profile:profiles(*),
          interactions:post_interactions(interaction_type, user_id),
          comments:comments(count)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedPosts: Post[] = data.map(post => {
        const likes = post.interactions?.filter((i: any) => i.interaction_type === 'like').length || 0;
        const reposts = post.interactions?.filter((i: any) => i.interaction_type === 'repost').length || 0;
        const isLiked = post.interactions?.some((i: any) => i.interaction_type === 'like' && i.user_id === user?.id) || false;
        const isReposted = post.interactions?.some((i: any) => i.interaction_type === 'repost' && i.user_id === user?.id) || false;

        return {
          id: post.id,
          content: post.content,
          characterId: post.character_id,
          character: post.character ? {
            id: post.character.id,
            username: post.character.username,
            name: post.character.name,
            title: post.character.title,
            avatar: post.character.avatar_url,
            headerImage: post.character.header_url,
            bio: post.character.bio,
            universe: post.character.universe,
            verseTag: post.character.verse_tag,
            traits: post.character.traits || [],
            userId: post.character.user_id,
            customColor: post.character.custom_color,
            customFont: post.character.custom_font,
            followers: post.character.followers || [],
            following: post.character.following || [],
            createdAt: new Date(post.character.created_at)
          } : undefined,
          userId: post.user_id,
          user: post.profile ? {
            id: post.profile.id,
            username: post.profile.username,
            displayName: post.profile.display_name,
            avatar: post.profile.avatar_url,
            headerImage: post.profile.header_image_url,
            bio: post.profile.bio,
            writersTag: post.profile.writers_tag,
            email: post.profile.email,
            twoFactorEnabled: post.profile.two_factor_enabled,
            characters: [],
            followers: post.profile.followers || [],
            following: post.profile.following || [],
            createdAt: new Date(post.profile.created_at),
            privacySettings: {
              profileVisibility: 'public',
              messagePermissions: 'everyone',
              tagNotifications: true,
              directMessageNotifications: true
            }
          } : undefined,
          timestamp: new Date(post.created_at),
          likes,
          reposts,
          comments: post.comments?.length || 0,
          isLiked,
          isReposted,
          isThread: post.is_thread,
          threadId: post.thread_id,
          parentPostId: post.parent_post_id,
          visibility: post.visibility,
          tags: post.tags || []
        };
      });

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
          avatar: notif.from_profile.avatar_url,
          headerImage: notif.from_profile.header_image_url,
          bio: notif.from_profile.bio,
          writersTag: notif.from_profile.writers_tag,
          email: notif.from_profile.email,
          twoFactorEnabled: notif.from_profile.two_factor_enabled,
          characters: [],
          followers: notif.from_profile.followers || [],
          following: notif.from_profile.following || [],
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
          header_url: character.headerImage,
          followers: [],
          following: []
        })
        .select()
        .single();

      if (error) throw error;

      const newCharacter: Character = {
        id: data.id,
        username: data.username,
        name: data.name,
        title: data.title,
        avatar: data.avatar_url,
        headerImage: data.header_url,
        bio: data.bio,
        universe: data.universe,
        verseTag: data.verse_tag,
        traits: data.traits || [],
        userId: data.user_id,
        customColor: data.custom_color,
        customFont: data.custom_font,
        followers: data.followers || [],
        following: data.following || [],
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
          followers: updates.followers,
          following: updates.following,
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
          thread_id: post.threadId,
          parent_post_id: post.parentPostId,
          tags: post.tags
        })
        .select()
        .single();

      if (error) throw error;

      // Create notification for replies
      if (post.parentPostId) {
        const parentPost = posts.find(p => p.id === post.parentPostId);
        if (parentPost && parentPost.userId !== user.id) {
          await addNotification({
            type: 'comment',
            userId: parentPost.userId,
            fromUserId: user.id,
            postId: post.parentPostId,
            message: `${user.displayName} replied to your post`,
            read: false
          });
        }
      }

      loadPosts();
    } catch (error) {
      console.error('Error adding post:', error);
    }
  };

  const updatePost = async (id: string, updates: Partial<Post>) => {
    try {
      const { error } = await supabase
        .from('posts')
        .update({
          content: updates.content,
          visibility: updates.visibility,
          tags: updates.tags,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;

      loadPosts();
    } catch (error) {
      console.error('Error updating post:', error);
    }
  };

  const deletePost = async (id: string) => {
    try {
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setPosts(prev => prev.filter(post => post.id !== id));
    } catch (error) {
      console.error('Error deleting post:', error);
    }
  };

  const likePost = async (postId: string) => {
    if (!user) return;

    try {
      const existingLike = await supabase
        .from('post_interactions')
        .select('id')
        .eq('user_id', user.id)
        .eq('post_id', postId)
        .eq('interaction_type', 'like')
        .single();

      if (existingLike.data) {
        // Unlike
        await supabase
          .from('post_interactions')
          .delete()
          .eq('id', existingLike.data.id);
      } else {
        // Like
        await supabase
          .from('post_interactions')
          .insert({
            user_id: user.id,
            post_id: postId,
            interaction_type: 'like'
          });

        // Create notification
        const post = posts.find(p => p.id === postId);
        if (post && post.userId !== user.id) {
          await addNotification({
            type: 'like',
            userId: post.userId,
            fromUserId: user.id,
            postId,
            message: `${user.displayName} liked your post`,
            read: false
          });
        }
      }

      loadPosts();
    } catch (error) {
      console.error('Error liking post:', error);
    }
  };

  const repostPost = async (postId: string) => {
    if (!user) return;

    try {
      const existingRepost = await supabase
        .from('post_interactions')
        .select('id')
        .eq('user_id', user.id)
        .eq('post_id', postId)
        .eq('interaction_type', 'repost')
        .single();

      if (existingRepost.data) {
        // Unrepost
        await supabase
          .from('post_interactions')
          .delete()
          .eq('id', existingRepost.data.id);
      } else {
        // Repost
        await supabase
          .from('post_interactions')
          .insert({
            user_id: user.id,
            post_id: postId,
            interaction_type: 'repost'
          });

        // Create notification
        const post = posts.find(p => p.id === postId);
        if (post && post.userId !== user.id) {
          await addNotification({
            type: 'repost',
            userId: post.userId,
            fromUserId: user.id,
            postId,
            message: `${user.displayName} reposted your post`,
            read: false
          });
        }
      }

      loadPosts();
    } catch (error) {
      console.error('Error reposting post:', error);
    }
  };

  const addComment = async (postId: string, content: string, characterId?: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('comments')
        .insert({
          user_id: user.id,
          post_id: postId,
          character_id: characterId,
          content
        });

      if (error) throw error;

      // Create notification
      const post = posts.find(p => p.id === postId);
      if (post && post.userId !== user.id) {
        await addNotification({
          type: 'comment',
          userId: post.userId,
          fromUserId: user.id,
          postId,
          message: `${user.displayName} commented on your post`,
          read: false
        });
      }

      loadPosts();
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  const getPostComments = async (postId: string) => {
    try {
      const { data, error } = await supabase
        .from('comments')
        .select(`
          *,
          profile:profiles(*),
          character:characters(*)
        `)
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      return data.map(comment => ({
        id: comment.id,
        content: comment.content,
        userId: comment.user_id,
        postId: comment.post_id,
        characterId: comment.character_id,
        character: comment.character,
        user: comment.profile,
        timestamp: new Date(comment.created_at)
      }));
    } catch (error) {
      console.error('Error loading comments:', error);
      return [];
    }
  };

  const addNotification = async (notification: Omit<Notification, 'id' | 'timestamp'>) => {
    try {
      await supabase
        .from('notifications')
        .insert({
          user_id: notification.userId,
          from_user_id: notification.fromUserId,
          type: notification.type,
          post_id: notification.postId,
          message: notification.message,
          read: notification.read
        });
    } catch (error) {
      console.error('Error adding notification:', error);
    }
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

  const followUser = async (userId: string) => {
    if (!user) return;

    try {
      // Add to follows table
      await supabase
        .from('follows')
        .insert({
          follower_id: user.id,
          following_id: userId
        });

      // Create notification
      await addNotification({
        type: 'follow',
        userId,
        fromUserId: user.id,
        message: `${user.displayName} started following you`,
        read: false
      });

      loadNotifications();
    } catch (error) {
      console.error('Error following user:', error);
    }
  };

  const unfollowUser = async (userId: string) => {
    if (!user) return;

    try {
      await supabase
        .from('follows')
        .delete()
        .eq('follower_id', user.id)
        .eq('following_id', userId);
    } catch (error) {
      console.error('Error unfollowing user:', error);
    }
  };

  const followCharacter = async (characterId: string, followerId?: string) => {
    if (!user) return;

    const character = characters.find(c => c.id === characterId);
    if (!character) return;

    try {
      const updatedFollowers = [...character.followers, followerId || user.id];
      
      await supabase
        .from('characters')
        .update({ followers: updatedFollowers })
        .eq('id', characterId);

      setCharacters(prev => prev.map(char => 
        char.id === characterId 
          ? { ...char, followers: updatedFollowers }
          : char
      ));
    } catch (error) {
      console.error('Error following character:', error);
    }
  };

  const unfollowCharacter = async (characterId: string, followerId?: string) => {
    if (!user) return;

    const character = characters.find(c => c.id === characterId);
    if (!character) return;

    try {
      const updatedFollowers = character.followers.filter(id => id !== (followerId || user.id));
      
      await supabase
        .from('characters')
        .update({ followers: updatedFollowers })
        .eq('id', characterId);

      setCharacters(prev => prev.map(char => 
        char.id === characterId 
          ? { ...char, followers: updatedFollowers }
          : char
      ));
    } catch (error) {
      console.error('Error unfollowing character:', error);
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

    // Search users by writers tag and username
    const uniqueUsers = Array.from(
      new Map(
        posts
          .filter(post => post.user)
          .map(post => post.user!)
          .filter(user => 
            user.username.toLowerCase().includes(lowerQuery) ||
            user.displayName.toLowerCase().includes(lowerQuery) ||
            user.writersTag.toLowerCase().includes(lowerQuery)
          )
          .map(user => [user.id, user])
      ).values()
    );

    return { posts: filteredPosts, characters: filteredCharacters, users: uniqueUsers };
  };

  const getRecommendations = () => {
    if (!user) return { writers: [], characters: [] };

    const userVerseTags = characters
      .filter(char => char.userId === user.id)
      .map(char => char.verseTag);

    const recommendedCharacters = characters
      .filter(char => 
        char.userId !== user.id && 
        userVerseTags.some(tag => char.verseTag.toLowerCase().includes(tag.toLowerCase()))
      )
      .slice(0, 5);

    const recommendedWriters: User[] = [];

    return { writers: recommendedWriters, characters: recommendedCharacters };
  };

  const getFilteredPosts = (viewingAs?: Character | 'user') => {
    if (!user) return [];

    if (viewingAs === 'user') {
      // Show posts from users the main account follows
      return posts.filter(post => {
        if (post.userId === user.id) return true; // Own posts
        return user.following.includes(post.userId);
      });
    } else if (viewingAs) {
      // Show posts from accounts/characters this character follows
      return posts.filter(post => {
        if (post.userId === user.id) return true; // Own posts
        if (post.characterId && viewingAs.following.includes(post.characterId)) return true;
        return viewingAs.following.includes(post.userId);
      });
    }

    // Default: show all posts from followed accounts
    return posts.filter(post => {
      if (post.userId === user.id) return true;
      return user.following.includes(post.userId);
    });
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
      deletePost,
      likePost,
      repostPost,
      addComment,
      addNotification,
      markNotificationAsRead,
      clearAllNotifications,
      sendMessage,
      createChat,
      searchContent,
      getRecommendations,
      followUser,
      unfollowUser,
      followCharacter,
      unfollowCharacter,
      getPostComments,
      getFilteredPosts
    }}>
      {children}
    </AppContext.Provider>
  );
};