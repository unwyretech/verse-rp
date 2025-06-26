import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Search, Bell, Mail, Bookmark, User, Settings, Feather, Plus, Menu, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface SidebarProps {
  unreadNotifications: number;
  isOpen?: boolean;
  onToggle?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ unreadNotifications, isOpen = true, onToggle }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const menuItems = [
    { icon: Home, label: 'Home', path: '/' },
    { icon: Search, label: 'Explore', path: '/explore' },
    { icon: Bell, label: 'Notifications', path: '/notifications', badge: unreadNotifications },
    { icon: Mail, label: 'Messages', path: '/messages' },
    { icon: Bookmark, label: 'Bookmarks', path: '/bookmarks' },
    { icon: User, label: 'Profile', path: '/profile' },
    { icon: Settings, label: 'Settings', path: '/settings' },
  ];

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={onToggle}
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-gray-900 rounded-full border border-gray-700"
      >
        {isOpen ? <X className="w-6 h-6 text-white" /> : <Menu className="w-6 h-6 text-white" />}
      </button>

      {/* Sidebar */}
      <div className={`
        fixed md:sticky top-0 left-0 h-screen bg-black/20 backdrop-blur-sm border-r border-gray-700/50 z-40
        transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0 w-64 md:w-64
      `}>
        <div className="p-6 space-y-8">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
              <Feather className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold text-white">VERSE</h1>
          </div>

          <nav className="space-y-2">
            {menuItems.map((item) => (
              <button
                key={item.label}
                onClick={() => {
                  navigate(item.path);
                  if (onToggle && window.innerWidth < 768) onToggle();
                }}
                className={`w-full flex items-center space-x-4 px-4 py-3 rounded-xl transition-all duration-200 relative ${
                  location.pathname === item.path
                    ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30'
                    : 'text-gray-300 hover:bg-gray-800/50 hover:text-white'
                }`}
              >
                <item.icon className="w-6 h-6" />
                <span className="font-medium">{item.label}</span>
                {item.badge && item.badge > 0 && (
                  <span className="absolute right-3 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                )}
              </button>
            ))}
          </nav>

          <button
            onClick={() => {
              navigate('/');
              if (onToggle && window.innerWidth < 768) onToggle();
            }}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold py-4 rounded-xl hover:from-purple-700 hover:to-pink-700 transition-all duration-200 flex items-center justify-center space-x-2 shadow-lg hover:shadow-purple-500/25"
          >
            <Plus className="w-5 h-5" />
            <span>Create Post</span>
          </button>

          <div className="pt-8 border-t border-gray-700/50">
            <div className="flex items-center space-x-3 p-3 rounded-xl hover:bg-gray-800/50 transition-colors cursor-pointer group">
              <img
                src={user?.avatar}
                alt={user?.displayName}
                className="w-12 h-12 rounded-full object-cover ring-2 ring-purple-500/30"
              />
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium truncate">{user?.displayName}</p>
                <p className="text-gray-400 text-sm truncate">@{user?.username}</p>
              </div>
              <button
                onClick={logout}
                className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-400 transition-all duration-200 text-sm"
              >
                Logout
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-4 text-center border-t border-gray-700/50 bg-black/20">
          <p className="text-gray-500 text-xs">
            Verse © {new Date().getFullYear()} - UNWYRE TECH AND CONSULTING
          </p>
        </div>
      </div>

      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/50 z-30"
          onClick={onToggle}
        />
      )}
    </>
  );
};

export default Sidebar;