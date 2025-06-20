import React from 'react';
import { Bell, Heart, Repeat2, MessageCircle, UserPlus, AtSign, X, Archive, Check } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { Notification } from '../types';
import SwipeableItem from '../components/SwipeableItem';

const NotificationsPage: React.FC = () => {
  const { notifications, markNotificationAsRead, clearAllNotifications } = useApp();

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'like': return <Heart className="w-5 h-5 text-red-400" />;
      case 'repost': return <Repeat2 className="w-5 h-5 text-green-400" />;
      case 'comment': return <MessageCircle className="w-5 h-5 text-blue-400" />;
      case 'follow': return <UserPlus className="w-5 h-5 text-purple-400" />;
      case 'mention': return <AtSign className="w-5 h-5 text-yellow-400" />;
      case 'message': return <MessageCircle className="w-5 h-5 text-pink-400" />;
      default: return <Bell className="w-5 h-5 text-gray-400" />;
    }
  };

  const getNotificationText = (notification: Notification) => {
    switch (notification.type) {
      case 'like': return 'liked your post';
      case 'repost': return 'reposted your post';
      case 'comment': return 'commented on your post';
      case 'follow': return 'started following you';
      case 'mention': return 'mentioned you in a post';
      case 'message': return 'sent you a message';
      default: return 'interacted with your content';
    }
  };

  const handleMarkAsRead = (id: string) => {
    markNotificationAsRead(id);
  };

  const handleArchive = (id: string) => {
    // In a real app, this would archive the notification
    console.log('Archive notification:', id);
  };

  const handleDelete = (id: string) => {
    // In a real app, this would delete the notification
    console.log('Delete notification:', id);
  };

  return (
    <div className="min-h-screen bg-black/10 backdrop-blur-sm">
      <div className="sticky top-0 bg-black/80 backdrop-blur-md border-b border-gray-700/50 p-4 z-10">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">Notifications</h2>
            <p className="text-gray-400 text-sm">Stay updated with your community</p>
          </div>
          {notifications.length > 0 && (
            <button
              onClick={clearAllNotifications}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors text-gray-300 hover:text-white"
            >
              <X className="w-4 h-4" />
              <span>Clear All</span>
            </button>
          )}
        </div>
      </div>

      <div className="divide-y divide-gray-700/30">
        {notifications.length === 0 ? (
          <div className="p-12 text-center">
            <Bell className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-400 mb-2">No notifications yet</h3>
            <p className="text-gray-500">When someone interacts with your content, you'll see it here.</p>
          </div>
        ) : (
          notifications.map((notification) => (
            <SwipeableItem
              key={notification.id}
              onSwipeLeft={() => handleArchive(notification.id)}
              onSwipeRight={() => handleDelete(notification.id)}
              leftAction={{
                icon: <Archive className="w-5 h-5" />,
                color: 'bg-blue-500',
                label: 'Archive'
              }}
              rightAction={{
                icon: <X className="w-5 h-5" />,
                color: 'bg-red-500',
                label: 'Delete'
              }}
            >
              <div
                onClick={() => handleMarkAsRead(notification.id)}
                className={`p-6 hover:bg-gray-800/20 transition-colors cursor-pointer ${
                  !notification.read ? 'bg-purple-900/10 border-l-4 border-purple-500' : ''
                }`}
              >
                <div className="flex space-x-4">
                  <div className="flex-shrink-0">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      {notification.fromUser && (
                        <img
                          src={notification.fromUser.avatar}
                          alt={notification.fromUser.displayName}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      )}
                      <div className="flex-1">
                        <p className="text-white">
                          <span className="font-semibold">
                            {notification.fromUser?.displayName || 'Someone'}
                          </span>{' '}
                          <span className="text-gray-300">
                            {getNotificationText(notification)}
                          </span>
                        </p>
                        <p className="text-gray-500 text-sm">
                          {notification.timestamp.toLocaleString()}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        {!notification.read && (
                          <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMarkAsRead(notification.id);
                          }}
                          className="p-1 text-gray-400 hover:text-green-400 transition-colors"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    {notification.message && (
                      <p className="text-gray-400 text-sm mt-2 bg-gray-800/30 rounded-lg p-3">
                        {notification.message}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </SwipeableItem>
          ))
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;