import React, { useState } from 'react';
import { X, Image, Video, Smile, Calendar, MapPin, Globe, Users, Lock, Upload } from 'lucide-react';
import { Character } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { uploadImage } from '../lib/supabase';

interface CreatePostProps {
  characters: Character[];
  selectedCharacter: Character | null;
  onCreatePost: (content: string, character?: Character, mediaUrls?: string[]) => Promise<void>;
  onClose: () => void;
  replyToPost?: any;
}

const CreatePost: React.FC<CreatePostProps> = ({ 
  characters, 
  selectedCharacter, 
  onCreatePost, 
  onClose,
  replyToPost
}) => {
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [activeCharacter, setActiveCharacter] = useState<Character | null>(selectedCharacter);
  const [visibility, setVisibility] = useState<'public' | 'followers' | 'private'>('public');
  const [isThread, setIsThread] = useState(false);
  const [mediaUrls, setMediaUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Only show user's own characters
  const userCharacters = characters.filter(char => char.userId === user?.id);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || submitting) return;

    setSubmitting(true);
    try {
      console.log('CreatePost: Submitting post with:', { content, activeCharacter, mediaUrls });
      await onCreatePost(content.trim(), activeCharacter || undefined, mediaUrls);
      console.log('CreatePost: Post submitted successfully');
      setContent('');
      setMediaUrls([]);
    } catch (error) {
      console.error('CreatePost: Error submitting post:', error);
      alert('Failed to create post. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleFileUpload = async (file: File, type: 'image' | 'video') => {
    if (!user) return;

    setUploading(true);
    try {
      const bucket = type === 'image' ? 'post-images' : 'post-videos';
      const path = `${user.id}/${type}_${Date.now()}.${file.name.split('.').pop()}`;
      
      const mediaUrl = await uploadImage(file, bucket, path);
      if (mediaUrl) {
        setMediaUrls(prev => [...prev, mediaUrl]);
      } else {
        alert('Failed to upload file');
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  const handleImageUpload = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) handleFileUpload(file, 'image');
    };
    input.click();
  };

  const handleVideoUpload = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'video/*';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) handleFileUpload(file, 'video');
    };
    input.click();
  };

  const removeMedia = (index: number) => {
    setMediaUrls(prev => prev.filter((_, i) => i !== index));
  };

  const characterCount = content.length;
  const maxLength = 280;

  const visibilityOptions = [
    { value: 'public', label: 'Public', icon: Globe, desc: 'Anyone can see this post' },
    { value: 'followers', label: 'Followers', icon: Users, desc: 'Only your followers can see this' },
    { value: 'private', label: 'Private', icon: Lock, desc: 'Only you can see this' }
  ];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-2xl border border-gray-700/50 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-gray-900 border-b border-gray-700/50 p-4 flex items-center justify-between">
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-800 rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-gray-400" />
          </button>
          <h2 className="text-lg font-bold text-white">
            {replyToPost ? 'Reply to Post' : 'Create Post'}
          </h2>
          <div className="w-10" />
        </div>

        {replyToPost && (
          <div className="p-4 bg-gray-800/30 border-b border-gray-700/50">
            <div className="flex space-x-3">
              <img
                src={replyToPost.character?.avatar || replyToPost.user?.avatar}
                alt={replyToPost.character?.name || replyToPost.user?.displayName}
                className="w-8 h-8 rounded-full object-cover"
              />
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <span className="font-medium text-white">
                    {replyToPost.character?.name || replyToPost.user?.displayName}
                  </span>
                  
                  <span className="text-gray-500 text-sm">
                    @{replyToPost.character?.username || replyToPost.user?.username}
                  </span>
                </div>
                <p className="text-gray-300 text-sm">{replyToPost.content}</p>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6">
          <div className="flex space-x-4 mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
              {activeCharacter ? (
                <img
                  src={activeCharacter.avatar}
                  alt={activeCharacter.name}
                  className="w-12 h-12 rounded-full object-cover"
                />
              ) : (
                <img
                  src={user?.avatar}
                  alt={user?.displayName}
                  className="w-12 h-12 rounded-full object-cover"
                />
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-2">
                <select
                  value={activeCharacter?.id || 'user'}
                  onChange={(e) => {
                    if (e.target.value === 'user') {
                      setActiveCharacter(null);
                    } else {
                      const character = userCharacters.find(c => c.id === e.target.value);
                      setActiveCharacter(character || null);
                    }
                  }}
                  className="bg-gray-800 text-white border border-gray-600 rounded-lg px-3 py-1 text-sm focus:border-purple-500 focus:outline-none"
                >
                  <option value="user">Post as yourself</option>
                  {userCharacters.map((character) => (
                    <option key={character.id} value={character.id}>
                      {character.name} - {character.title}
                    </option>
                  ))}
                </select>
              </div>
              {activeCharacter && (
                <div className="inline-flex items-center space-x-2 text-xs text-purple-300 bg-purple-900/30 px-2 py-1 rounded-full mb-3">
                  <span>📖</span>
                  <span>{activeCharacter.universe}</span>
                </div>
              )}
            </div>
          </div>

          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={
              replyToPost
                ? "Write your reply..."
                : activeCharacter 
                  ? `What's happening in ${activeCharacter.name}'s world?`
                  : "What's on your mind?"
            }
            className="w-full bg-transparent text-white text-xl placeholder-gray-500 resize-none border-none outline-none min-h-[120px]"
            maxLength={maxLength}
            disabled={submitting}
          />

          {/* Media Preview */}
          {mediaUrls.length > 0 && (
            <div className="grid grid-cols-2 gap-2 mt-4">
              {mediaUrls.map((url, index) => (
                <div key={index} className="relative">
                  {url.includes('.mp4') || url.includes('.mov') || url.includes('.avi') ? (
                    <video
                      src={url}
                      className="w-full h-32 object-cover rounded-lg"
                      controls
                    />
                  ) : (
                    <img
                      src={url}
                      alt="Upload"
                      className="w-full h-32 object-cover rounded-lg"
                    />
                  )}
                  <button
                    type="button"
                    onClick={() => removeMedia(index)}
                    className="absolute top-2 right-2 p-1 bg-black/50 hover:bg-black/70 rounded-full transition-colors"
                  >
                    <X className="w-4 h-4 text-white" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="space-y-4 pt-4 border-t border-gray-700/50">
            {!replyToPost && (
              <div className="flex items-center space-x-4">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isThread}
                    onChange={(e) => setIsThread(e.target.checked)}
                    className="text-purple-600 focus:ring-purple-500 rounded"
                  />
                  <span className="text-gray-300 text-sm">Create as thread</span>
                </label>
              </div>
            )}

            <div>
              <p className="text-gray-300 text-sm mb-2">Who can see this?</p>
              <div className="flex space-x-2">
                {visibilityOptions.map(option => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setVisibility(option.value as any)}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                      visibility === option.value
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                    }`}
                  >
                    <option.icon className="w-4 h-4" />
                    <span>{option.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-gray-700/50">
            <div className="flex items-center space-x-4">
              <button
                type="button"
                onClick={handleImageUpload}
                disabled={uploading || submitting}
                className="p-2 text-purple-400 hover:bg-purple-400/10 rounded-full transition-colors disabled:opacity-50"
              >
                {uploading ? <Upload className="w-5 h-5 animate-spin" /> : <Image className="w-5 h-5" />}
              </button>
              <button
                type="button"
                onClick={handleVideoUpload}
                disabled={uploading || submitting}
                className="p-2 text-purple-400 hover:bg-purple-400/10 rounded-full transition-colors disabled:opacity-50"
              >
                <Video className="w-5 h-5" />
              </button>
              <button
                type="button"
                className="p-2 text-purple-400 hover:bg-purple-400/10 rounded-full transition-colors"
                disabled={submitting}
              >
                <Smile className="w-5 h-5" />
              </button>
              <button
                type="button"
                className="p-2 text-purple-400 hover:bg-purple-400/10 rounded-full transition-colors"
                disabled={submitting}
              >
                <Calendar className="w-5 h-5" />
              </button>
              <button
                type="button"
                className="p-2 text-purple-400 hover:bg-purple-400/10 rounded-full transition-colors"
                disabled={submitting}
              >
                <MapPin className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className={`w-8 h-8 rounded-full border-2 ${
                  characterCount > maxLength * 0.8 
                    ? characterCount >= maxLength 
                      ? 'border-red-500' 
                      : 'border-yellow-500'
                    : 'border-gray-600'
                }`}>
                  <svg className="w-full h-full transform -rotate-90">
                    <circle
                      cx="16"
                      cy="16"
                      r="14"
                      fill="none"
                      strokeWidth="2"
                      className={
                        characterCount > maxLength * 0.8 
                          ? characterCount >= maxLength 
                            ? 'stroke-red-500' 
                            : 'stroke-yellow-500'
                          : 'stroke-purple-500'
                      }
                      strokeDasharray={`${(characterCount / maxLength) * 88} 88`}
                    />
                  </svg>
                </div>
                <span className={`text-sm ${
                  characterCount >= maxLength ? 'text-red-400' : 'text-gray-500'
                }`}>
                  {maxLength - characterCount}
                </span>
              </div>

              <button
                type="submit"
                disabled={!content.trim() || characterCount > maxLength || uploading || submitting}
                className="bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold px-6 py-2 rounded-full hover:from-purple-700 hover:to-pink-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Posting...' : replyToPost ? 'Reply' : isThread ? 'Start Thread' : 'Post'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreatePost;