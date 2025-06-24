import React, { useState, useEffect } from 'react';
import { Search, TrendingUp, Hash, Users, Sparkles, UserPlus, UserMinus } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { useAuth } from '../contexts/AuthContext';
import CharacterCard from '../components/CharacterCard';
import PostCard from '../components/PostCard';

const ExplorePage: React.FC = () => {
  const { user } = useAuth();
  const { posts, characters, searchContent, getRecommendations, likePost, repostPost, followUser, unfollowUser } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'trending' | 'tags' | 'characters' | 'writers' | 'search'>('trending');
  const [searchResults, setSearchResults] = useState<{
    posts: any[];
    characters: any[];
    users: any[];
  }>({ posts: [], characters: [], users: [] });
  const [recommendations, setRecommendations] = useState<{
    writers: any[];
    characters: any[];
  }>({ writers: [], characters: [] });

  // Load recommendations on component mount
  useEffect(() => {
    const recs = getRecommendations();
    setRecommendations(recs);
  }, [getRecommendations]);

  // Handle search
  useEffect(() => {
    if (searchQuery.trim()) {
      const results = searchContent(searchQuery);
      setSearchResults(results);
      setActiveTab('search');
    }
  }, [searchQuery, searchContent]);

  // Extract trending tags from posts
  const trendingTags = posts
    .flatMap(post => post.tags)
    .reduce((acc, tag) => {
      acc[tag] = (acc[tag] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

  const sortedTags = Object.entries(trendingTags)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 10);

  // Get verse tags from characters
  const verseTags = characters
    .map(char => char.verseTag)
    .filter((tag, index, arr) => arr.indexOf(tag) === index)
    .slice(0, 8);

  // Get unique writers
  const uniqueWriters = Array.from(
    new Map(
      posts
        .filter(post => post.user && post.userId !== user?.id)
        .map(post => post.user!)
        .map(user => [user.id, user])
    ).values()
  ).slice(0, 10);

  const handleLike = (postId: string) => {
    likePost(postId);
  };

  const handleRepost = (postId: string) => {
    repostPost(postId);
  };

  const handleFollowUser = (userId: string) => {
    if (user?.following.includes(userId)) {
      unfollowUser(userId);
    } else {
      followUser(userId);
    }
  };

  return (
    <div className="min-h-screen bg-black/10 backdrop-blur-sm">
      <div className="sticky top-0 bg-black/80 backdrop-blur-md border-b border-gray-700/50 p-4 z-10">
        <h2 className="text-xl font-bold text-white mb-4">Explore</h2>
        
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search posts, characters, tags, or writers..."
            className="w-full bg-gray-800 border border-gray-600 rounded-full pl-10 pr-4 py-3 text-white focus:border-purple-500 focus:outline-none"
          />
        </div>

        <div className="flex space-x-1 overflow-x-auto">
          {[
            { key: 'trending', label: 'Trending', icon: TrendingUp },
            { key: 'tags', label: 'Tags', icon: Hash },
            { key: 'characters', label: 'Characters', icon: Users },
            { key: 'writers', label: 'Writers', icon: UserPlus },
            ...(searchQuery ? [{ key: 'search', label: 'Search Results', icon: Search }] : [])
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-full transition-colors whitespace-nowrap ${
                activeTab === tab.key
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="p-6">
        {activeTab === 'trending' && (
          <div className="space-y-6">
            {/* Recommendations */}
            {recommendations.characters.length > 0 && (
              <div className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700/50">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center space-x-2">
                  <Sparkles className="w-5 h-5 text-purple-400" />
                  <span>Recommended for You</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {recommendations.characters.slice(0, 4).map(character => (
                    <CharacterCard 
                      key={character.id} 
                      character={character} 
                      showActions={false}
                      showFollowButton={true}
                    />
                  ))}
                </div>
              </div>
            )}

            <div className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700/50">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center space-x-2">
                <TrendingUp className="w-5 h-5 text-purple-400" />
                <span>Trending Now</span>
              </h3>
              <div className="space-y-3">
                {sortedTags.length > 0 ? sortedTags.map(([tag, count]) => (
                  <div key={tag} className="flex items-center justify-between p-3 hover:bg-gray-700/30 rounded-lg cursor-pointer transition-colors">
                    <div>
                      <p className="text-purple-400 font-medium">#{tag}</p>
                      <p className="text-gray-500 text-sm">{count} posts</p>
                    </div>
                  </div>
                )) : (
                  <p className="text-gray-400 text-center py-4">No trending tags yet</p>
                )}
              </div>
            </div>

            <div className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700/50">
              <h3 className="text-lg font-bold text-white mb-4">Popular Verses</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {verseTags.map(tag => (
                  <div key={tag} className="bg-purple-900/30 rounded-lg p-3 hover:bg-purple-900/50 cursor-pointer transition-colors">
                    <p className="text-purple-300 font-medium">#{tag}</p>
                    <p className="text-gray-400 text-sm">
                      {characters.filter(c => c.verseTag === tag).length} characters
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'tags' && (
          <div className="space-y-4">
            {sortedTags.length > 0 ? sortedTags.map(([tag, count]) => (
              <div key={tag} className="bg-gray-800/50 rounded-xl p-4 border border-gray-700/50 hover:bg-gray-700/30 cursor-pointer transition-colors">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-purple-400 font-bold text-lg">#{tag}</h4>
                    <p className="text-gray-400">{count} posts</p>
                  </div>
                  <Hash className="w-6 h-6 text-purple-400" />
                </div>
              </div>
            )) : (
              <div className="text-center py-12">
                <Hash className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">No tags found</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'characters' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {characters.length > 0 ? characters.map(character => (
              <CharacterCard 
                key={character.id} 
                character={character} 
                showActions={false}
                showFollowButton={character.userId !== user?.id}
              />
            )) : (
              <div className="col-span-full text-center py-12">
                <Users className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">No characters found</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'writers' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {uniqueWriters.length > 0 ? uniqueWriters.map(writer => (
              <div key={writer.id} className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700/50 hover:bg-gray-700/30 transition-colors">
                <div className="flex items-center space-x-4 mb-4">
                  <img
                    src={writer.avatar}
                    alt={writer.displayName}
                    className="w-16 h-16 rounded-full object-cover ring-2 ring-purple-500/30"
                  />
                  <div className="flex-1">
                    <h3 className="text-white font-bold text-lg">{writer.displayName}</h3>
                    <p className="text-gray-400">@{writer.username}</p>
                    <p className="text-purple-300 text-sm">#{writer.writersTag}</p>
                  </div>
                  <button
                    onClick={() => handleFollowUser(writer.id)}
                    className={`flex items-center space-x-1 px-3 py-1 rounded-full text-sm transition-colors ${
                      user?.following.includes(writer.id)
                        ? 'bg-gray-600 text-white hover:bg-gray-700'
                        : 'bg-purple-600 text-white hover:bg-purple-700'
                    }`}
                  >
                    {user?.following.includes(writer.id) ? (
                      <>
                        <UserMinus className="w-3 h-3" />
                        <span>Unfollow</span>
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-3 h-3" />
                        <span>Follow</span>
                      </>
                    )}
                  </button>
                </div>
                <p className="text-gray-300 text-sm">{writer.bio}</p>
              </div>
            )) : (
              <div className="col-span-full text-center py-12">
                <UserPlus className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">No writers found</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'search' && searchQuery && (
          <div className="space-y-6">
            {/* Search Results for Posts */}
            {searchResults.posts.length > 0 && (
              <div>
                <h3 className="text-lg font-bold text-white mb-4">Posts</h3>
                <div className="space-y-4">
                  {searchResults.posts.map(post => (
                    <PostCard
                      key={post.id}
                      post={post}
                      onLike={() => handleLike(post.id)}
                      onRepost={() => handleRepost(post.id)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Search Results for Characters */}
            {searchResults.characters.length > 0 && (
              <div>
                <h3 className="text-lg font-bold text-white mb-4">Characters</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {searchResults.characters.map(character => (
                    <CharacterCard 
                      key={character.id} 
                      character={character} 
                      showActions={false}
                      showFollowButton={character.userId !== user?.id}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Search Results for Writers */}
            {searchResults.users.length > 0 && (
              <div>
                <h3 className="text-lg font-bold text-white mb-4">Writers</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {searchResults.users.map(writer => (
                    <div key={writer.id} className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700/50 hover:bg-gray-700/30 transition-colors">
                      <div className="flex items-center space-x-4 mb-4">
                        <img
                          src={writer.avatar}
                          alt={writer.displayName}
                          className="w-16 h-16 rounded-full object-cover ring-2 ring-purple-500/30"
                        />
                        <div className="flex-1">
                          <h3 className="text-white font-bold text-lg">{writer.displayName}</h3>
                          <p className="text-gray-400">@{writer.username}</p>
                          <p className="text-purple-300 text-sm">#{writer.writersTag}</p>
                        </div>
                        <button
                          onClick={() => handleFollowUser(writer.id)}
                          className={`flex items-center space-x-1 px-3 py-1 rounded-full text-sm transition-colors ${
                            user?.following.includes(writer.id)
                              ? 'bg-gray-600 text-white hover:bg-gray-700'
                              : 'bg-purple-600 text-white hover:bg-purple-700'
                          }`}
                        >
                          {user?.following.includes(writer.id) ? (
                            <>
                              <UserMinus className="w-3 h-3" />
                              <span>Unfollow</span>
                            </>
                          ) : (
                            <>
                              <UserPlus className="w-3 h-3" />
                              <span>Follow</span>
                            </>
                          )}
                        </button>
                      </div>
                      <p className="text-gray-300 text-sm">{writer.bio}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* No Results */}
            {searchResults.posts.length === 0 && searchResults.characters.length === 0 && searchResults.users.length === 0 && (
              <div className="text-center py-12">
                <Search className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-400 mb-2">No results found</h3>
                <p className="text-gray-500">Try adjusting your search terms</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ExplorePage;