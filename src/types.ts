export interface User {
  id: string;
  username: string;
  displayName: string;
  avatar: string;
  headerImage: string;
  bio: string;
  writersTag: string;
  email?: string;
  twoFactorEnabled: boolean;
  characters: string[];
  followers: string[];
  following: string[];
  createdAt: Date;
  privacySettings: PrivacySettings;
  role?: 'user' | 'admin';
}

export interface PrivacySettings {
  profileVisibility: 'public' | 'followers' | 'private';
  messagePermissions: 'everyone' | 'followers' | 'none';
  tagNotifications: boolean;
  directMessageNotifications: boolean;
}

export interface Character {
  id: string;
  username: string;
  name: string;
  title: string;
  avatar: string;
  headerImage: string;
  bio: string;
  universe: string;
  verseTag: string;
  traits: string[];
  userId: string;
  customColor: string;
  customFont: string;
  followers: string[];
  following: string[];
  createdAt: Date;
}

export interface Post {
  id: string;
  content: string;
  characterId?: string;
  character?: Character;
  userId: string;
  user?: User;
  timestamp: Date;
  likes: number;
  reposts: number;
  comments: number;
  isLiked: boolean;
  isReposted: boolean;
  isPinned?: boolean;
  isThread: boolean;
  threadId?: string;
  parentPostId?: string;
  visibility: 'public' | 'followers' | 'private';
  tags: string[];
  mediaUrls?: string[];
  replies?: Reply[];
}

export interface Reply {
  id: string;
  content: string;
  userId: string;
  characterId?: string;
  timestamp: Date;
  user?: User;
  character?: Character;
}

export interface Thread {
  id: string;
  title: string;
  posts: Post[];
  createdBy: string;
  visibility: 'public' | 'character';
  characterTag?: string;
  createdAt: Date;
}

export interface Message {
  id: string;
  content: string;
  senderId: string;
  receiverId?: string;
  chatId: string;
  timestamp: Date;
  isEncrypted: boolean;
  readBy: string[];
  mediaUrl?: string;
}

export interface Chat {
  id: string;
  participants: string[];
  isGroup: boolean;
  name?: string;
  avatar?: string;
  lastMessage?: Message;
  createdAt: Date;
  isEncrypted: boolean;
}

export interface Notification {
  id: string;
  type: 'like' | 'repost' | 'comment' | 'follow' | 'mention' | 'message';
  userId: string;
  fromUserId: string;
  fromUser?: User;
  postId?: string;
  message?: string;
  timestamp: Date;
  read: boolean;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  loading: boolean;
}