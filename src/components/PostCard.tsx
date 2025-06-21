import React from 'react';
import { Heart, MessageCircle, Repeat2, Share, MoreHorizontal } from 'lucide-react';
import { Post } from '../types';
import { formatDistanceToNow } from '../utils/dateUtils';

interface PostCardProps {
  post: Post;
  onLike: () => void;
  onRepost: () => void;
}

const PostCard: React.FC<PostCardProps> = ({ post, onLike, onRepost }) => {
  // Safely handle undefined user/character data
  const displayAvatar = post.character?.avatar || 
                       post.user?.avatar || 
                       'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=150&h=150';
  
  const displayName = post.character?.name || 
                     post.user?.displayName || 
                     post.user?.username || 
                     'Unknown User';
  
  const displayTitle = post.character?.title || '';
  const displayUniverse = post.character?.universe;

  return (
    <article className="p-6 hover:bg-gray-800/20 transition-colors border-b border-gray-700/30">
      <div className="flex space-x-4">
        <div className="flex-shrink-0">
          <img
            src={displayAvatar}
            alt={displayName}
            className="w-12 h-12 rounded-full object-cover ring-2 ring-purple-500/30"
          />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2 mb-2">
            <div className="flex items-center space-x-2">
              <h3 className="font-bold text-white">{displayName}</h3>
              {displayTitle && (
                <span className="text-purple-400 text-sm font-medium">{displayTitle}</span>
              )}
            </div>
            <span className="text-gray-500">·</span>
            <time className="text-gray-500 text-sm">
              {formatDistanceToNow(post.timestamp)}
            </time>
            <button className="ml-auto text-gray-500 hover:text-gray-300 transition-colors">
              <MoreHorizontal className="w-5 h-5" />
            </button>
          </div>

          {displayUniverse && (
            <div className="mb-3">
              <div className="inline-flex items-center space-x-2 text-xs text-purple-300 bg-purple-900/30 px-2 py-1 rounded-full mb-2">
                <span>📖</span>
                <span>{displayUniverse}</span>
              </div>
            </div>
          )}

          <div className="mb-4">
            <p className="text-gray-100 leading-relaxed whitespace-pre-wrap">{post.content}</p>
          </div>

          <div className="flex items-center justify-between max-w-md">
            <button className="flex items-center space-x-2 text-gray-500 hover:text-blue-400 transition-colors group">
              <div className="p-2 rounded-full group-hover:bg-blue-400/10 transition-colors">
                <MessageCircle className="w-5 h-5" />
              </div>
              <span className="text-sm">{post.comments || 0}</span>
            </button>

            <button
              onClick={onRepost}
              className={`flex items-center space-x-2 transition-colors group ${
                post.isReposted ? 'text-green-400' : 'text-gray-500 hover:text-green-400'
              }`}
            >
              <div className="p-2 rounded-full group-hover:bg-green-400/10 transition-colors">
                <Repeat2 className="w-5 h-5" />
              </div>
              <span className="text-sm">{post.reposts || 0}</span>
            </button>

            <button
              onClick={onLike}
              className={`flex items-center space-x-2 transition-colors group ${
                post.isLiked ? 'text-red-500' : 'text-gray-500 hover:text-red-400'
              }`}
            >
              <div className="p-2 rounded-full group-hover:bg-red-400/10 transition-colors">
                <Heart className={`w-5 h-5 ${post.isLiked ? 'fill-current' : ''}`} />
              </div>
              <span className="text-sm">{post.likes || 0}</span>
            </button>

            <button className="flex items-center space-x-2 text-gray-500 hover:text-blue-400 transition-colors group">
              <div className="p-2 rounded-full group-hover:bg-blue-400/10 transition-colors">
                <Share className="w-5 h-5" />
              </div>
            </button>
          </div>
        </div>
      </div>
    </article>
  );
};

export default PostCard;