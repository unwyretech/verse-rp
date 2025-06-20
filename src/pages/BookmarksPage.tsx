import React, { useState } from 'react';
import { Bookmark, Search, Filter } from 'lucide-react';
import PostCard from '../components/PostCard';
import { useApp } from '../contexts/AppContext';

const BookmarksPage: React.FC = () => {
  const { posts, updatePost } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterBy, setFilterBy] = useState<'all' | 'characters' | 'writers'>('all');

  // Mock bookmarked posts (in a real app, this would be stored in user data)
  const bookmarkedPosts = posts.slice(0, 3);

  const filteredBookmarks = bookmarkedPosts.filter(post => {
    const matchesSearch = post.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         post.character?.name.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (filterBy === 'characters') return matchesSearch && post.character;
    if (filterBy === 'writers') return matchesSearch && !post.character;
    return matchesSearch;
  });

  const handleLike = (postId: string) => {
    const post = posts.find(p => p.id === postId);
    if (post) {
      updatePost(postId, {
        isLiked: !post.isLiked,
        likes: post.isLiked ? post.likes - 1 : post.likes + 1
      });
    }
  };

  const handleRepost = (postId: string) => {
    const post = posts.find(p => p.id === postId);
    if (post) {
      updatePost(postId, {
        isReposted: !post.isReposted,
        reposts: post.isReposted ? post.reposts - 1 : post.reposts + 1
      });
    }
  };

  return (
    <div className="min-h-screen bg-black/10 backdrop-blur-sm">
      <div className="sticky top-0 bg-black/80 backdrop-blur-md border-b border-gray-700/50 p-4 z-10">
        <h2 className="text-xl font-bold text-white mb-4">Bookmarks</h2>
        
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search bookmarks..."
              className="w-full bg-gray-800 border border-gray-600 rounded-full pl-10 pr-4 py-3 text-white focus:border-purple-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <div className="flex space-x-1">
              {[
                { key: 'all', label: 'All' },
                { key: 'characters', label: 'Characters' },
                { key: 'writers', label: 'Writers' }
              ].map(filter => (
                <button
                  key={filter.key}
                  onClick={() => setFilterBy(filter.key as any)}
                  className={`px-3 py-1 rounded-full text-sm transition-colors ${
                    filterBy === filter.key
                      ? 'bg-purple-600 text-white'
                      : 'text-gray-400 hover:text-white hover:bg-gray-800'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="divide-y divide-gray-700/30">
        {filteredBookmarks.length === 0 ? (
          <div className="p-12 text-center">
            <Bookmark className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-400 mb-2">
              {searchQuery ? 'No matching bookmarks' : 'No bookmarks yet'}
            </h3>
            <p className="text-gray-500">
              {searchQuery 
                ? 'Try adjusting your search or filter criteria'
                : 'Save posts you want to read later by bookmarking them'
              }
            </p>
          </div>
        ) : (
          filteredBookmarks.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onLike={() => handleLike(post.id)}
              onRepost={() => handleRepost(post.id)}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default BookmarksPage;