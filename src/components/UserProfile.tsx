import React, { useState, useEffect } from 'react';
import { X, UserPlus, UserMinus, Calendar, MapPin } from 'lucide-react';
import { User, Post } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { useApp } from '../contexts/AppContext';
import PostCard from './PostCard';

interface UserProfileProps {
  user: User;
  onClose: () => void;
}

const UserProfile: React.FC<UserProfileProps> = ({ user: profileUser, onClose }) => {
  const { user } = useAuth();
  const { posts, followUser, unfollowUser, likePost, repostPost, getUserFollowers, getUserFollowing } = useApp();
  const [activeTab, setActiveTab] = useState<'posts' | 'followers' | 'following'>('posts');
  const [followers, setFollowers] = useState<User[]>([]);
  const [following, setFollowing] = useState<User[]>([]);

  const isOwnProfile = profileUser.id === user?.id;
  const isFollowing = user?.following.includes(profileUser.id) || false;

  // Get posts by this user
  const userPosts = posts.filter(post => post.userId === profileUser.id);

  useEffect(() => {
    if (activeTab === 'followers') {
      loadFollowers();
    } else if (activeTab === 'following') {
      loadFollowing();
    }
  }, [activeTab, profileUser.id]);

  const loadFollowers = async () => {
    const followersList = await getUserFollowers(profileUser.id);
    setFollowers(followersList);
  };

  const loadFollowing = async () => {
    const followingList = await getUserFollowing(profileUser.id);
    setFollowing(followingList);
  };

  const handleFollow = () => {
    followUser(profileUser.id);
  };

  const handleLike = (postId: string) => {
    likePost(postId);
  };

  const handleRepost = (postId: string) => {
    repostPost(postId);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-2xl border border-gray-700/50 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-gray-900 border-b border-gray-700/50 p-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">Profile</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-800 rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-gray-400" />
          </button>
        </div>

        {/* User Header */}
        <div className="relative">
          <div className="h-48 relative bg-gradient-to-r from-purple-600 via-pink-600 to-purple-800">
            <img
              src={profileUser.headerImage}
              alt="Profile header"
              className="w-full h-full object-cover"
            />
          </div>

          <div className="relative px-6 pb-6">
            <div className="flex items-end justify-between -mt-16 mb-4">
              <img
                src={profileUser.avatar}
                alt={profileUser.displayName}
                className="w-32 h-32 rounded-full object-cover ring-4 ring-gray-900 bg-gray-900 relative z-10"
              />
              {!isOwnProfile && (
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
                <h1 className="text-2xl font-bold text-white">{profileUser.displayName}</h1>
                <p className="text-gray-400">@{profileUser.username}</p>
              </div>

              <p className="text-gray-300">{profileUser.bio}</p>

              <div className="flex items-center space-x-4 text-gray-400 text-sm">
                <div className="flex items-center space-x-1">
                  <Calendar className="w-4 h-4" />
                  <span>Joined {profileUser.createdAt.toLocaleDateString()}</span>
                </div>
                <div className="flex items-center space-x-1">
                  <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                  <span>#{profileUser.writersTag}</span>
                </div>
              </div>

              <div className="flex items-center space-x-6 text-sm">
                <button
                  onClick={() => setActiveTab('following')}
                  className="hover:text-white transition-colors"
                >
                  <span className="font-bold text-white">{profileUser.following.length}</span>
                  <span className="text-gray-400 ml-1">Following</span>
                </button>
                <button
                  onClick={() => setActiveTab('followers')}
                  className="hover:text-white transition-colors"
                >
                  <span className="font-bold text-white">{profileUser.followers.length}</span>
                  <span className="text-gray-400 ml-1">Followers</span>
                </button>
                <div>
                  <span className="font-bold text-white">{userPosts.length}</span>
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
              { key: 'posts', label: 'Posts', count: userPosts.length },
              { key: 'followers', label: 'Followers', count: profileUser.followers.length },
              { key: 'following', label: 'Following', count: profileUser.following.length }
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
                  <p className="text-gray-400">No posts yet</p>
                </div>
              ) : (
                userPosts.map(post => (
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
      </div>
    </div>
  );
};

export default UserProfile;