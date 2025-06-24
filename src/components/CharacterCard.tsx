import React, { useState } from 'react';
import { Edit3, Trash2, Palette, Eye, UserPlus, UserMinus } from 'lucide-react';
import { Character } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { useApp } from '../contexts/AppContext';
import EditCharacter from './EditCharacter';
import CharacterProfile from './CharacterProfile';

interface CharacterCardProps {
  character: Character;
  onEdit?: () => void;
  onDelete?: () => void;
  showActions?: boolean;
  showFollowButton?: boolean;
}

const CharacterCard: React.FC<CharacterCardProps> = ({ 
  character, 
  onEdit, 
  onDelete, 
  showActions = true,
  showFollowButton = false
}) => {
  const { user } = useAuth();
  const { deleteCharacter, followCharacter, unfollowCharacter } = useApp();
  const [showEditModal, setShowEditModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);

  const isOwnCharacter = character.userId === user?.id;
  const isFollowing = character.followers.includes(user?.id || '');

  const handleEdit = () => {
    if (onEdit) {
      onEdit();
    } else {
      setShowEditModal(true);
    }
  };

  const handleDelete = () => {
    if (window.confirm('Are you sure you want to delete this character?')) {
      if (onDelete) {
        onDelete();
      } else {
        deleteCharacter(character.id);
      }
    }
  };

  const handleFollow = () => {
    if (isFollowing) {
      unfollowCharacter(character.id);
    } else {
      followCharacter(character.id);
    }
  };

  const handleViewProfile = () => {
    setShowProfileModal(true);
  };

  return (
    <>
      <div 
        className="rounded-2xl border border-gray-700/50 overflow-hidden hover:bg-gray-700/30 transition-colors cursor-pointer"
        style={{ backgroundColor: `${character.customColor}20` }}
        onClick={handleViewProfile}
      >
        <div className="relative h-32">
          <img
            src={character.headerImage}
            alt={`${character.name} header`}
            className="w-full h-full object-cover"
          />
          {showActions && isOwnCharacter && (
            <div className="absolute top-3 right-3 flex space-x-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleEdit();
                }}
                className="p-2 bg-black/50 hover:bg-black/70 rounded-full transition-colors"
              >
                <Edit3 className="w-4 h-4 text-white" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDelete();
                }}
                className="p-2 bg-black/50 hover:bg-red-600/70 rounded-full transition-colors"
              >
                <Trash2 className="w-4 h-4 text-white" />
              </button>
            </div>
          )}
        </div>

        <div className="p-6">
          <div className="flex items-center space-x-4 -mt-12 mb-4">
            <img
              src={character.avatar}
              alt={character.name}
              className="w-16 h-16 rounded-full object-cover ring-4 ring-gray-800 bg-gray-800 relative z-10"
            />
            <div className="flex items-center space-x-2 mt-8">
              <span className="text-purple-300 text-sm">#{character.verseTag}</span>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <h3 className="text-white font-bold text-lg">{character.name}</h3>
              <p className="text-purple-300">{character.title}</p>
              <p className="text-gray-400 text-sm">@{character.username}</p>
            </div>

            <p className="text-gray-300 text-sm line-clamp-3">{character.bio}</p>

            <div className="flex flex-wrap gap-2">
              {character.traits.slice(0, 3).map((trait) => (
                <span
                  key={trait}
                  className="px-2 py-1 bg-gray-700/50 text-gray-300 text-xs rounded-full"
                >
                  {trait}
                </span>
              ))}
              {character.traits.length > 3 && (
                <span className="px-2 py-1 bg-gray-700/50 text-gray-400 text-xs rounded-full">
                  +{character.traits.length - 3} more
                </span>
              )}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-gray-700/50">
              <div className="flex items-center space-x-4 text-gray-400 text-sm">
                <span>{character.followers.length} followers</span>
                <span>{character.following.length} following</span>
              </div>
              
              {showFollowButton && !isOwnCharacter && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleFollow();
                  }}
                  className={`flex items-center space-x-1 px-3 py-1 rounded-full text-sm transition-colors ${
                    isFollowing
                      ? 'bg-gray-600 text-white hover:bg-gray-700'
                      : 'bg-purple-600 text-white hover:bg-purple-700'
                  }`}
                >
                  {isFollowing ? (
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
              )}

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleViewProfile();
                }}
                className="flex items-center space-x-1 px-3 py-1 bg-gray-700 text-white rounded-full text-sm hover:bg-gray-600 transition-colors"
              >
                <Eye className="w-3 h-3" />
                <span>View</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {showEditModal && (
        <EditCharacter
          character={character}
          onClose={() => setShowEditModal(false)}
        />
      )}

      {showProfileModal && (
        <CharacterProfile
          character={character}
          onClose={() => setShowProfileModal(false)}
        />
      )}
    </>
  );
};

export default CharacterCard;