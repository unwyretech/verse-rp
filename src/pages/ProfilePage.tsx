import React, { useState } from 'react';
import { Camera, Edit3, Plus, Settings, MapPin, Calendar, Link as LinkIcon } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useApp } from '../contexts/AppContext';
import CharacterCard from '../components/CharacterCard';
import CreateCharacter from '../components/CreateCharacter';
import EditProfile from '../components/EditProfile';

const ProfilePage: React.FC = () => {
  const { user, updateUser } = useAuth();
  const { characters, posts } = useApp();
  const [activeTab, setActiveTab] = useState<'posts' | 'characters' | 'media'>('posts');
  const [showCreateCharacter, setShowCreateCharacter] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);

  const userPosts = posts.filter(post => post.userId === user?.id);
  const userCharacters = characters.filter(char => char.userId === user?.id);

  if (!user) return null;

  return (
    <div className="min-h-screen bg-black/10 backdrop-blur-sm">
      {/* Profile Header */}
      <div className="relative">
        <div className="h-48 bg-gradient-to-r from-purple-600 via-pink-600 to-purple-800 relative">
          <img
            src={user.headerImage}
            alt="Profile header"
            className="w-full h-full object-cover"
          />
          <button className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-black/70 rounded-full transition-colors">
            <Camera className="w-5 h-5 text-white" />
          </button>
        </div>

        <div className="relative px-6 pb-6">
          <div className="flex items-end justify-between -mt-16 mb-4">
            <div className="relative">
              <img
                src={user.avatar}
                alt={user.displayName}
                className="w-32 h-32 rounded-full object-cover ring-4 ring-gray-900 bg-gray-900"
              />
              <button className="absolute bottom-2 right-2 p-2 bg-purple-600 hover:bg-purple-700 rounded-full transition-colors">
                <Camera className="w-4 h-4 text-white" />
              </button>
            </div>
            <button
              onClick={() => setShowEditProfile(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-full transition-colors text-white border border-gray-600"
            >
              <Edit3 className="w-4 h-4" />
              <span>Edit Profile</span>
            </button>
          </div>

          <div className="space-y-3">
            <div>
              <h1 className="text-2xl font-bold text-white">{user.displayName}</h1>
              <p className="text-gray-400">@{user.username}</p>
            </div>

            <p className="text-gray-300">{user.bio}</p>

            <div className="flex items-center space-x-4 text-gray-400 text-sm">
              <div className="flex items-center space-x-1">
                <Calendar className="w-4 h-4" />
                <span>Joined {user.createdAt.toLocaleDateString()}</span>
              </div>
              <div className="flex items-center space-x-1">
                <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                <span>#{user.writersTag}</span>
              </div>
            </div>

            <div className="flex items-center space-x-6 text-sm">
              <div>
                <span className="font-bold text-white">{user.following.length}</span>
                <span className="text-gray-400 ml-1">Following</span>
              </div>
              <div>
                <span className="font-bold text-white">{user.followers.length}</span>
                <span className="text-gray-400 ml-1">Followers</span>
              </div>
              <div>
                <span className="font-bold text-white">{userCharacters.length}</span>
                <span className="text-gray-400 ml-1">Characters</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-700/50 bg-black/20 sticky top-0 z-10">
        <div className="flex">
          {[
            { key: 'posts', label: 'Posts', count: userPosts.length },
            { key: 'characters', label: 'Characters', count: userCharacters.length },
            { key: 'media', label: 'Media', count: 0 }
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
            {userPosts.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-400 mb-4">No posts yet</p>
                <button className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-full transition-colors">
                  Create your first post
                </button>
              </div>
            ) : (
              userPosts.map(post => (
                <div key={post.id} className="bg-gray-800/30 rounded-xl p-4 border border-gray-700/50">
                  <p className="text-white">{post.content}</p>
                  <div className="flex items-center justify-between mt-3 text-gray-400 text-sm">
                    <span>{post.timestamp.toLocaleDateString()}</span>
                    <div className="flex space-x-4">
                      <span>{post.likes} likes</span>
                      <span>{post.reposts} reposts</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'characters' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">Your Characters</h3>
              <button
                onClick={() => setShowCreateCharacter(true)}
                className="flex items-center space-x-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-full transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>New Character</span>
              </button>
            </div>

            {userCharacters.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-400 mb-4">No characters created yet</p>
                <button
                  onClick={() => setShowCreateCharacter(true)}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-full transition-colors"
                >
                  Create your first character
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {userCharacters.map(character => (
                  <CharacterCard key={character.id} character={character} />
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'media' && (
          <div className="text-center py-12">
            <p className="text-gray-400">Media gallery coming soon</p>
          </div>
        )}
      </div>

      {/* Modals */}
      {showCreateCharacter && (
        <CreateCharacter onClose={() => setShowCreateCharacter(false)} />
      )}

      {showEditProfile && (
        <EditProfile onClose={() => setShowEditProfile(false)} />
      )}
    </div>
  );
};

export default ProfilePage;