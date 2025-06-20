import React from 'react';
import { Character } from '../types';
import { Users, Sparkles } from 'lucide-react';

interface CharacterPanelProps {
  characters: Character[];
  selectedCharacter: Character | null;
  onSelectCharacter: (character: Character) => void;
}

const CharacterPanel: React.FC<CharacterPanelProps> = ({ 
  characters, 
  selectedCharacter, 
  onSelectCharacter 
}) => {
  return (
    <div className="w-80 h-screen sticky top-0 p-6 bg-black/20 backdrop-blur-sm">
      <div className="space-y-6">
        <div className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700/50">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-lg font-bold text-white">Your Characters</h2>
          </div>

          <div className="space-y-3 max-h-64 overflow-y-auto">
            {characters.map((character) => (
              <button
                key={character.id}
                onClick={() => onSelectCharacter(character)}
                className={`w-full text-left p-3 rounded-xl transition-all duration-200 ${
                  selectedCharacter?.id === character.id
                    ? 'bg-purple-600/30 border border-purple-500/50'
                    : 'hover:bg-gray-700/50'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <img
                    src={character.avatar}
                    alt={character.name}
                    className="w-10 h-10 rounded-full object-cover ring-2 ring-purple-500/30"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium truncate">{character.name}</p>
                    <p className="text-purple-300 text-sm truncate">{character.title}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {selectedCharacter && (
          <div className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700/50">
            <div className="flex items-center space-x-3 mb-4">
              <Sparkles className="w-6 h-6 text-purple-400" />
              <h3 className="text-lg font-bold text-white">Character Profile</h3>
            </div>

            <div className="space-y-4">
              <div className="text-center">
                <img
                  src={selectedCharacter.avatar}
                  alt={selectedCharacter.name}
                  className="w-20 h-20 rounded-full object-cover mx-auto ring-4 ring-purple-500/30 mb-3"
                />
                <h4 className="text-white font-bold text-lg">{selectedCharacter.name}</h4>
                <p className="text-purple-300">{selectedCharacter.title}</p>
              </div>

              <div className="bg-purple-900/30 rounded-lg p-3">
                <p className="text-purple-200 text-sm font-medium mb-1">Universe</p>
                <p className="text-white">{selectedCharacter.universe}</p>
              </div>

              <div>
                <p className="text-gray-300 text-sm leading-relaxed">{selectedCharacter.bio}</p>
              </div>

              <div>
                <p className="text-purple-200 text-sm font-medium mb-2">Traits</p>
                <div className="flex flex-wrap gap-2">
                  {selectedCharacter.traits.map((trait) => (
                    <span
                      key={trait}
                      className="px-2 py-1 bg-gray-700/50 text-gray-300 text-xs rounded-full"
                    >
                      {trait}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="bg-gray-800/50 rounded-2xl p-6 border border-gray-700/50">
          <h3 className="text-white font-bold mb-3">Trending in Community</h3>
          <div className="space-y-3">
            {[
              { tag: '#FantasyRP', posts: '2.1K posts' },
              { tag: '#SciFiChronicles', posts: '1.8K posts' },
              { tag: '#VictorianMystery', posts: '954 posts' },
              { tag: '#ModernMagic', posts: '743 posts' }
            ].map((trend) => (
              <div key={trend.tag} className="hover:bg-gray-700/30 p-2 rounded-lg cursor-pointer transition-colors">
                <p className="text-purple-400 font-medium">{trend.tag}</p>
                <p className="text-gray-500 text-sm">{trend.posts}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CharacterPanel;