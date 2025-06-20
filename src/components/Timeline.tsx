import React from 'react';
import { Plus } from 'lucide-react';
import PostCard from './PostCard';
import { Post } from '../types';

interface TimelineProps {
  posts: Post[];
  onLike: (postId: string) => void;
  onRepost: (postId: string) => void;
  onCreatePost: () => void;
}

const Timeline: React.FC<TimelineProps> = ({ posts, onLike, onRepost, onCreatePost }) => {
  return (
    <div className="min-h-screen bg-black/10 backdrop-blur-sm">
      <div className="sticky top-0 bg-black/80 backdrop-blur-md border-b border-gray-700/50 p-4 z-10">
        <div className="flex items-center justify-between">
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
      </div>

      <div className="divide-y divide-gray-700/30">
        {posts.length === 0 ? (
          <div className="p-12 text-center">
            <h3 className="text-xl font-semibold text-gray-400 mb-2">Welcome to CharacterVerse!</h3>
            <p className="text-gray-500 mb-6">Start by creating your first character or following other writers.</p>
            <button
              onClick={onCreatePost}
              className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-full transition-colors"
            >
              Create Your First Post
            </button>
          </div>
        ) : (
          posts.map((post) => (
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