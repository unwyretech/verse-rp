import React, { useState } from 'react';
import { X, Image, Smile, Calendar, MapPin, Globe, Users, Lock } from 'lucide-react';
import { Character } from '../types';

interface CreatePostProps {
  characters: Character[];
  selectedCharacter: Character | null;
  onCreatePost: (content: string, character?: Character) => void;
  onClose: () => void;
}

const CreatePost: React.FC<CreatePostProps> = ({ 
  characters, 
  selectedCharacter, 
  onCreatePost, 
  onClose 
}) => {
  const [content, setContent] = useState('');
  const [activeCharacter, setActiveCharacter] = useState<Character | null>(selectedCharacter);
  const [visibility, setVisibility] = useState<'public' | 'followers' | 'private'>('public');
  const [isThread, setIsThread] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (content.trim()) {
      onCreatePost(content.trim(), activeCharacter || undefined);
      setContent('');
    }
  };

  const characterCount = content.length;
  const maxLength = 280;

  const visibilityOptions = [
    { value: 'public', label: 'Public', icon: Globe, desc: 'Anyone can see this post' },
    { value: 'followers', label: 'Followers', icon: Users, desc: 'Only your followers can see this' },
    { value: 'private', label: 'Private', icon: Lock, desc: 'Only you can see this' }
  ];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-2xl border border-gray-700/50 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-gray-900 border-b border-gray-700/50 p-4 flex items-center justify-between">
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-800 rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-gray-400" />
          </button>
          <h2 className="text-lg font-bold text-white">Create Post</h2>
          <div className="w-10" />
        </div>

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
                <span className="text-white font-semibold">U</span>
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
                      const character = characters.find(c => c.id === e.target.value);
                      setActiveCharacter(character || null);
                    }
                  }}
                  className="bg-gray-800 text-white border border-gray-600 rounded-lg px-3 py-1 text-sm focus:border-purple-500 focus:outline-none"
                >
                  <option value="user">Post as yourself</option>
                  {characters.map((character) => (
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
            placeholder={activeCharacter 
              ? `What's happening in ${activeCharacter.name}'s world?`
              : "What's on your mind?"
            }
            className="w-full bg-transparent text-white text-xl placeholder-gray-500 resize-none border-none outline-none min-h-[120px]"
            maxLength={maxLength}
          />

          <div className="space-y-4 pt-4 border-t border-gray-700/50">
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
                className="p-2 text-purple-400 hover:bg-purple-400/10 rounded-full transition-colors"
              >
                <Image className="w-5 h-5" />
              </button>
              <button
                type="button"
                className="p-2 text-purple-400 hover:bg-purple-400/10 rounded-full transition-colors"
              >
                <Smile className="w-5 h-5" />
              </button>
              <button
                type="button"
                className="p-2 text-purple-400 hover:bg-purple-400/10 rounded-full transition-colors"
              >
                <Calendar className="w-5 h-5" />
              </button>
              <button
                type="button"
                className="p-2 text-purple-400 hover:bg-purple-400/10 rounded-full transition-colors"
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
                disabled={!content.trim() || characterCount > maxLength}
                className="bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold px-6 py-2 rounded-full hover:from-purple-700 hover:to-pink-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isThread ? 'Start Thread' : 'Post'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreatePost;