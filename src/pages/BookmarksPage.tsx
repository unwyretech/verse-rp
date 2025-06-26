import React, { useState } from 'react';
import { Bookmark, Search, Filter } from 'lucide-react';
import PostCard from '../components/PostCard';
import CharacterCard from '../components/CharacterCard';
import UserProfile from '../components/UserProfile';
import CharacterProfile from '../components/CharacterProfile';
import { useApp } from '../contexts/AppContext';
import { useAuth } from '../contexts/AuthContext';

const BookmarksPage: React.FC = () => {
  const { user } = useAuth();
  const { 
    posts, 
    characters, 
    allUsers, 
    bookmarkedPosts, 
    bookmarkedCharacters, 
    bookmarkedUsers,
    likePost, 
    repostPost 
  } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterBy, setFilterBy] = useState<'all' | 'posts' | 'characters' | 'writers'>('all');
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [selectedCharacter, setSelectedCharacter] = useState<any>(null);

  // Get bookmarked items
  const bookmarkedPostsData = posts.filter(post => bookmarkedPosts.includes(post.id));
  const bookmarkedCharactersData = characters.filter(char => bookmarkedCharacters.includes(char.id));
  const bookmarkedUsersData = allUsers.filter(user => bookmarkedUsers.includes(user.id));

  // Filter based on search and filter type
  const getFilteredItems = () => {
    const lowerQuery = searchQuery.toLowerCase();
    
    let filteredPosts = bookmarkedPostsData;
    let filteredCharacters = bookmarkedCharactersData;
    let filteredUsers = bookmarkedUsersData;

    if (searchQuery) {
      filteredPosts = filteredPosts.filter(post =>
        post.content.toLowerCase().includes(lowerQuery) ||
        post.character?.name.toLowerCase().includes(lowerQuery) ||
        post.user?.displayName.toLowerCase().includes(lowerQuery)
      );
      
      filteredCharacters = filteredCharacters.filter(char =>
        char.name.toLowerCase().includes(lowerQuery) ||
        char.username.toLowerCase().includes(lowerQuery) ||
        char.verseTag.toLowerCase().includes(lowerQuery)
      );
      
      filteredUsers = filteredUsers.filter(user =>
        user.displayName.toLowerCase().includes(lowerQuery) ||
        user.username.toLowerCase().includes(lowerQuery) ||
        user.writersTag.toLowerCase().includes(lowerQuery)
      );
    }

    return { filteredPosts, filteredCharacters, filteredUsers };
  };

  const { filteredPosts, filteredCharacters, filteredUsers } = getFilteredItems();

  const handleLike = (postId: string) => {
    likePost(postId);
  };

  const handleRepost = (postId: string) => {
    repostPost(postId);
  };

  const handleUserClick = (clickedUser: any) => {
    setSelectedUser(clickedUser);
  };

  const handleCharacterClick = (character: any) => {
    setSelectedCharacter(character);
  };

  const showPosts = filterBy === 'all' || filterBy === 'posts';
  const showCharacters = filterBy === 'all' || filterBy === 'characters';
  const showWriters = filterBy === 'all' || filterBy === 'writers';

  const hasResults = (showPosts && filteredPosts.length > 0) || 
                   (showCharacters && filteredCharacters.length > 0) || 
                   (showWriters && filteredUsers.length > 0);

  return (
    <>
      <div className="min-h-screen bg-black/10 backdrop-blur-sm">
        <div className="sticky top-0 bg-black/80 backdrop-blur-md border-b border-gray-700/50 p-4 z-10">
          <h2 className="text-xl font-bold text-white mb-4">Bookmarks</h2>
          
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search bookmarks..."
                className="w-full bg-gray-800 border border-gray-600 rounded-full pl-10 pr-4 py-3 text-white focus:border-purple-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <div className="flex space-x-1">
                {[
                  { key: 'all', label: 'All' },
                  { key: 'posts', label: 'Posts' },
                  { key: 'characters', label: 'Characters' },
                  { key: 'writers', label: 'Writers' }
                ].map(filter => (
                  <button
                    key={filter.key}
                    onClick={() => setFilterBy(filter.key as any)}
                    className={`px-3 py-1 rounded-full text-sm transition-colors ${
                      filterBy === filter.key
                        ? 'bg-purple-600 text-white'
                        : 'text-gray-400 hover:text-white hover:bg-gray-800'
                    }`}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-8">
          {!hasResults ? (
            <div className="text-center py-12">
              <Bookmark className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-400 mb-2">
                {searchQuery ? 'No matching bookmarks' : 'No bookmarks yet'}
              </h3>
              <p className="text-gray-500">
                {searchQuery 
                  ? 'Try adjusting your search or filter criteria'
                  : 'Save posts, characters, and writers you want to revisit later'
                }
              </p>
            </div>
          ) : (
            <>
              {/* Bookmarked Posts */}
              {showPosts && filteredPosts.length > 0 && (
                <div>
                  <h3 className="text-lg font-bold text-white mb-4">Bookmarked Posts</h3>
                  <div className="space-y-4">
                    {filteredPosts.map((post) => (
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

              {/* Bookmarked Characters */}
              {showCharacters && filteredCharacters.length > 0 && (
                <div>
                  <h3 className="text-lg font-bold text-white mb-4">Bookmarked Characters</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {filteredCharacters.map(character => (
                      <div key={character.id} onClick={() => handleCharacterClick(character)}>
                        <CharacterCard 
                          character={character} 
                          showActions={false}
                          showFollowButton={character.userId !== user?.id}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Bookmarked Writers */}
              {showWriters && filteredUsers.length > 0 && (
                <div>
                  <h3 className="text-lg font-bold text-white mb-4">Bookmarked Writers</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {filteredUsers.map(writer => (
                      <div 
                        key={writer.id} 
                        onClick={() => handleUserClick(writer)}
                        className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700/50 hover:bg-gray-700/30 transition-colors cursor-pointer"
                      >
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
                        </div>
                        <p className="text-gray-300 text-sm">{writer.bio}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 text-center border-t border-gray-700/50 bg-black/20">
          <p className="text-gray-500 text-sm">
            Verse © {new Date().getFullYear()} - UNWYRE TECH AND CONSULTING
          </p>
        </div>
      </div>

      {/* User Profile Modal */}
      {selectedUser && (
        <UserProfile
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
        />
      )}

      {/* Character Profile Modal */}
      {selectedCharacter && (
        <CharacterProfile
          character={selectedCharacter}
          onClose={() => setSelectedCharacter(null)}
        />
      )}
    </>
  );
};

export default BookmarksPage;