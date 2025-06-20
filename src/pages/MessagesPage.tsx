import React, { useState } from 'react';
import { Search, Plus, Send, Lock, Users, MoreHorizontal, Archive, Trash2 } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { useAuth } from '../contexts/AuthContext';
import { Chat, Message } from '../types';
import SwipeableItem from '../components/SwipeableItem';

const MessagesPage: React.FC = () => {
  const { chats, sendMessage, createChat } = useApp();
  const { user } = useAuth();
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [messageText, setMessageText] = useState('');
  const [showNewChat, setShowNewChat] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (messageText.trim() && selectedChat && user) {
      sendMessage(selectedChat.id, messageText.trim(), user.id);
      setMessageText('');
    }
  };

  const handleCreateChat = (participants: string[], isGroup = false, name?: string) => {
    const newChat = createChat(participants, isGroup, name);
    setSelectedChat(newChat);
    setShowNewChat(false);
  };

  const handleArchiveChat = (chatId: string) => {
    console.log('Archive chat:', chatId);
    // In a real app, this would archive the chat
  };

  const handleDeleteChat = (chatId: string) => {
    console.log('Delete chat:', chatId);
    // In a real app, this would delete the chat
  };

  const filteredChats = chats.filter(chat =>
    chat.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    chat.participants.some(p => p.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-black/10 backdrop-blur-sm flex">
      {/* Chat List */}
      <div className="w-80 border-r border-gray-700/50 bg-black/20">
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
                      <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                        {chat.isGroup ? (
                          <Users className="w-6 h-6 text-white" />
                        ) : (
                          <span className="text-white font-semibold">
                            {chat.name?.[0] || 'U'}
                          </span>
                        )}
                      </div>
                      {chat.isEncrypted && (
                        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                          <Lock className="w-2 h-2 text-white" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium truncate">
                        {chat.name || `Chat ${chat.id.slice(0, 8)}`}
                      </p>
                      <p className="text-gray-400 text-sm truncate">
                        {chat.lastMessage?.content || 'No messages yet'}
                      </p>
                    </div>
                  </div>
                </button>
              </SwipeableItem>
            ))
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedChat ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-gray-700/50 bg-black/20">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                    {selectedChat.isGroup ? (
                      <Users className="w-5 h-5 text-white" />
                    ) : (
                      <span className="text-white font-semibold">
                        {selectedChat.name?.[0] || 'U'}
                      </span>
                    )}
                  </div>
                  <div>
                    <h3 className="text-white font-semibold">
                      {selectedChat.name || `Chat ${selectedChat.id.slice(0, 8)}`}
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
              {/* Mock messages for demonstration */}
              <div className="flex justify-start">
                <div className="max-w-xs bg-gray-800 rounded-2xl rounded-bl-md p-3">
                  <p className="text-white text-sm">Hey! How's your latest character development going?</p>
                  <p className="text-gray-400 text-xs mt-1">2:30 PM</p>
                </div>
              </div>
              <div className="flex justify-end">
                <div className="max-w-xs bg-purple-600 rounded-2xl rounded-br-md p-3">
                  <p className="text-white text-sm">Great! Just finished writing a backstory for my new cyberpunk detective. Want to see?</p>
                  <p className="text-purple-200 text-xs mt-1">2:32 PM</p>
                </div>
              </div>
              <div className="flex justify-start">
                <div className="max-w-xs bg-gray-800 rounded-2xl rounded-bl-md p-3">
                  <p className="text-white text-sm">Absolutely! I love cyberpunk settings. What's their specialty?</p>
                  <p className="text-gray-400 text-xs mt-1">2:35 PM</p>
                </div>
              </div>
            </div>

            {/* Message Input */}
            <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-700/50 bg-black/20">
              <div className="flex items-center space-x-3">
                <input
                  type="text"
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 bg-gray-800 border border-gray-600 rounded-full px-4 py-2 text-white focus:border-purple-500 focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={!messageText.trim()}
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

      {/* New Chat Modal */}
      {showNewChat && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-2xl border border-gray-700/50 w-full max-w-md mx-4">
            <div className="p-6">
              <h3 className="text-lg font-bold text-white mb-4">Start New Conversation</h3>
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Search users..."
                  className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white focus:border-purple-500 focus:outline-none"
                />
                <div className="flex space-x-3">
                  <button
                    onClick={() => handleCreateChat(['mock-user-2'], false)}
                    className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 rounded-lg transition-colors"
                  >
                    Direct Message
                  </button>
                  <button
                    onClick={() => handleCreateChat(['mock-user-2', 'mock-user-3'], true, 'New Group')}
                    className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-semibold py-3 rounded-lg transition-colors"
                  >
                    Group Chat
                  </button>
                </div>
              </div>
              <div className="flex justify-end mt-6">
                <button
                  onClick={() => setShowNewChat(false)}
                  className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MessagesPage;