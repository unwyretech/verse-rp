import React, { useState, useEffect } from 'react';
import { X, Send } from 'lucide-react';
import { Post, Character } from '../types';
import { useApp } from '../contexts/AppContext';
import { useAuth } from '../contexts/AuthContext';
import { formatDistanceToNow } from '../utils/dateUtils';

interface PostRepliesProps {
  post: Post;
  onClose: () => void;
}

const PostReplies: React.FC<PostRepliesProps> = ({ post, onClose }) => {
  const { user } = useAuth();
  const { characters, getPostComments, addPost } = useApp();
  const [comments, setComments] = useState<any[]>([]);
  const [replyContent, setReplyContent] = useState('');
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  const [loading, setLoading] = useState(true);

  // Only show user's own characters
  const userCharacters = characters.filter(char => char.userId === user?.id);

  useEffect(() => {
    loadComments();
  }, [post.id]);

  const loadComments = async () => {
    setLoading(true);
    const postComments = await getPostComments(post.id);
    setComments(postComments);
    setLoading(false);
  };

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyContent.trim() || !user) return;

    await addPost({
      content: replyContent.trim(),
      characterId: selectedCharacter?.id,
      character: selectedCharacter,
      userId: user.id,
      user,
      parentPostId: post.id,
      isThread: false,
      visibility: 'public',
      tags: replyContent.match(/#\w+/g) || []
    });

    setReplyContent('');
    loadComments();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-2xl border border-gray-700/50 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-gray-900 border-b border-gray-700/50 p-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">Replies</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-800 rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-gray-400" />
          </button>
        </div>

        <div className="p-6">
          {/* Original Post */}
          <div className="mb-6 p-4 bg-gray-800/30 rounded-lg border border-gray-700/50">
            <div className="flex space-x-3">
              <img
                src={post.character?.avatar || post.user?.avatar}
                alt={post.character?.name || post.user?.displayName}
                className="w-10 h-10 rounded-full object-cover"
              />
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <span className="font-bold text-white">
                    {post.character?.name || post.user?.displayName}
                  </span>
                  <span className="text-gray-500 text-sm">
                    {formatDistanceToNow(post.timestamp)}
                  </span>
                </div>
                <p className="text-gray-100">{post.content}</p>
              </div>
            </div>
          </div>

          {/* Reply Form */}
          <form onSubmit={handleReply} className="mb-6">
            <div className="flex space-x-3 mb-4">
              <img
                src={selectedCharacter?.avatar || user?.avatar}
                alt={selectedCharacter?.name || user?.displayName}
                className="w-10 h-10 rounded-full object-cover"
              />
              <div className="flex-1">
                <select
                  value={selectedCharacter?.id || 'user'}
                  onChange={(e) => {
                    if (e.target.value === 'user') {
                      setSelectedCharacter(null);
                    } else {
                      const character = userCharacters.find(c => c.id === e.target.value);
                      setSelectedCharacter(character || null);
                    }
                  }}
                  className="mb-3 bg-gray-800 text-white border border-gray-600 rounded-lg px-3 py-1 text-sm focus:border-purple-500 focus:outline-none"
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
                  className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white focus:border-purple-500 focus:outline-none resize-none"
                  rows={3}
                />
              </div>
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={!replyContent.trim()}
                className="flex items-center space-x-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg transition-colors"
              >
                <Send className="w-4 h-4" />
                <span>Reply</span>
              </button>
            </div>
          </form>

          {/* Comments */}
          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full mx-auto"></div>
                <p className="text-gray-400 mt-2">Loading replies...</p>
              </div>
            ) : comments.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-400">No replies yet. Be the first to reply!</p>
              </div>
            ) : (
              comments.map((comment) => (
                <div key={comment.id} className="flex space-x-3 p-4 bg-gray-800/20 rounded-lg">
                  <img
                    src={comment.character?.avatar_url || comment.user?.avatar_url}
                    alt={comment.character?.name || comment.user?.display_name}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="font-medium text-white">
                        {comment.character?.name || comment.user?.display_name}
                      </span>
                      <span className="text-gray-500 text-sm">
                        {formatDistanceToNow(comment.timestamp)}
                      </span>
                    </div>
                    <p className="text-gray-100">{comment.content}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostReplies;