import React, { useState } from 'react';
import Timeline from '../components/Timeline';
import CharacterPanel from '../components/CharacterPanel';
import CreatePost from '../components/CreatePost';
import { useApp } from '../contexts/AppContext';
import { useAuth } from '../contexts/AuthContext';
import { Post, Character } from '../types';

const HomePage: React.FC = () => {
  const { posts, characters, selectedCharacter, setSelectedCharacter, addPost, updatePost } = useApp();
  const { user } = useAuth();
  const [showCreatePost, setShowCreatePost] = useState(false);

  const handleCreatePost = (content: string, character?: Character) => {
    const newPost: Post = {
      id: Date.now().toString(),
      content,
      characterId: character?.id,
      character,
      userId: user!.id,
      user,
      timestamp: new Date(),
      likes: 0,
      reposts: 0,
      comments: 0,
      isLiked: false,
      isReposted: false,
      isThread: false,
      visibility: 'public',
      tags: content.match(/#\w+/g) || []
    };
    addPost(newPost);
    setShowCreatePost(false);
  };

  const handleLike = (postId: string) => {
    const post = posts.find(p => p.id === postId);
    if (post) {
      updatePost(postId, {
        isLiked: !post.isLiked,
        likes: post.isLiked ? post.likes - 1 : post.likes + 1
      });
    }
  };

  const handleRepost = (postId: string) => {
    const post = posts.find(p => p.id === postId);
    if (post) {
      updatePost(postId, {
        isReposted: !post.isReposted,
        reposts: post.isReposted ? post.reposts - 1 : post.reposts + 1
      });
    }
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