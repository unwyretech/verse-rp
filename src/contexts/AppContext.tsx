import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, encryptData, decryptData, uploadImage } from '../lib/supabase';
import { Character, Post, Notification, Chat, Message, User } from '../types';
import { useAuth } from './AuthContext';

interface AppContextType {
  characters: Character[];
  posts: Post[];
  notifications: Notification[];
  chats: Chat[];
  selectedCharacter: Character | null;
  unreadNotifications: number;
  unreadMessages: number;
  allUsers: User[];
  bookmarkedPosts: string[];
  bookmarkedCharacters: string[];
  bookmarkedUsers: string[];
  followedUserIds: Set<string>;
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
  pinPost: (postId: string) => void;
  unpinPost: (postId: string) => void;
  addComment: (postId: string, content: string, characterId?: string) => void;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => void;
  markNotificationAsRead: (id: string) => void;
  clearAllNotifications: () => void;
  sendMessage: (chatId: string, content: string, senderId: string, mediaUrl?: string) => void;
  createChat: (participants: string[], isGroup?: boolean, name?: string) => Chat;
  searchContent: (query: string) => { posts: Post[], characters: Character[], users: User[] };
  getRecommendations: () => { writers: User[], characters: Character[] };
  followUser: (userId: string) => void;
  unfollowUser: (userId: string) => void;
  followCharacter: (characterId: string, followerId?: string) => void;
  unfollowCharacter: (characterId: string, followerId?: string) => void;
  getPostComments: (postId: string) => Promise<any[]>;
  getFilteredPosts: (viewingAs?: Character | 'user') => Post[];
  getUserFollowers: (userId: string) => Promise<User[]>;
  getUserFollowing: (userId: string) => Promise<User[]>;
  getCharacterFollowers: (characterId: string) => Promise<User[]>;
  getCharacterFollowing: (characterId: string) => Promise<(User | Character)[]>;
  bookmarkPost: (postId: string) => void;
  bookmarkCharacter: (characterId: string) => void;
  bookmarkUser: (userId: string) => void;
  unbookmarkPost: (postId: string) => void;
  unbookmarkCharacter: (characterId: string) => void;
  unbookmarkUser: (userId: string) => void;
  getChatMessages: (chatId: string) => Promise<Message[]>;
  markMessagesAsRead: (chatId: string) => void;
  // Admin functions
  getAllUsersAdmin: () => Promise<User[]>;
  deleteUserAdmin: (userId: string) => Promise<boolean>;
  resetPasswordAdmin: (userId: string, newPassword: string) => Promise<boolean>;
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
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [bookmarkedPosts, setBookmarkedPosts] = useState<string[]>([]);
  const [bookmarkedCharacters, setBookmarkedCharacters] = useState<string[]>([]);
  const [bookmarkedUsers, setBookmarkedUsers] = useState<string[]>([]);
  const [followedUserIds, setFollowedUserIds] = useState<Set<string>>(new Set());

  const unreadNotifications = notifications.filter(n => !n.read).length;
  const unreadMessages = chats.reduce((total, chat) => {
    if (chat.lastMessage && !chat.lastMessage.readBy.includes(user?.id || '')) {
      return total + 1;
    }
    return total;
  }, 0);

  // Load followed user IDs from database
  const loadFollowedUsers = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', user.id);

      if (error) throw error;

      const followedIds = new Set(data.map(follow => follow.following_id));
      setFollowedUserIds(followedIds);
    } catch (error) {
      console.error('Error loading followed users:', error);
    }
  };

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

    // Subscribe to characters
    const charactersSubscription = supabase
      .channel('characters')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'characters' }, () => {
        loadCharacters();
      })
      .subscribe();

    // Subscribe to profiles
    const profilesSubscription = supabase
      .channel('profiles')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
        loadAllUsers();
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

    // Subscribe to messages
    const messagesSubscription = supabase
      .channel('messages')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, () => {
        loadChats();
      })
      .subscribe();

    // Subscribe to chats
    const chatsSubscription = supabase
      .channel('chats')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'chats' }, () => {
        loadChats();
      })
      .subscribe();

    // Subscribe to follows
    const followsSubscription = supabase
      .channel('follows')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'follows' }, () => {
        loadAllUsers();
        loadFollowedUsers(); // Reload followed users when follows change
        loadPosts(); // Refresh posts when follows change
      })
      .subscribe();

    return () => {
      postsSubscription.unsubscribe();
      charactersSubscription.unsubscribe();
      profilesSubscription.unsubscribe();
      notificationsSubscription.unsubscribe();
      messagesSubscription.unsubscribe();
      chatsSubscription.unsubscribe();
      followsSubscription.unsubscribe();
    };
  }, [user]);

  // Load data when user changes
  useEffect(() => {
    if (user) {
      loadCharacters();
      loadPosts();
      loadNotifications();
      loadChats();
      loadAllUsers();
      loadBookmarks();
      loadFollowedUsers();
    }
  }, [user]);

  // Real-time refresh for follower/following counts
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(() => {
      loadAllUsers();
      loadCharacters();
      loadFollowedUsers();
    }, 1000);

    return () => clearInterval(interval);
  }, [user]);

  const loadBookmarks = () => {
    if (!user) return;
    
    // Load from localStorage for now
    const savedBookmarkedPosts = localStorage.getItem(`bookmarkedPosts_${user.id}`);
    const savedBookmarkedCharacters = localStorage.getItem(`bookmarkedCharacters_${user.id}`);
    const savedBookmarkedUsers = localStorage.getItem(`bookmarkedUsers_${user.id}`);
    
    if (savedBookmarkedPosts) {
      setBookmarkedPosts(JSON.parse(savedBookmarkedPosts));
    }
    if (savedBookmarkedCharacters) {
      setBookmarkedCharacters(JSON.parse(savedBookmarkedCharacters));
    }
    if (savedBookmarkedUsers) {
      setBookmarkedUsers(JSON.parse(savedBookmarkedUsers));
    }
  };

  const saveBookmarks = (type: 'posts' | 'characters' | 'users', bookmarks: string[]) => {
    if (!user) return;
    localStorage.setItem(`bookmarked${type.charAt(0).toUpperCase() + type.slice(1)}_${user.id}`, JSON.stringify(bookmarks));
  };

  const loadAllUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
          follower_count:follows!follows_following_id_fkey(count),
          following_count:follows!follows_follower_id_fkey(count),
          is_followed:follows!follows_following_id_fkey!inner(follower_id)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedUsers: User[] = data.map(profile => ({
        id: profile.id,
        username: profile.username,
        displayName: profile.display_name,
        avatar: profile.avatar_url || 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=350&h=350',
        headerImage: profile.header_image_url || 'https://images.pexels.com/photos/1323550/pexels-photo-1323550.jpeg?auto=compress&cs=tinysrgb&w=1500&h=500',
        bio: profile.bio || '',
        writersTag: profile.writers_tag,
        email: profile.email,
        twoFactorEnabled: profile.two_factor_enabled || false,
        characters: [],
        followers: profile.followers || [],
        following: profile.following || [],
        createdAt: new Date(profile.created_at),
        role: profile.role || 'user',
        privacySettings: {
          profileVisibility: 'public',
          messagePermissions: 'everyone',
          tagNotifications: true,
          directMessageNotifications: true
        }
      }));

      setAllUsers(formattedUsers);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

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
          comments:comments(
            id,
            content,
            user_id,
            character_id,
            created_at,
            profile:profiles(*),
            character:characters(*)
          )
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
            role: post.profile.role || 'user',
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
          isPinned: post.is_pinned || false,
          isThread: post.is_thread,
          threadId: post.thread_id,
          parentPostId: post.parent_post_id,
          visibility: post.visibility,
          tags: post.tags || [],
          mediaUrls: post.media_urls || [],
          replies: post.comments?.map((comment: any) => ({
            id: comment.id,
            content: comment.content,
            userId: comment.user_id,
            characterId: comment.character_id,
            timestamp: new Date(comment.created_at),
            user: comment.profile ? {
              id: comment.profile.id,
              username: comment.profile.username,
              displayName: comment.profile.display_name,
              avatar: comment.profile.avatar_url,
              headerImage: comment.profile.header_image_url,
              bio: comment.profile.bio,
              writersTag: comment.profile.writers_tag,
              email: comment.profile.email,
              twoFactorEnabled: comment.profile.two_factor_enabled,
              characters: [],
              followers: comment.profile.followers || [],
              following: comment.profile.following || [],
              createdAt: new Date(comment.profile.created_at),
              role: comment.profile.role || 'user',
              privacySettings: {
                profileVisibility: 'public',
                messagePermissions: 'everyone',
                tagNotifications: true,
                directMessageNotifications: true
              }
            } : undefined,
            character: comment.character ? {
              id: comment.character.id,
              username: comment.character.username,
              name: comment.character.name,
              title: comment.character.title,
              avatar: comment.character.avatar_url,
              headerImage: comment.character.header_url,
              bio: comment.character.bio,
              universe: comment.character.universe,
              verseTag: comment.character.verse_tag,
              traits: comment.character.traits || [],
              userId: comment.character.user_id,
              customColor: comment.character.custom_color,
              customFont: comment.character.custom_font,
              followers: comment.character.followers || [],
              following: comment.character.following || [],
              createdAt: new Date(comment.character.created_at)
            } : undefined
          })) || []
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
          role: notif.from_profile.role || 'user',
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
          content: chat.last_message[0].is_encrypted ? decryptData(chat.last_message[0].content) : chat.last_message[0].content,
          senderId: chat.last_message[0].sender_id,
          chatId: chat.last_message[0].chat_id,
          timestamp: new Date(chat.last_message[0].created_at),
          isEncrypted: chat.last_message[0].is_encrypted,
          readBy: chat.last_message[0].read_by || [],
          mediaUrl: chat.last_message[0].media_url
        } : undefined
      }));

      setChats(formattedChats);
    } catch (error) {
      console.error('Error loading chats:', error);
    }
  };

  const getChatMessages = async (chatId: string): Promise<Message[]> => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          sender:profiles(*)
        `)
        .eq('chat_id', chatId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      return data.map(message => ({
        id: message.id,
        content: message.is_encrypted ? decryptData(message.content) : message.content,
        senderId: message.sender_id,
        chatId: message.chat_id,
        timestamp: new Date(message.created_at),
        isEncrypted: message.is_encrypted,
        readBy: message.read_by || [],
        mediaUrl: message.media_url
      }));
    } catch (error) {
      console.error('Error loading messages:', error);
      return [];
    }
  };

  const markMessagesAsRead = async (chatId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase.rpc('mark_messages_as_read', {
        chat_id_param: chatId,
        user_id_param: user.id
      });

      if (error) throw error;
      
      loadChats(); // Refresh chats to update unread count
    } catch (error) {
      console.error('Error marking messages as read:', error);
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
          tags: post.tags,
          media_urls: post.mediaUrls || []
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

  const updatePost = async (id: string, updates: Partial<Post>) => {
    try {
      const { error } = await supabase
        .from('posts')
        .update({
          content: updates.content,
          visibility: updates.visibility,
          tags: updates.tags,
          media_urls: updates.mediaUrls,
          is_pinned: updates.isPinned,
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

  const pinPost = async (postId: string) => {
    try {
      const { error } = await supabase
        .from('posts')
        .update({ is_pinned: true })
        .eq('id', postId);

      if (error) throw error;

      setPosts(prev => prev.map(post => 
        post.id === postId ? { ...post, isPinned: true } : post
      ));
    } catch (error) {
      console.error('Error pinning post:', error);
    }
  };

  const unpinPost = async (postId: string) => {
    try {
      const { error } = await supabase
        .from('posts')
        .update({ is_pinned: false })
        .eq('id', postId);

      if (error) throw error;

      setPosts(prev => prev.map(post => 
        post.id === postId ? { ...post, isPinned: false } : post
      ));
    } catch (error) {
      console.error('Error unpinning post:', error);
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
      // Check if already following
      const { data: existingFollow } = await supabase
        .from('follows')
        .select('id')
        .eq('follower_id', user.id)
        .eq('following_id', userId)
        .single();

      if (existingFollow) {
        // Unfollow
        await supabase
          .from('follows')
          .delete()
          .eq('follower_id', user.id)
          .eq('following_id', userId);
      } else {
        // Follow
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
      }

      loadAllUsers();
      loadFollowedUsers(); // Reload followed users
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

      loadAllUsers();
      loadFollowedUsers(); // Reload followed users
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

  const sendMessage = async (chatId: string, content: string, senderId: string, mediaUrl?: string) => {
    try {
      const encryptedContent = encryptData(content);
      
      const { data, error } = await supabase
        .from('messages')
        .insert({
          chat_id: chatId,
          sender_id: senderId,
          content: encryptedContent,
          is_encrypted: true,
          media_url: mediaUrl,
          read_by: [senderId]
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
        readBy: [senderId],
        mediaUrl: data.media_url
      };

      setChats(prev => prev.map(chat => 
        chat.id === chatId 
          ? { ...chat, lastMessage: message }
          : chat
      ));

      // Create notification for other participants
      const chat = chats.find(c => c.id === chatId);
      if (chat) {
        const otherParticipants = chat.participants.filter(p => p !== senderId);
        for (const participantId of otherParticipants) {
          await addNotification({
            type: 'message',
            userId: participantId,
            fromUserId: senderId,
            message: `${user?.displayName} sent you a message`,
            read: false
          });
        }
      }
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

    const filteredUsers = allUsers.filter(user => 
      user.username.toLowerCase().includes(lowerQuery) ||
      user.displayName.toLowerCase().includes(lowerQuery) ||
      user.writersTag.toLowerCase().includes(lowerQuery)
    );

    return { posts: filteredPosts, characters: filteredCharacters, users: filteredUsers };
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

    const recommendedWriters = allUsers
      .filter(writer => writer.id !== user.id)
      .slice(0, 5);

    return { writers: recommendedWriters, characters: recommendedCharacters };
  };

  const getFilteredPosts = (viewingAs?: Character | 'user') => {
    if (!user) return [];

    if (viewingAs === 'user') {
      // Show posts from users the main account follows + own posts
      return posts.filter(post => {
        if (post.userId === user.id) return true; // Own posts
        return followedUserIds.has(post.userId); // Posts from followed users
      });
    } else if (viewingAs) {
      // Show posts from accounts/characters this character follows + own posts
      return posts.filter(post => {
        if (post.userId === user.id) return true; // Own posts
        if (post.characterId && viewingAs.following.includes(post.characterId)) return true;
        return viewingAs.following.includes(post.userId);
      });
    }

    // Default: show all posts from followed accounts + own posts
    return posts.filter(post => {
      if (post.userId === user.id) return true;
      return followedUserIds.has(post.userId);
    });
  };

  const getUserFollowers = async (userId: string): Promise<User[]> => {
    try {
      const { data, error } = await supabase
        .from('follows')
        .select(`
          follower:profiles!follows_follower_id_fkey(*)
        `)
        .eq('following_id', userId);

      if (error) throw error;

      return data.map(follow => ({
        id: follow.follower.id,
        username: follow.follower.username,
        displayName: follow.follower.display_name,
        avatar: follow.follower.avatar_url,
        headerImage: follow.follower.header_image_url,
        bio: follow.follower.bio,
        writersTag: follow.follower.writers_tag,
        email: follow.follower.email,
        twoFactorEnabled: follow.follower.two_factor_enabled,
        characters: [],
        followers: follow.follower.followers || [],
        following: follow.follower.following || [],
        createdAt: new Date(follow.follower.created_at),
        role: follow.follower.role || 'user',
        privacySettings: {
          profileVisibility: 'public',
          messagePermissions: 'everyone',
          tagNotifications: true,
          directMessageNotifications: true
        }
      }));
    } catch (error) {
      console.error('Error loading user followers:', error);
      return [];
    }
  };

  const getUserFollowing = async (userId: string): Promise<User[]> => {
    try {
      const { data, error } = await supabase
        .from('follows')
        .select(`
          following:profiles!follows_following_id_fkey(*)
        `)
        .eq('follower_id', userId);

      if (error) throw error;

      return data.map(follow => ({
        id: follow.following.id,
        username: follow.following.username,
        displayName: follow.following.display_name,
        avatar: follow.following.avatar_url,
        headerImage: follow.following.header_image_url,
        bio: follow.following.bio,
        writersTag: follow.following.writers_tag,
        email: follow.following.email,
        twoFactorEnabled: follow.following.two_factor_enabled,
        characters: [],
        followers: follow.following.followers || [],
        following: follow.following.following || [],
        createdAt: new Date(follow.following.created_at),
        role: follow.following.role || 'user',
        privacySettings: {
          profileVisibility: 'public',
          messagePermissions: 'everyone',
          tagNotifications: true,
          directMessageNotifications: true
        }
      }));
    } catch (error) {
      console.error('Error loading user following:', error);
      return [];
    }
  };

  const getCharacterFollowers = async (characterId: string): Promise<User[]> => {
    const character = characters.find(c => c.id === characterId);
    if (!character) return [];

    const followers = allUsers.filter(user => character.followers.includes(user.id));
    return followers;
  };

  const getCharacterFollowing = async (characterId: string): Promise<(User | Character)[]> => {
    const character = characters.find(c => c.id === characterId);
    if (!character) return [];

    const following: (User | Character)[] = [];
    
    // Add followed users
    const followedUsers = allUsers.filter(user => character.following.includes(user.id));
    following.push(...followedUsers);
    
    // Add followed characters
    const followedCharacters = characters.filter(char => character.following.includes(char.id));
    following.push(...followedCharacters);
    
    return following;
  };

  const bookmarkPost = (postId: string) => {
    if (!user) return;
    const newBookmarks = [...bookmarkedPosts, postId];
    setBookmarkedPosts(newBookmarks);
    saveBookmarks('posts', newBookmarks);
  };

  const bookmarkCharacter = (characterId: string) => {
    if (!user) return;
    const newBookmarks = [...bookmarkedCharacters, characterId];
    setBookmarkedCharacters(newBookmarks);
    saveBookmarks('characters', newBookmarks);
  };

  const bookmarkUser = (userId: string) => {
    if (!user) return;
    const newBookmarks = [...bookmarkedUsers, userId];
    setBookmarkedUsers(newBookmarks);
    saveBookmarks('users', newBookmarks);
  };

  const unbookmarkPost = (postId: string) => {
    if (!user) return;
    const newBookmarks = bookmarkedPosts.filter(id => id !== postId);
    setBookmarkedPosts(newBookmarks);
    saveBookmarks('posts', newBookmarks);
  };

  const unbookmarkCharacter = (characterId: string) => {
    if (!user) return;
    const newBookmarks = bookmarkedCharacters.filter(id => id !== characterId);
    setBookmarkedCharacters(newBookmarks);
    saveBookmarks('characters', newBookmarks);
  };

  const unbookmarkUser = (userId: string) => {
    if (!user) return;
    const newBookmarks = bookmarkedUsers.filter(id => id !== userId);
    setBookmarkedUsers(newBookmarks);
    saveBookmarks('users', newBookmarks);
  };

  // Admin functions
  const getAllUsersAdmin = async (): Promise<User[]> => {
    if (!user || user.role !== 'admin') {
      throw new Error('Admin access required');
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data.map(profile => ({
        id: profile.id,
        username: profile.username,
        displayName: profile.display_name,
        avatar: profile.avatar_url || 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=350&h=350',
        headerImage: profile.header_image_url || 'https://images.pexels.com/photos/1323550/pexels-photo-1323550.jpeg?auto=compress&cs=tinysrgb&w=1500&h=500',
        bio: profile.bio || '',
        writersTag: profile.writers_tag,
        email: profile.email,
        twoFactorEnabled: profile.two_factor_enabled || false,
        characters: [],
        followers: profile.followers || [],
        following: profile.following || [],
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
      console.error('Error loading users for admin:', error);
      throw error;
    }
  };

  const deleteUserAdmin = async (userId: string): Promise<boolean> => {
    if (!user || user.role !== 'admin') {
      throw new Error('Admin access required');
    }

    try {
      const { error } = await supabase.rpc('admin_delete_user', {
        target_user_id: userId
      });

      if (error) throw error;

      // Refresh user list
      loadAllUsers();
      return true;
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  };

  const resetPasswordAdmin = async (userId: string, newPassword: string): Promise<boolean> => {
    if (!user || user.role !== 'admin') {
      throw new Error('Admin access required');
    }

    try {
      const { error } = await supabase.rpc('admin_reset_password', {
        target_user_id: userId,
        new_password: newPassword
      });

      if (error) throw error;

      return true;
    } catch (error) {
      console.error('Error resetting password:', error);
      throw error;
    }
  };

  return (
    <AppContext.Provider value={{
      characters,
      posts,
      notifications,
      chats,
      selectedCharacter,
      unreadNotifications,
      unreadMessages,
      allUsers,
      bookmarkedPosts,
      bookmarkedCharacters,
      bookmarkedUsers,
      followedUserIds,
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
      pinPost,
      unpinPost,
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
      getFilteredPosts,
      getUserFollowers,
      getUserFollowing,
      getCharacterFollowers,
      getCharacterFollowing,
      bookmarkPost,
      bookmarkCharacter,
      bookmarkUser,
      unbookmarkPost,
      unbookmarkCharacter,
      unbookmarkUser,
      getChatMessages,
      markMessagesAsRead,
      getAllUsersAdmin,
      deleteUserAdmin,
      resetPasswordAdmin
    }}>
      {children}
    </AppContext.Provider>
  );
};