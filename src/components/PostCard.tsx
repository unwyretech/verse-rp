import React, { useState } from 'react';
import { Heart, MessageCircle, Repeat2, Share, MoreHorizontal, Edit3, Trash2 } from 'lucide-react';
import { Post } from '../types';
import { formatDistanceToNow } from '../utils/dateUtils';
import { useAuth } from '../contexts/AuthContext';
import { useApp } from '../contexts/AppContext';
import PostReplies from './PostReplies';

interface PostCardProps {
  post: Post;
  onLike: () => void;
  onRepost: () => void;
  showReplies?: boolean;
}

const PostCard: React.FC<PostCardProps> = ({ post, onLike, onRepost, showReplies = false }) => {
  const { user } = useAuth();
  const { updatePost, deletePost } = useApp();
  const [showMenu, setShowMenu] = useState(false);
  const [showRepliesModal, setShowRepliesModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(post.content);

  // Use character data if available, otherwise fall back to user data
  const displayAvatar = post.character?.avatar || post.user?.avatar || 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=150&h=150';
  const displayName = post.character?.name || post.user?.displayName || post.user?.username || 'Unknown User';
  const displayTitle = post.character?.title || '';
  const displayUniverse = post.character?.universe;
  const displayUsername = post.character?.username || post.user?.username || '';

  const isOwnPost = post.userId === user?.id;

  const handleEdit = () => {
    setIsEditing(true);
    setShowMenu(false);
  };

  const handleSaveEdit = () => {
    updatePost(post.id, { content: editContent });
    setIsEditing(false);
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this post?')) {
      deletePost(post.id);
    }
    setShowMenu(false);
  };

  const handleReply = () => {
    setShowRepliesModal(true);
  };

  return (
    <>
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
                <span className="text-gray-500">@{displayUsername}</span>
              </div>
              <span className="text-gray-500">·</span>
              <time className="text-gray-500 text-sm">
                {formatDistanceToNow(post.timestamp)}
              </time>
              <div className="ml-auto relative">
                <button 
                  onClick={() => setShowMenu(!showMenu)}
                  className="text-gray-500 hover:text-gray-300 transition-colors"
                >
                  <MoreHorizontal className="w-5 h-5" />
                </button>
                {showMenu && (
                  <div className="absolute right-0 top-8 bg-gray-800 border border-gray-700 rounded-lg shadow-lg z-10 min-w-[120px]">
                    {isOwnPost && (
                      <>
                        <button
                          onClick={handleEdit}
                          className="w-full text-left px-4 py-2 text-white hover:bg-gray-700 flex items-center space-x-2"
                        >
                          <Edit3 className="w-4 h-4" />
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={handleDelete}
                          className="w-full text-left px-4 py-2 text-red-400 hover:bg-gray-700 flex items-center space-x-2"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span>Delete</span>
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => setShowMenu(false)}
                      className="w-full text-left px-4 py-2 text-gray-400 hover:bg-gray-700"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
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
              {isEditing ? (
                <div className="space-y-3">
                  <textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white focus:border-purple-500 focus:outline-none resize-none"
                    rows={3}
                  />
                  <div className="flex space-x-2">
                    <button
                      onClick={handleSaveEdit}
                      className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => {
                        setIsEditing(false);
                        setEditContent(post.content);
                      }}
                      className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-gray-100 leading-relaxed whitespace-pre-wrap">{post.content}</p>
              )}
            </div>

            <div className="flex items-center justify-between max-w-md">
              <button 
                onClick={handleReply}
                className="flex items-center space-x-2 text-gray-500 hover:text-blue-400 transition-colors group"
              >
                <div className="p-2 rounded-full group-hover:bg-blue-400/10 transition-colors">
                  <MessageCircle className="w-5 h-5" />
                </div>
                <span className="text-sm">{post.comments}</span>
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
                <span className="text-sm">{post.reposts}</span>
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
                <span className="text-sm">{post.likes}</span>
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

      {showRepliesModal && (
        <PostReplies
          post={post}
          onClose={() => setShowRepliesModal(false)}
        />
      )}
    </>
  );
};

export default PostCard;