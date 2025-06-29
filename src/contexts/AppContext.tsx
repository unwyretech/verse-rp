import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
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
  addPost: (postData: Partial<Post>) => void;
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
  
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => void;
  markNotificationAsRead: (notificationId: string) => void;
  clearAllNotifications: () => void;
  
  addComment: (postId: string, content: string, characterId?: string) => void;
  
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
  const [posts, setPosts] = useState<Post[]>([]);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [chats, setChats] = useState<Chat[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [bookmarkedPosts, setBookmarkedPosts] = useState<string[]>([]);
  const [bookmarkedCharacters, setBookmarkedCharacters] = useState<string[]>([]);
  const [bookmarkedUsers, setBookmarkedUsers] = useState<string[]>([]);
  const [selectedCharacter, setSelectedCharacterState] = useState<Character | null>(null);

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

  const unreadNotifications = notifications.filter(n => !n.read).length;
  const unreadMessages = chats.reduce((count, chat) => {
    if (chat.lastMessage && !chat.lastMessage.readBy.includes('current-user-id')) {
      return count + 1;
    }
    return count;
  }, 0);

  // Initialize with sample data
  useEffect(() => {
    initializeSampleData();
  }, []);

  const initializeSampleData = () => {
    // Sample users
    const sampleUsers: User[] = [
      {
        id: 'user-1',
        username: 'alexwriter',
        displayName: 'Alex Thompson',
        avatar: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=350&h=350',
        headerImage: 'https://images.pexels.com/photos/1323550/pexels-photo-1323550.jpeg?auto=compress&cs=tinysrgb&w=800&h=300',
        bio: 'Fantasy writer and world builder. Creating epic adventures one story at a time.',
        writersTag: 'fantasy',
        email: 'alex@example.com',
        twoFactorEnabled: false,
        characters: [],
        followers: [],
        following: [],
        createdAt: new Date('2024-01-15'),
        privacySettings: {
          profileVisibility: 'public',
          messagePermissions: 'everyone',
          tagNotifications: true,
          directMessageNotifications: true
        }
      },
      {
        id: 'user-2',
        username: 'scifimaster',
        displayName: 'Jordan Clarke',
        avatar: 'https://images.pexels.com/photos/1382734/pexels-photo-1382734.jpeg?auto=compress&cs=tinysrgb&w=350&h=350',
        headerImage: 'https://images.pexels.com/photos/1323550/pexels-photo-1323550.jpeg?auto=compress&cs=tinysrgb&w=800&h=300',
        bio: 'Science fiction enthusiast exploring the boundaries of imagination.',
        writersTag: 'scifi',
        email: 'jordan@example.com',
        twoFactorEnabled: true,
        characters: [],
        followers: [],
        following: [],
        createdAt: new Date('2024-02-01'),
        privacySettings: {
          profileVisibility: 'public',
          messagePermissions: 'followers',
          tagNotifications: true,
          directMessageNotifications: false
        }
      }
    ];

    // Sample characters
    const sampleCharacters: Character[] = [
      {
        id: 'char-1',
        username: 'aragorn_ranger',
        name: 'Aragorn',
        title: 'Ranger of the North',
        avatar: 'https://images.pexels.com/photos/1382734/pexels-photo-1382734.jpeg?auto=compress&cs=tinysrgb&w=350&h=350',
        headerImage: 'https://images.pexels.com/photos/1323550/pexels-photo-1323550.jpeg?auto=compress&cs=tinysrgb&w=800&h=300',
        bio: 'A skilled ranger and heir to the throne of Gondor, wandering the wild lands to protect the innocent.',
        universe: 'Middle-earth',
        verseTag: 'LOTR',
        traits: ['Brave', 'Noble', 'Skilled Fighter', 'Natural Leader'],
        userId: 'user-1',
        customColor: '#2d5a27',
        customFont: 'Cinzel',
        followers: [],
        following: [],
        createdAt: new Date('2024-01-20')
      },
      {
        id: 'char-2',
        username: 'spock_vulcan',
        name: 'Spock',
        title: 'Science Officer',
        avatar: 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=350&h=350',
        headerImage: 'https://images.pexels.com/photos/1323550/pexels-photo-1323550.jpeg?auto=compress&cs=tinysrgb&w=800&h=300',
        bio: 'Half-human, half-Vulcan officer aboard the USS Enterprise, dedicated to logic and scientific discovery.',
        universe: 'Star Trek',
        verseTag: 'StarTrek',
        traits: ['Logical', 'Intelligent', 'Loyal', 'Curious'],
        userId: 'user-2',
        customColor: '#1e3a8a',
        customFont: 'Orbitron',
        followers: [],
        following: [],
        createdAt: new Date('2024-02-05')
      }
    ];

    // Sample posts
    const samplePosts: Post[] = [
      {
        id: 'post-1',
        content: 'The path ahead is treacherous, but we must press on. The fate of Middle-earth depends on our courage. #LOTR #Adventure',
        characterId: 'char-1',
        character: sampleCharacters[0],
        userId: 'user-1',
        user: sampleUsers[0],
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
        likes: 15,
        reposts: 3,
        comments: 7,
        isLiked: false,
        isReposted: false,
        isThread: false,
        visibility: 'public',
        tags: ['LOTR', 'Adventure']
      },
      {
        id: 'post-2',
        content: 'Fascinating. The quantum mechanics of this universe continue to defy conventional understanding. Further analysis is required. #StarTrek #Science',
        characterId: 'char-2',
        character: sampleCharacters[1],
        userId: 'user-2',
        user: sampleUsers[1],
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
        likes: 22,
        reposts: 5,
        comments: 12,
        isLiked: true,
        isReposted: false,
        isThread: false,
        visibility: 'public',
        tags: ['StarTrek', 'Science']
      }
    ];

    setAllUsers(sampleUsers);
    setCharacters(sampleCharacters);
    setPosts(samplePosts);
  };

  // Post actions
  const addPost = (postData: Partial<Post>) => {
    const newPost: Post = {
      id: Date.now().toString(),
      content: postData.content || '',
      characterId: postData.characterId,
      character: postData.character,
      userId: postData.userId || '',
      user: postData.user,
      timestamp: new Date(),
      likes: 0,
      reposts: 0,
      comments: 0,
      isLiked: false,
      isReposted: false,
      isThread: postData.isThread || false,
      threadId: postData.threadId,
      parentPostId: postData.parentPostId,
      visibility: postData.visibility || 'public',
      tags: postData.tags || [],
      mediaUrls: postData.mediaUrls || []
    };

    setPosts(prev => [newPost, ...prev]);
  };

  const updatePost = (postId: string, updates: Partial<Post>) => {
    setPosts(prev => prev.map(post => 
      post.id === postId ? { ...post, ...updates } : post
    ));
  };

  const deletePost = (postId: string) => {
    setPosts(prev => prev.filter(post => post.id !== postId));
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
  const addCharacter = (character: Character) => {
    setCharacters(prev => [...prev, character]);
  };

  const updateCharacter = (characterId: string, updates: Partial<Character>) => {
    setCharacters(prev => prev.map(char => 
      char.id === characterId ? { ...char, ...updates } : char
    ));
  };

  const deleteCharacter = (characterId: string) => {
    setCharacters(prev => prev.filter(char => char.id !== characterId));
    // Clear selected character if it was deleted
    if (selectedCharacter?.id === characterId) {
      setSelectedCharacter(null);
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

  // User actions
  const followUser = (userId: string) => {
    // Implementation for following users
    console.log('Following user:', userId);
  };

  const unfollowUser = (userId: string) => {
    // Implementation for unfollowing users
    console.log('Unfollowing user:', userId);
  };

  const bookmarkUser = (userId: string) => {
    setBookmarkedUsers(prev => [...prev, userId]);
  };

  const unbookmarkUser = (userId: string) => {
    setBookmarkedUsers(prev => prev.filter(id => id !== userId));
  };

  // Chat actions
  const sendMessage = async (chatId: string, content: string, senderId: string, mediaUrl?: string): Promise<void> => {
    const newMessage: Message = {
      id: Date.now().toString(),
      content,
      senderId,
      chatId,
      timestamp: new Date(),
      isEncrypted: true,
      readBy: [senderId],
      mediaUrl
    };

    // Update chat with last message
    setChats(prev => prev.map(chat => 
      chat.id === chatId ? { ...chat, lastMessage: newMessage } : chat
    ));
  };

  const createChat = async (participantIds: string[], isGroup: boolean, name?: string): Promise<Chat> => {
    const newChat: Chat = {
      id: Date.now().toString(),
      participants: participantIds,
      isGroup,
      name,
      createdAt: new Date(),
      isEncrypted: true
    };

    setChats(prev => [...prev, newChat]);
    return newChat;
  };

  const getChatMessages = async (chatId: string): Promise<Message[]> => {
    // Mock implementation - in real app, this would fetch from database
    return [];
  };

  const markMessagesAsRead = async (chatId: string): Promise<void> => {
    // Mock implementation
    console.log('Marking messages as read for chat:', chatId);
  };

  const deleteChatForUser = async (chatId: string, userId: string): Promise<void> => {
    // Remove chat from user's view
    setChats(prev => prev.filter(chat => chat.id !== chatId));
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

  const markNotificationAsRead = (notificationId: string) => {
    setNotifications(prev => prev.map(notification => 
      notification.id === notificationId ? { ...notification, read: true } : notification
    ));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  // Comment actions
  const addComment = (postId: string, content: string, characterId?: string) => {
    setPosts(prev => prev.map(post => 
      post.id === postId ? { ...post, comments: post.comments + 1 } : post
    ));
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
    setAllUsers(prev => prev.filter(user => user.id !== userId));
  };

  const resetPasswordAdmin = async (userId: string, newPassword: string): Promise<void> => {
    console.log('Resetting password for user:', userId);
  };

  const updateUserRoleAdmin = async (userId: string, role: 'user' | 'admin'): Promise<void> => {
    setAllUsers(prev => prev.map(user => 
      user.id === userId ? { ...user, role } : user
    ));
  };

  // Relationship functions
  const getUserFollowers = async (userId: string): Promise<User[]> => {
    return [];
  };

  const getUserFollowing = async (userId: string): Promise<User[]> => {
    return [];
  };

  const getCharacterFollowers = async (characterId: string): Promise<User[]> => {
    return [];
  };

  const getCharacterFollowing = async (characterId: string): Promise<(User | Character)[]> => {
    return [];
  };

  const getPostComments = async (postId: string): Promise<any[]> => {
    return [];
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