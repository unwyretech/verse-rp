import React, { useState, useEffect } from 'react';
import { Search, Plus, Send, Lock, Users, MoreHorizontal, Archive, Trash2, Image, Video, Upload, X, ArrowLeft, Menu } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { useAuth } from '../contexts/AuthContext';
import { Chat, Message } from '../types';
import SwipeableItem from '../components/SwipeableItem';
import { uploadImage } from '../lib/supabase';

const MessagesPage: React.FC = () => {
  const { chats, sendMessage, createChat, allUsers, getChatMessages, markMessagesAsRead, deleteChatForUser } = useApp();
  const { user } = useAuth();
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [messageText, setMessageText] = useState('');
  const [showNewChat, setShowNewChat] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [chatName, setChatName] = useState('');
  const [isGroupChat, setIsGroupChat] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const [chatList, setChatList] = useState<Chat[]>([]);

  // Real-time refresh intervals - every 1 second
  useEffect(() => {
    const refreshData = () => {
      // Refresh chat list and message previews
      setChatList([...chats]);
      
      // Refresh messages for selected chat
      if (selectedChat) {
        loadMessages(selectedChat.id);
      }
    };

    // Initial load
    refreshData();

    // Set up interval for real-time updates every 1 second
    const interval = setInterval(refreshData, 1000);

    return () => clearInterval(interval);
  }, [chats, selectedChat]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Load messages for selected chat
  useEffect(() => {
    if (selectedChat) {
      loadMessages(selectedChat.id);
      markMessagesAsRead(selectedChat.id);
    }
  }, [selectedChat]);

  const loadMessages = async (chatId: string) => {
    const chatMessages = await getChatMessages(chatId);
    setMessages(chatMessages);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (messageText.trim() && selectedChat && user) {
      await sendMessage(selectedChat.id, messageText.trim(), user.id);
      
      // Add message to local state immediately for better UX
      const newMessage: Message = {
        id: Date.now().toString(),
        content: messageText.trim(),
        senderId: user.id,
        chatId: selectedChat.id,
        timestamp: new Date(),
        isEncrypted: true,
        readBy: [user.id]
      };
      
      setMessages(prev => [...prev, newMessage]);
      setMessageText('');
    }
  };

  const handleCreateChat = async () => {
    if (selectedUsers.length === 0) return;
    
    try {
      const newChat = await createChat(selectedUsers, isGroupChat, chatName || undefined);
      setSelectedChat(newChat);
      setShowNewChat(false);
      setSelectedUsers([]);
      setChatName('');
      setIsGroupChat(false);
    } catch (error) {
      console.error('Error creating chat:', error);
    }
  };

  const handleArchiveChat = (chatId: string) => {
    console.log('Archive chat:', chatId);
    // In a real app, this would archive the chat
  };

  const handleDeleteChat = (chatId: string) => {
    setShowDeleteConfirm(chatId);
  };

  const confirmDeleteChat = async (chatId: string) => {
    if (user) {
      // Delete chat only for the current user
      await deleteChatForUser(chatId, user.id);
      setShowDeleteConfirm(null);
      if (selectedChat?.id === chatId) {
        setSelectedChat(null);
      }
    }
  };

  const handleFileUpload = async (file: File, type: 'image' | 'video') => {
    if (!user || !selectedChat) return;

    setUploading(true);
    try {
      const bucket = type === 'image' ? 'message-images' : 'message-videos';
      const path = `${user.id}/${type}_${Date.now()}.${file.name.split('.').pop()}`;
      
      const mediaUrl = await uploadImage(file, bucket, path);
      if (mediaUrl) {
        await sendMessage(selectedChat.id, `Sent ${type === 'image' ? 'an image' : 'a video'}`, user.id, mediaUrl);
        loadMessages(selectedChat.id);
      } else {
        alert('Failed to upload file');
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  const handleImageUpload = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) handleFileUpload(file, 'image');
    };
    input.click();
  };

  const handleVideoUpload = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'video/*';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) handleFileUpload(file, 'video');
    };
    input.click();
  };

  const filteredChats = chatList.filter(chat =>
    chat.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    chat.participants.some(p => {
      const participant = allUsers.find(u => u.id === p);
      return participant?.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
             participant?.username.toLowerCase().includes(searchQuery.toLowerCase());
    })
  );

  const availableUsers = allUsers.filter(u => u.id !== user?.id);

  const getChatDisplayName = (chat: Chat) => {
    if (chat.name) return chat.name;
    
    const otherParticipants = chat.participants.filter(p => p !== user?.id);
    if (otherParticipants.length === 1) {
      const participant = allUsers.find(u => u.id === otherParticipants[0]);
      return participant?.displayName || 'Unknown User';
    }
    
    return `Group Chat (${chat.participants.length} members)`;
  };

  const getChatAvatar = (chat: Chat) => {
    if (chat.isGroup) {
      return 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=350&h=350';
    }
    
    const otherParticipants = chat.participants.filter(p => p !== user?.id);
    if (otherParticipants.length === 1) {
      const participant = allUsers.find(u => u.id === otherParticipants[0]);
      return participant?.avatar || 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=350&h=350';
    }
    
    return 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=350&h=350';
  };

  // Get sender information for message display
  const getSenderInfo = (senderId: string) => {
    const sender = allUsers.find(u => u.id === senderId);
    return {
      name: sender?.displayName || 'Unknown User',
      avatar: sender?.avatar || 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=350&h=350'
    };
  };

  // Check if message is from current user
  const isOwnMessage = (senderId: string) => senderId === user?.id;

  // Check if we should show sender name (for group chats and non-consecutive messages)
  const shouldShowSenderName = (message: Message, index: number) => {
    if (!selectedChat?.isGroup) return false;
    if (isOwnMessage(message.senderId)) return false;
    
    // Show name if it's the first message or if previous message is from different sender
    if (index === 0) return true;
    const prevMessage = messages[index - 1];
    return prevMessage.senderId !== message.senderId;
  };

  return (
    <>
      {/* Custom Mobile Menu Button - Only show when chat is NOT selected */}
      {isMobile && !selectedChat && (
        <button
          onClick={() => setShowMobileSidebar(!showMobileSidebar)}
          className="fixed top-4 left-4 z-50 p-2 bg-gray-900 rounded-full border border-gray-700"
        >
          {showMobileSidebar ? <X className="w-6 h-6 text-white" /> : <Menu className="w-6 h-6 text-white" />}
        </button>
      )}

      <div className="min-h-screen bg-black/10 backdrop-blur-sm flex relative">
        {/* Chat List - Hidden when chat is selected on mobile */}
        <div className={`${isMobile ? (selectedChat ? 'hidden' : 'w-full') : 'w-80'} border-r border-gray-700/50 bg-black/20 ${isMobile ? 'absolute inset-0 z-10' : ''}`}>
          <div className="p-4 border-b border-gray-700/50">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">Messages</h2>
              <button
                onClick={() => setShowNewChat(true)}
                className="p-2 bg-purple-600 hover:bg-purple-700 rounded-full transition-colors"
              >
                <Plus className="w-5 h-5 text-white" />
              </button>
            </div>
            
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search conversations..."
                className="w-full bg-gray-800 border border-gray-600 rounded-full pl-9 pr-4 py-2 text-white text-sm focus:border-purple-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="overflow-y-auto">
            {filteredChats.length === 0 ? (
              <div className="p-6 text-center">
                <Users className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400">No conversations yet</p>
                <p className="text-gray-500 text-sm">Start a new chat to connect with other writers</p>
              </div>
            ) : (
              filteredChats.map((chat) => (
                <SwipeableItem
                  key={chat.id}
                  onSwipeLeft={() => handleArchiveChat(chat.id)}
                  onSwipeRight={() => handleDeleteChat(chat.id)}
                  leftAction={{
                    icon: <Archive className="w-5 h-5" />,
                    color: 'bg-blue-500',
                    label: 'Archive'
                  }}
                  rightAction={{
                    icon: <Trash2 className="w-5 h-5" />,
                    color: 'bg-red-500',
                    label: 'Delete'
                  }}
                >
                  <button
                    onClick={() => setSelectedChat(chat)}
                    className={`w-full p-4 text-left hover:bg-gray-800/30 transition-colors border-b border-gray-700/20 ${
                      selectedChat?.id === chat.id ? 'bg-purple-900/20' : ''
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        <img
                          src={getChatAvatar(chat)}
                          alt="Chat avatar"
                          className="w-12 h-12 rounded-full object-cover"
                        />
                        {chat.isEncrypted && (
                          <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                            <Lock className="w-2 h-2 text-white" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-medium truncate">
                          {getChatDisplayName(chat)}
                        </p>
                        <p className="text-gray-400 text-sm truncate">
                          {chat.lastMessage?.content || 'No messages yet'}
                        </p>
                      </div>
                      {chat.lastMessage && !chat.lastMessage.readBy.includes(user?.id || '') && (
                        <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                      )}
                    </div>
                  </button>
                </SwipeableItem>
              ))
            )}
          </div>
        </div>

        {/* Chat Area - Full screen on mobile when chat is selected */}
        <div className={`flex-1 flex flex-col ${isMobile && selectedChat ? 'absolute inset-0 z-20 bg-gray-900' : ''}`}>
          {selectedChat ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-gray-700/50 bg-black/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {isMobile && (
                      <button
                        onClick={() => setSelectedChat(null)}
                        className="p-2 text-gray-400 hover:text-white transition-colors"
                      >
                        <ArrowLeft className="w-5 h-5" />
                      </button>
                    )}
                    <img
                      src={getChatAvatar(selectedChat)}
                      alt="Chat avatar"
                      className="w-10 h-10 rounded-full object-cover"
                    />
                    <div>
                      <h3 className="text-white font-semibold">
                        {getChatDisplayName(selectedChat)}
                      </h3>
                      <div className="flex items-center space-x-2">
                        {selectedChat.isEncrypted && (
                          <div className="flex items-center space-x-1 text-green-400 text-xs">
                            <Lock className="w-3 h-3" />
                            <span>Encrypted</span>
                          </div>
                        )}
                        <span className="text-gray-400 text-sm">
                          {selectedChat.participants.length} participants
                        </span>
                      </div>
                    </div>
                  </div>
                  <button className="p-2 text-gray-400 hover:text-white transition-colors">
                    <MoreHorizontal className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((message, index) => {
                  const senderInfo = getSenderInfo(message.senderId);
                  const isOwn = isOwnMessage(message.senderId);
                  const showSenderName = shouldShowSenderName(message, index);

                  return (
                    <div key={message.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-xs ${isOwn ? 'order-2' : 'order-1'}`}>
                        {/* Sender name for group chats */}
                        {showSenderName && (
                          <div className="flex items-center space-x-2 mb-1 px-3">
                            <img
                              src={senderInfo.avatar}
                              alt={senderInfo.name}
                              className="w-4 h-4 rounded-full object-cover"
                            />
                            <span className="text-xs text-gray-400 font-medium">
                              {senderInfo.name}
                            </span>
                          </div>
                        )}
                        
                        {/* Message bubble */}
                        <div className={`rounded-2xl p-3 ${
                          isOwn 
                            ? 'bg-purple-600 rounded-br-md' 
                            : 'bg-gray-800 rounded-bl-md'
                        }`}>
                          {message.mediaUrl && (
                            <div className="mb-2">
                              {message.mediaUrl.includes('.mp4') || message.mediaUrl.includes('.mov') || message.mediaUrl.includes('.avi') ? (
                                <video
                                  src={message.mediaUrl}
                                  className="w-full max-w-xs rounded-lg"
                                  controls
                                />
                              ) : (
                                <img
                                  src={message.mediaUrl}
                                  alt="Shared media"
                                  className="w-full max-w-xs rounded-lg"
                                />
                              )}
                            </div>
                          )}
                          <p className="text-white text-sm">{message.content}</p>
                          <p className={`text-xs mt-1 ${
                            isOwn ? 'text-purple-200' : 'text-gray-400'
                          }`}>
                            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Message Input */}
              <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-700/50 bg-black/20">
                <div className="flex items-center space-x-3">
                  <button
                    type="button"
                    onClick={handleImageUpload}
                    disabled={uploading}
                    className="p-2 text-gray-400 hover:text-purple-400 transition-colors disabled:opacity-50"
                  >
                    {uploading ? <Upload className="w-5 h-5 animate-spin" /> : <Image className="w-5 h-5" />}
                  </button>
                  <button
                    type="button"
                    onClick={handleVideoUpload}
                    disabled={uploading}
                    className="p-2 text-gray-400 hover:text-purple-400 transition-colors disabled:opacity-50"
                  >
                    <Video className="w-5 h-5" />
                  </button>
                  <input
                    type="text"
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 bg-gray-800 border border-gray-600 rounded-full px-4 py-2 text-white focus:border-purple-500 focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={!messageText.trim() || uploading}
                    className="p-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-full transition-colors"
                  >
                    <Send className="w-5 h-5 text-white" />
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <Users className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-400 mb-2">Select a conversation</h3>
                <p className="text-gray-500">Choose from your existing conversations or start a new one</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-2xl border border-gray-700/50 p-6 mx-4 max-w-sm w-full">
            <h3 className="text-lg font-bold text-white mb-4">Delete Conversation</h3>
            <p className="text-gray-300 mb-6">
              Are you sure you want to delete this conversation? This will only remove it from your view. 
              Other participants will still be able to see the conversation.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => confirmDeleteChat(showDeleteConfirm)}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-2 rounded-lg transition-colors"
              >
                Delete for Me
              </button>
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Chat Modal */}
      {showNewChat && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-2xl border border-gray-700/50 w-full max-w-md mx-4 max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-white">Start New Conversation</h3>
                <button
                  onClick={() => setShowNewChat(false)}
                  className="p-2 text-gray-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center space-x-2 mb-4">
                  <input
                    type="checkbox"
                    id="groupChat"
                    checked={isGroupChat}
                    onChange={(e) => setIsGroupChat(e.target.checked)}
                    className="text-purple-600 focus:ring-purple-500 rounded"
                  />
                  <label htmlFor="groupChat" className="text-white text-sm">Create group chat</label>
                </div>

                {isGroupChat && (
                  <input
                    type="text"
                    value={chatName}
                    onChange={(e) => setChatName(e.target.value)}
                    placeholder="Group name (optional)"
                    className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white focus:border-purple-500 focus:outline-none"
                  />
                )}

                <div>
                  <p className="text-white text-sm mb-2">Select users:</p>
                  <div className="max-h-48 overflow-y-auto space-y-2">
                    {availableUsers.map(availableUser => (
                      <label key={availableUser.id} className="flex items-center space-x-3 p-2 hover:bg-gray-800 rounded-lg cursor-pointer">
                        <input
                          type={isGroupChat ? "checkbox" : "radio"}
                          name="selectedUsers"
                          value={availableUser.id}
                          checked={selectedUsers.includes(availableUser.id)}
                          onChange={(e) => {
                            if (isGroupChat) {
                              if (e.target.checked) {
                                setSelectedUsers(prev => [...prev, availableUser.id]);
                              } else {
                                setSelectedUsers(prev => prev.filter(id => id !== availableUser.id));
                              }
                            } else {
                              setSelectedUsers([availableUser.id]);
                            }
                          }}
                          className="text-purple-600 focus:ring-purple-500"
                        />
                        <img
                          src={availableUser.avatar}
                          alt={availableUser.displayName}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                        <div>
                          <p className="text-white text-sm">{availableUser.displayName}</p>
                          <p className="text-gray-400 text-xs">@{availableUser.username}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    onClick={handleCreateChat}
                    disabled={selectedUsers.length === 0}
                    className="flex-1 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg transition-colors"
                  >
                    Create Chat
                  </button>
                  <button
                    onClick={() => {
                      setShowNewChat(false);
                      setSelectedUsers([]);
                      setChatName('');
                      setIsGroupChat(false);
                    }}
                    className="px-6 py-3 text-gray-400 hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default MessagesPage;