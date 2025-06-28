import React, { useState, useEffect } from 'react';
import { Camera, Edit3, Plus, Settings, MapPin, Calendar, Link as LinkIcon, Pin, PinOff } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useApp } from '../contexts/AppContext';
import { User } from '../types';
import CharacterCard from '../components/CharacterCard';
import CreateCharacter from '../components/CreateCharacter';
import EditProfile from '../components/EditProfile';
import PostCard from '../components/PostCard';

const ProfilePage: React.FC = () => {
  const { user, updateUser } = useAuth();
  const { characters, posts, getUserFollowers, getUserFollowing, likePost, repostPost, pinPost, unpinPost } = useApp();
  const [activeTab, setActiveTab] = useState<'posts' | 'characters' | 'followers' | 'following'>('posts');
  const [showCreateCharacter, setShowCreateCharacter] = useState(false);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [followers, setFollowers] = useState<User[]>([]);
  const [following, setFollowing] = useState<User[]>([]);

  const userPosts = posts.filter(post => post.userId === user?.id);
  const userCharacters = characters.filter(char => char.userId === user?.id);

  // Sort posts with pinned posts first
  const sortedUserPosts = userPosts.sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return b.timestamp.getTime() - a.timestamp.getTime();
  });

  useEffect(() => {
    if (user) {
      if (activeTab === 'followers') {
        loadFollowers();
      } else if (activeTab === 'following') {
        loadFollowing();
      }
    }
  }, [activeTab, user]);

  const loadFollowers = async () => {
    if (user) {
      const followersList = await getUserFollowers(user.id);
      setFollowers(followersList);
    }
  };

  const loadFollowing = async () => {
    if (user) {
      const followingList = await getUserFollowing(user.id);
      setFollowing(followingList);
    }
  };

  const handleLike = (postId: string) => {
    likePost(postId);
  };

  const handleRepost = (postId: string) => {
    repostPost(postId);
  };

  const handlePinPost = (postId: string) => {
    const post = userPosts.find(p => p.id === postId);
    if (post?.isPinned) {
      unpinPost(postId);
    } else {
      pinPost(postId);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-black/10 backdrop-blur-sm">
      {/* Profile Header */}
      <div className="relative">
        <div className="h-48 relative">
          <img
            src={user.headerImage}
            alt="Profile header"
            className="w-full h-full object-cover"
          />
          <button 
            onClick={() => setShowEditProfile(true)}
            className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-black/70 rounded-full transition-colors"
          >
            <Camera className="w-5 h-5 text-white" />
          </button>
        </div>

        <div className="relative px-6 pb-6">
          <div className="flex items-end justify-between -mt-16 mb-4">
            <img
              src={user.avatar}
              alt={user.displayName}
              className="w-32 h-32 rounded-full object-cover ring-4 ring-gray-900 bg-gray-900 relative z-10"
            />
            <button
              onClick={() => setShowEditProfile(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-full transition-colors text-white"
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
              <button
                onClick={() => setActiveTab('following')}
                className="hover:text-white transition-colors"
              >
                <span className="font-bold text-white">{user.following.length}</span>
                <span className="text-gray-400 ml-1">Following</span>
              </button>
              <button
                onClick={() => setActiveTab('followers')}
                className="hover:text-white transition-colors"
              >
                <span className="font-bold text-white">{user.followers.length}</span>
                <span className="text-gray-400 ml-1">Followers</span>
              </button>
              <div>
                <span className="font-bold text-white">{userCharacters.length}</span>
                <span className="text-gray-400 ml-1">Characters</span>
              </div>
              <div>
                <span className="font-bold text-white">{userPosts.length}</span>
                <span className="text-gray-400 ml-1">Posts</span>
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
            { key: 'followers', label: 'Followers', count: user.followers.length },
            { key: 'following', label: 'Following', count: user.following.length }
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
            {sortedUserPosts.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-400 mb-4">No posts yet</p>
                <button className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-full transition-colors">
                  Create your first post
                </button>
              </div>
            ) : (
              sortedUserPosts.map(post => (
                <div key={post.id} className="relative">
                  {post.isPinned && (
                    <div className="flex items-center space-x-2 text-purple-400 text-sm mb-2">
                      <Pin className="w-4 h-4" />
                      <span>Pinned Post</span>
                    </div>
                  )}
                  <PostCard
                    post={post}
                    onLike={() => handleLike(post.id)}
                    onRepost={() => handleRepost(post.id)}
                    showPinOption={true}
                    onPin={() => handlePinPost(post.id)}
                  />
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

        {activeTab === 'followers' && (
          <div className="space-y-4">
            {followers.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-400">No followers yet</p>
              </div>
            ) : (
              followers.map(follower => (
                <div key={follower.id} className="flex items-center space-x-4 p-4 bg-gray-800/30 rounded-lg hover:bg-gray-700/30 transition-colors cursor-pointer">
                  <img
                    src={follower.avatar}
                    alt={follower.displayName}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <div className="flex-1">
                    <h3 className="text-white font-medium">{follower.displayName}</h3>
                    <p className="text-gray-400 text-sm">@{follower.username}</p>
                    <p className="text-purple-300 text-sm">#{follower.writersTag}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'following' && (
          <div className="space-y-4">
            {following.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-400">Not following anyone yet</p>
              </div>
            ) : (
              following.map(user => (
                <div key={user.id} className="flex items-center space-x-4 p-4 bg-gray-800/30 rounded-lg hover:bg-gray-700/30 transition-colors cursor-pointer">
                  <img
                    src={user.avatar}
                    alt={user.displayName}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <div className="flex-1">
                    <h3 className="text-white font-medium">{user.displayName}</h3>
                    <p className="text-gray-400 text-sm">@{user.username}</p>
                    <p className="text-purple-300 text-sm">#{user.writersTag}</p>
                  </div>
                </div>
              ))
            )}
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