import React, { useState } from 'react';
import { Plus, ChevronDown } from 'lucide-react';
import PostCard from './PostCard';
import { Post, Character } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { useApp } from '../contexts/AppContext';

interface TimelineProps {
  posts: Post[];
  onLike: (postId: string) => void;
  onRepost: (postId: string) => void;
  onCreatePost: () => void;
}

const Timeline: React.FC<TimelineProps> = ({ posts, onLike, onRepost, onCreatePost }) => {
  const { user } = useAuth();
  const { characters, getFilteredPosts } = useApp();
  const [viewingAs, setViewingAs] = useState<Character | 'user' | null>('user');
  const [showDropdown, setShowDropdown] = useState(false);

  // Only show user's own characters
  const userCharacters = characters.filter(char => char.userId === user?.id);

  // Get filtered posts based on selected viewing mode
  const filteredPosts = getFilteredPosts(viewingAs || 'user');

  const handleViewingChange = (option: Character | 'user') => {
    setViewingAs(option);
    setShowDropdown(false);
  };

  const getDisplayName = () => {
    if (viewingAs === 'user') return 'Main Account';
    if (viewingAs && typeof viewingAs === 'object') return viewingAs.name;
    return 'Main Account';
  };

  const getDisplayAvatar = () => {
    if (viewingAs === 'user') return user?.avatar;
    if (viewingAs && typeof viewingAs === 'object') return viewingAs.avatar;
    return user?.avatar;
  };

  return (
    <div className="min-h-screen bg-black/10 backdrop-blur-sm">
      <div className="sticky top-0 bg-black/80 backdrop-blur-md border-b border-gray-700/50 p-4 z-10">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-bold text-white">Home</h2>
            <p className="text-gray-400 text-sm">Character stories and adventures</p>
          </div>
          <button
            onClick={onCreatePost}
            className="flex items-center space-x-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-full transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Post</span>
          </button>
        </div>

        {/* Viewing As Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center space-x-3 bg-gray-800/50 hover:bg-gray-700/50 rounded-lg px-4 py-3 transition-colors w-full"
          >
            <img
              src={getDisplayAvatar()}
              alt={getDisplayName()}
              className="w-8 h-8 rounded-full object-cover"
            />
            <div className="flex-1 text-left">
              <p className="text-white font-medium">Viewing as</p>
              <p className="text-gray-400 text-sm">{getDisplayName()}</p>
            </div>
            <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
          </button>

          {showDropdown && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-20">
              <button
                onClick={() => handleViewingChange('user')}
                className={`w-full flex items-center space-x-3 px-4 py-3 hover:bg-gray-700 transition-colors ${
                  viewingAs === 'user' ? 'bg-gray-700' : ''
                }`}
              >
                <img
                  src={user?.avatar}
                  alt={user?.displayName}
                  className="w-8 h-8 rounded-full object-cover"
                />
                <div className="text-left">
                  <p className="text-white font-medium">Main Account</p>
                  <p className="text-gray-400 text-sm">@{user?.username}</p>
                </div>
              </button>

              {userCharacters.map((character) => (
                <button
                  key={character.id}
                  onClick={() => handleViewingChange(character)}
                  className={`w-full flex items-center space-x-3 px-4 py-3 hover:bg-gray-700 transition-colors ${
                    viewingAs && typeof viewingAs === 'object' && viewingAs.id === character.id ? 'bg-gray-700' : ''
                  }`}
                >
                  <img
                    src={character.avatar}
                    alt={character.name}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                  <div className="text-left">
                    <p className="text-white font-medium">{character.name}</p>
                    <p className="text-gray-400 text-sm">@{character.username}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="divide-y divide-gray-700/30">
        {filteredPosts.length === 0 ? (
          <div className="p-12 text-center">
            <h3 className="text-xl font-semibold text-gray-400 mb-2">Welcome to CharacterVerse!</h3>
            <p className="text-gray-500 mb-6">
              {viewingAs === 'user' 
                ? 'Follow other writers to see their posts here, or create your first post!'
                : `Follow accounts or characters as ${getDisplayName()} to see their posts here.`
              }
            </p>
            <button
              onClick={onCreatePost}
              className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-full transition-colors"
            >
              Create Your First Post
            </button>
          </div>
        ) : (
          filteredPosts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onLike={() => onLike(post.id)}
              onRepost={() => onRepost(post.id)}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default Timeline;