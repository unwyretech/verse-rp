import React, { useState, useEffect } from 'react';
import { X, UserPlus, UserMinus, Calendar, MapPin } from 'lucide-react';
import { Character, Post } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { useApp } from '../contexts/AppContext';
import PostCard from './PostCard';

interface CharacterProfileProps {
  character: Character;
  onClose: () => void;
}

const CharacterProfile: React.FC<CharacterProfileProps> = ({ character, onClose }) => {
  const { user } = useAuth();
  const { posts, followCharacter, unfollowCharacter, likePost, repostPost } = useApp();
  const [activeTab, setActiveTab] = useState<'posts' | 'followers' | 'following'>('posts');

  const isOwnCharacter = character.userId === user?.id;
  const isFollowing = character.followers.includes(user?.id || '');

  // Get posts by this character
  const characterPosts = posts.filter(post => post.characterId === character.id);

  const handleFollow = () => {
    if (isFollowing) {
      unfollowCharacter(character.id);
    } else {
      followCharacter(character.id);
    }
  };

  const handleLike = (postId: string) => {
    likePost(postId);
  };

  const handleRepost = (postId: string) => {
    repostPost(postId);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-2xl border border-gray-700/50 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-gray-900 border-b border-gray-700/50 p-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">Character Profile</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-800 rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-gray-400" />
          </button>
        </div>

        {/* Character Header */}
        <div className="relative">
          <div 
            className="h-48 relative"
            style={{ backgroundColor: `${character.customColor}30` }}
          >
            <img
              src={character.headerImage}
              alt="Character header"
              className="w-full h-full object-cover"
            />
          </div>

          <div className="relative px-6 pb-6">
            <div className="flex items-end justify-between -mt-16 mb-4">
              <img
                src={character.avatar}
                alt={character.name}
                className="w-32 h-32 rounded-full object-cover ring-4 ring-gray-900 bg-gray-900 relative z-10"
              />
              {!isOwnCharacter && (
                <button
                  onClick={handleFollow}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-full transition-colors ${
                    isFollowing
                      ? 'bg-gray-600 text-white hover:bg-gray-700'
                      : 'bg-purple-600 text-white hover:bg-purple-700'
                  }`}
                >
                  {isFollowing ? (
                    <>
                      <UserMinus className="w-4 h-4" />
                      <span>Unfollow</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" />
                      <span>Follow</span>
                    </>
                  )}
                </button>
              )}
            </div>

            <div className="space-y-3">
              <div>
                <h1 className="text-2xl font-bold text-white">{character.name}</h1>
                <p className="text-purple-300 text-lg">{character.title}</p>
                <p className="text-gray-400">@{character.username}</p>
              </div>

              <p className="text-gray-300">{character.bio}</p>

              <div className="flex items-center space-x-4 text-gray-400 text-sm">
                <div className="flex items-center space-x-1">
                  <MapPin className="w-4 h-4" />
                  <span>{character.universe}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Calendar className="w-4 h-4" />
                  <span>Created {character.createdAt.toLocaleDateString()}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: character.customColor }}></span>
                  <span>#{character.verseTag}</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {character.traits.map((trait) => (
                  <span
                    key={trait}
                    className="px-2 py-1 bg-gray-700/50 text-gray-300 text-xs rounded-full"
                  >
                    {trait}
                  </span>
                ))}
              </div>

              <div className="flex items-center space-x-6 text-sm">
                <button
                  onClick={() => setActiveTab('following')}
                  className="hover:text-white transition-colors"
                >
                  <span className="font-bold text-white">{character.following.length}</span>
                  <span className="text-gray-400 ml-1">Following</span>
                </button>
                <button
                  onClick={() => setActiveTab('followers')}
                  className="hover:text-white transition-colors"
                >
                  <span className="font-bold text-white">{character.followers.length}</span>
                  <span className="text-gray-400 ml-1">Followers</span>
                </button>
                <div>
                  <span className="font-bold text-white">{characterPosts.length}</span>
                  <span className="text-gray-400 ml-1">Posts</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="border-b border-gray-700/50 bg-black/20 sticky top-16 z-10">
          <div className="flex">
            {[
              { key: 'posts', label: 'Posts', count: characterPosts.length },
              { key: 'followers', label: 'Followers', count: character.followers.length },
              { key: 'following', label: 'Following', count: character.following.length }
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`flex-1 px-4 py-4 text-center transition-colors relative ${
                  activeTab === tab.key
                    ? 'text-purple-400 border-b-2 border-purple-400'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <span className="font-medium">{tab.label}</span>
                {tab.count > 0 && (
                  <span className="ml-2 text-xs bg-gray-700 px-2 py-1 rounded-full">
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'posts' && (
            <div className="space-y-4">
              {characterPosts.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-400">No posts yet</p>
                </div>
              ) : (
                characterPosts.map(post => (
                  <PostCard
                    key={post.id}
                    post={post}
                    onLike={() => handleLike(post.id)}
                    onRepost={() => handleRepost(post.id)}
                  />
                ))
              )}
            </div>
          )}

          {activeTab === 'followers' && (
            <div className="text-center py-12">
              <p className="text-gray-400">Followers list coming soon</p>
            </div>
          )}

          {activeTab === 'following' && (
            <div className="text-center py-12">
              <p className="text-gray-400">Following list coming soon</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CharacterProfile;