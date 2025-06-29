import React, { useState } from 'react';
import { Heart, MessageCircle, Repeat2, Share, MoreHorizontal, Edit3, Trash2, ChevronDown, ChevronUp, Bookmark, Pin, PinOff } from 'lucide-react';
import { Post } from '../types';
import { formatDistanceToNow } from '../utils/dateUtils';
import { useAuth } from '../contexts/AuthContext';
import { useApp } from '../contexts/AppContext';

interface PostCardProps {
  post: Post;
  onLike: () => void;
  onRepost: () => void;
  onBookmark?: () => void;
  isBookmarked?: boolean;
  showReplies?: boolean;
  showPinOption?: boolean;
  onPin?: () => void;
}

const PostCard: React.FC<PostCardProps> = ({ 
  post, 
  onLike, 
  onRepost, 
  onBookmark,
  isBookmarked = false,
  showReplies = false,
  showPinOption = false,
  onPin
}) => {
  const { user } = useAuth();
  const { updatePost, deletePost, addComment, characters } = useApp();
  const [showMenu, setShowMenu] = useState(false);
  const [showRepliesSection, setShowRepliesSection] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(post.content);
  const [replyContent, setReplyContent] = useState('');
  const [selectedCharacter, setSelectedCharacter] = useState<string>('user');
  const [submittingReply, setSubmittingReply] = useState(false);

  // Use character data if available, otherwise fall back to user data
  const displayAvatar = post.character?.avatar || post.user?.avatar || 'https://images.pexels.com/photos/1239291/pexels-photo-1239291.jpeg?auto=compress&cs=tinysrgb&w=350&h=350';
  const displayName = post.character?.name || post.user?.displayName || post.user?.username || 'Unknown User';
  const displayTitle = post.character?.title || '';
  const displayUniverse = post.character?.universe;
  const displayUsername = post.character?.username || post.user?.username || '';

  const isOwnPost = post.userId === user?.id;
  const userCharacters = characters.filter(char => char.userId === user?.id);

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
    setShowRepliesSection(true);
  };

  const handleSubmitReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyContent.trim() || submittingReply) return;

    setSubmittingReply(true);
    try {
      const characterId = selectedCharacter === 'user' ? undefined : selectedCharacter;
      await addComment(post.id, replyContent.trim(), characterId);
      setReplyContent('');
      console.log('Reply submitted successfully');
    } catch (error) {
      console.error('Error submitting reply:', error);
      alert('Failed to submit reply. Please try again.');
    } finally {
      setSubmittingReply(false);
    }
  };

  const handlePin = () => {
    if (onPin) {
      onPin();
    }
    setShowMenu(false);
  };

  return (
    <article className="bg-gray-800/30 rounded-xl border border-gray-700/50 overflow-hidden">
      <div className="p-6 hover:bg-gray-800/20 transition-colors">
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
                    {onBookmark && (
                      <button
                        onClick={() => {
                          onBookmark();
                          setShowMenu(false);
                        }}
                        className="w-full text-left px-4 py-2 text-white hover:bg-gray-700 flex items-center space-x-2"
                      >
                        <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-current' : ''}`} />
                        <span>{isBookmarked ? 'Remove Bookmark' : 'Bookmark'}</span>
                      </button>
                    )}
                    {isOwnPost && (
                      <>
                        {showPinOption && (
                          <button
                            onClick={handlePin}
                            className="w-full text-left px-4 py-2 text-white hover:bg-gray-700 flex items-center space-x-2"
                          >
                            {post.isPinned ? <PinOff className="w-4 h-4" /> : <Pin className="w-4 h-4" />}
                            <span>{post.isPinned ? 'Unpin' : 'Pin to Profile'}</span>
                          </button>
                        )}
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

            {/* Media Display */}
            {post.mediaUrls && post.mediaUrls.length > 0 && (
              <div className="mb-4 grid grid-cols-2 gap-2">
                {post.mediaUrls.map((url, index) => (
                  <div key={index} className="rounded-lg overflow-hidden">
                    {url.includes('.mp4') || url.includes('.mov') || url.includes('.avi') ? (
                      <video
                        src={url}
                        className="w-full h-48 object-cover"
                        controls
                      />
                    ) : (
                      <img
                        src={url}
                        alt="Post media"
                        className="w-full h-48 object-cover"
                      />
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center justify-between max-w-md">
              <button 
                onClick={handleReply}
                className="flex items-center space-x-2 text-gray-500 hover:text-blue-400 transition-colors group"
              >
                <div className="p-2 rounded-full group-hover:bg-blue-400/10 transition-colors">
                  <MessageCircle className="w-5 h-5" />
                </div>
                <span className="text-sm">{post.replies?.length || 0}</span>
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

              {onBookmark && (
                <button 
                  onClick={onBookmark}
                  className={`flex items-center space-x-2 transition-colors group ${
                    isBookmarked ? 'text-purple-400' : 'text-gray-500 hover:text-purple-400'
                  }`}
                >
                  <div className="p-2 rounded-full group-hover:bg-purple-400/10 transition-colors">
                    <Bookmark className={`w-5 h-5 ${isBookmarked ? 'fill-current' : ''}`} />
                  </div>
                </button>
              )}

              <button className="flex items-center space-x-2 text-gray-500 hover:text-blue-400 transition-colors group">
                <div className="p-2 rounded-full group-hover:bg-blue-400/10 transition-colors">
                  <Share className="w-5 h-5" />
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Replies Section */}
      {post.replies && post.replies.length > 0 && (
        <div className="border-t border-gray-700/50 bg-gray-900/30">
          <div className="p-4">
            <button
              onClick={() => setShowRepliesSection(!showRepliesSection)}
              className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors text-sm"
            >
              {showRepliesSection ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              <span>{showRepliesSection ? 'Hide' : 'Show'} {post.replies.length} {post.replies.length === 1 ? 'reply' : 'replies'}</span>
            </button>
          </div>

          {showRepliesSection && (
            <>
              {/* Reply Form */}
              <form onSubmit={handleSubmitReply} className="p-4 border-b border-gray-700/30">
                <div className="flex space-x-3 mb-3">
                  <img
                    src={selectedCharacter === 'user' ? user?.avatar : userCharacters.find(c => c.id === selectedCharacter)?.avatar || user?.avatar}
                    alt="Your avatar"
                    className="w-8 h-8 rounded-full object-cover"
                  />
                  <div className="flex-1">
                    <select
                      value={selectedCharacter}
                      onChange={(e) => setSelectedCharacter(e.target.value)}
                      className="mb-2 bg-gray-800 text-white border border-gray-600 rounded-lg px-3 py-1 text-sm focus:border-purple-500 focus:outline-none"
                    >
                      <option value="user">Reply as yourself</option>
                      {userCharacters.map((character) => (
                        <option key={character.id} value={character.id}>
                          {character.name} - {character.title}
                        </option>
                      ))}
                    </select>
                    <textarea
                      value={replyContent}
                      onChange={(e) => setReplyContent(e.target.value)}
                      placeholder="Write your reply..."
                      className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white focus:border-purple-500 focus:outline-none resize-none text-sm"
                      rows={2}
                      disabled={submittingReply}
                    />
                  </div>
                </div>
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={!replyContent.trim() || submittingReply}
                    className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-1 rounded-lg transition-colors text-sm"
                  >
                    {submittingReply ? 'Replying...' : 'Reply'}
                  </button>
                </div>
              </form>

              {/* Existing Replies */}
              <div className="divide-y divide-gray-700/30">
                {post.replies.map((reply) => (
                  <div key={reply.id} className="p-4 flex space-x-3">
                    <img
                      src={reply.character?.avatar || reply.user?.avatar}
                      alt={reply.character?.name || reply.user?.displayName}
                      className="w-6 h-6 rounded-full object-cover"
                    />
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="font-medium text-white text-sm">
                          {reply.character?.name || reply.user?.displayName}
                        </span>
                        <span className="text-gray-500 text-xs">
                          {formatDistanceToNow(reply.timestamp)}
                        </span>
                      </div>
                      <p className="text-gray-100 text-sm">{reply.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Show reply form if no replies exist but user wants to reply */}
      {(!post.replies || post.replies.length === 0) && showRepliesSection && (
        <div className="border-t border-gray-700/50 bg-gray-900/30">
          <form onSubmit={handleSubmitReply} className="p-4">
            <div className="flex space-x-3 mb-3">
              <img
                src={selectedCharacter === 'user' ? user?.avatar : userCharacters.find(c => c.id === selectedCharacter)?.avatar || user?.avatar}
                alt="Your avatar"
                className="w-8 h-8 rounded-full object-cover"
              />
              <div className="flex-1">
                <select
                  value={selectedCharacter}
                  onChange={(e) => setSelectedCharacter(e.target.value)}
                  className="mb-2 bg-gray-800 text-white border border-gray-600 rounded-lg px-3 py-1 text-sm focus:border-purple-500 focus:outline-none"
                >
                  <option value="user">Reply as yourself</option>
                  {userCharacters.map((character) => (
                    <option key={character.id} value={character.id}>
                      {character.name} - {character.title}
                    </option>
                  ))}
                </select>
                <textarea
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  placeholder="Write your reply..."
                  className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-white focus:border-purple-500 focus:outline-none resize-none text-sm"
                  rows={2}
                  disabled={submittingReply}
                />
              </div>
            </div>
            <div className="flex justify-between items-center">
              <button
                type="button"
                onClick={() => setShowRepliesSection(false)}
                className="text-gray-400 hover:text-white transition-colors text-sm"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!replyContent.trim() || submittingReply}
                className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-1 rounded-lg transition-colors text-sm"
              >
                {submittingReply ? 'Replying...' : 'Reply'}
              </button>
            </div>
          </form>
        </div>
      )}
    </article>
  );
};

export default PostCard;