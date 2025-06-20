import React, { useState } from 'react';
import { Edit3, Trash2, Palette } from 'lucide-react';
import { Character } from '../types';
import EditCharacter from './EditCharacter';

interface CharacterCardProps {
  character: Character;
  onEdit?: () => void;
  onDelete?: () => void;
  showActions?: boolean;
}

const CharacterCard: React.FC<CharacterCardProps> = ({ 
  character, 
  onEdit, 
  onDelete, 
  showActions = true 
}) => {
  const [showEditModal, setShowEditModal] = useState(false);

  const handleEdit = () => {
    if (onEdit) {
      onEdit();
    } else {
      setShowEditModal(true);
    }
  };

  return (
    <>
      <div className="bg-gray-800/50 rounded-2xl border border-gray-700/50 overflow-hidden hover:bg-gray-700/30 transition-colors">
        <div className="relative h-32 bg-gradient-to-r from-purple-600 to-pink-600">
          <img
            src={character.headerImage}
            alt={`${character.name} header`}
            className="w-full h-full object-cover"
          />
          {showActions && (
            <div className="absolute top-3 right-3 flex space-x-2">
              <button
                onClick={handleEdit}
                className="p-2 bg-black/50 hover:bg-black/70 rounded-full transition-colors"
              >
                <Edit3 className="w-4 h-4 text-white" />
              </button>
              {onDelete && (
                <button
                  onClick={onDelete}
                  className="p-2 bg-black/50 hover:bg-red-600/70 rounded-full transition-colors"
                >
                  <Trash2 className="w-4 h-4 text-white" />
                </button>
              )}
            </div>
          )}
        </div>

        <div className="p-6">
          <div className="flex items-center space-x-4 -mt-12 mb-4">
            <img
              src={character.avatar}
              alt={character.name}
              className="w-16 h-16 rounded-full object-cover ring-4 ring-gray-800 bg-gray-800"
            />
            <div className="flex items-center space-x-2 mt-8">
              <div
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: character.customColor }}
              ></div>
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
              <div className="flex items-center space-x-2 text-gray-400 text-sm">
                <Palette className="w-4 h-4" />
                <span style={{ fontFamily: character.customFont }}>
                  {character.customFont}
                </span>
              </div>
              <span className="text-gray-500 text-xs">
                {character.createdAt.toLocaleDateString()}
              </span>
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
    </>
  );
};

export default CharacterCard;