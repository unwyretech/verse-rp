import React, { useState } from 'react';
import Timeline from '../components/Timeline';
import CreatePost from '../components/CreatePost';
import { useApp } from '../contexts/AppContext';
import { useAuth } from '../contexts/AuthContext';
import { Post, Character } from '../types';

const HomePage: React.FC = () => {
  const { posts, characters, selectedCharacter, addPost, likePost, repostPost } = useApp();
  const { user } = useAuth();
  const [showCreatePost, setShowCreatePost] = useState(false);

  const handleCreatePost = (content: string, character?: Character, mediaUrls?: string[]) => {
    if (!user) return;

    addPost({
      content,
      characterId: character?.id,
      character,
      userId: user.id,
      user,
      isThread: false,
      visibility: 'public',
      tags: content.match(/#\w+/g) || [],
      mediaUrls
    });
    setShowCreatePost(false);
  };

  const handleLike = (postId: string) => {
    likePost(postId);
  };

  const handleRepost = (postId: string) => {
    repostPost(postId);
  };

  return (
    <>
      <Timeline 
        posts={posts}
        onLike={handleLike}
        onRepost={handleRepost}
        onCreatePost={() => setShowCreatePost(true)}
      />
      
      {showCreatePost && (
        <CreatePost
          characters={characters}
          selectedCharacter={selectedCharacter}
          onCreatePost={handleCreatePost}
          onClose={() => setShowCreatePost(false)}
        />
      )}
    </>
  );
};

export default HomePage;