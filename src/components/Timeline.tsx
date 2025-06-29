import React, { useState, useEffect } from 'react';
import { Plus, ChevronDown, Globe, Users } from 'lucide-react';
import PostCard from './PostCard';
import PostReplies from './PostReplies';
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
  const { characters, getFilteredPosts, allUsers, bookmarkPost, unbookmarkPost, bookmarkedPosts } = useApp();
  const [viewingAs, setViewingAs] = useState<Character | 'user' | null>('user');
  const [showDropdown, setShowDropdown] = useState(false);
  const [feedMode, setFeedMode] = useState<'for-you' | 'browse'>('for-you');
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [timelinePosts, setTimelinePosts] = useState<Post[]>([]);

  // Only show user's own characters
  const userCharacters = characters.filter(char => char.userId === user?.id);

  // Real-time refresh every 1 second
  useEffect(() => {
    const refreshTimeline = () => {
      const filteredPosts = getTimelinePosts();
      setTimelinePosts(filteredPosts);
    };

    // Initial load
    refreshTimeline();

    // Set up interval for real-time updates
    const interval = setInterval(refreshTimeline, 1000);

    return () => clearInterval(interval);
  }, [posts, feedMode, viewingAs, user]);

  // Get filtered posts based on selected viewing mode and feed mode
  const getTimelinePosts = () => {
    if (feedMode === 'browse') {
      // Show all posts from all users
      return posts.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    } else {
      // Show filtered posts based on following relationships
      return getFilteredPosts(viewingAs || 'user');
    }
  };

  const handleViewingChange = (option: Character | 'user') => {
    setViewingAs(option);
    setShowDropdown(false);
  };

  const handleBookmark = (postId: string) => {
    if (bookmarkedPosts.includes(postId)) {
      unbookmarkPost(postId);
    } else {
      bookmarkPost(postId);
    }
  };

  const handlePostClick = (post: Post) => {
    setSelectedPost(post);
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
    <>
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

          {/* Feed Mode Toggle */}
          <div className="flex space-x-1 mb-4 bg-gray-800/50 rounded-lg p-1">
            <button
              onClick={() => setFeedMode('for-you')}
              className={`flex-1 flex items-center justify-center space-x-2 px-4 py-2 rounded-md transition-colors ${
                feedMode === 'for-you'
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>For You</span>
            </button>
            <button
              onClick={() => setFeedMode('browse')}
              className={`flex-1 flex items-center justify-center space-x-2 px-4 py-2 rounded-md transition-colors ${
                feedMode === 'browse'
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Globe className="w-4 h-4" />
              <span>Browse</span>
            </button>
          </div>

          {/* Viewing As Dropdown - Only show in For You mode */}
          {feedMode === 'for-you' && (
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
          )}
        </div>

        <div className="divide-y divide-gray-700/30">
          {timelinePosts.length === 0 ? (
            <div className="p-12 text-center">
              <h3 className="text-xl font-semibold text-gray-400 mb-2">
                {feedMode === 'browse' ? 'No posts available' : 'Welcome to CharacterVerse!'}
              </h3>
              <p className="text-gray-500 mb-6">
                {feedMode === 'browse' 
                  ? 'Check back later for new content from the community.'
                  : viewingAs === 'user' 
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
            timelinePosts.map((post) => (
              <div key={post.id} onClick={() => handlePostClick(post)} className="cursor-pointer">
                <PostCard
                  post={post}
                  onLike={() => onLike(post.id)}
                  onRepost={() => onRepost(post.id)}
                  onBookmark={() => handleBookmark(post.id)}
                  isBookmarked={bookmarkedPosts.includes(post.id)}
                />
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-6 text-center border-t border-gray-700/50 bg-black/20">
          <p className="text-gray-500 text-sm">
            Verse © {new Date().getFullYear()}
          </p>
        </div>
      </div>

      {/* Post Details Modal */}
      {selectedPost && (
        <PostReplies
          post={selectedPost}
          onClose={() => setSelectedPost(null)}
        />
      )}
    </>
  );
};

export default Timeline;