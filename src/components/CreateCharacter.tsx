import React, { useState } from 'react';
import { X, Camera, Palette, Type } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { useAuth } from '../contexts/AuthContext';
import { Character } from '../types';

interface CreateCharacterProps {
  onClose: () => void;
}

const CreateCharacter: React.FC<CreateCharacterProps> = ({ onClose }) => {
  const { addCharacter } = useApp();
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    username: '',
    name: '',
    title: '',
    bio: '',
    universe: '',
    verseTag: '',
    traits: '',
    customColor: '#8b5cf6',
    customFont: 'Inter'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const newCharacter: Character = {
      id: Date.now().toString(),
      username: formData.username,
      name: formData.name,
      title: formData.title,
      avatar: 'https://images.pexels.com/photos/1382734/pexels-photo-1382734.jpeg?auto=compress&cs=tinysrgb&w=150&h=150',
      headerImage: 'https://images.pexels.com/photos/1323550/pexels-photo-1323550.jpeg?auto=compress&cs=tinysrgb&w=800&h=300',
      bio: formData.bio,
      universe: formData.universe,
      verseTag: formData.verseTag,
      traits: formData.traits.split(',').map(t => t.trim()).filter(t => t),
      userId: user.id,
      customColor: formData.customColor,
      customFont: formData.customFont,
      createdAt: new Date()
    };

    addCharacter(newCharacter);
    onClose();
  };

  const fontOptions = [
    'Inter', 'Roboto', 'Open Sans', 'Lato', 'Montserrat',
    'Playfair Display', 'Crimson Text', 'Merriweather',
    'Courier New', 'Georgia'
  ];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-2xl border border-gray-700/50 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-gray-900 border-b border-gray-700/50 p-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">Create New Character</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-800 rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Character Username *
              </label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white focus:border-purple-500 focus:outline-none"
                placeholder="character_username"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Character Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white focus:border-purple-500 focus:outline-none"
                placeholder="Character's full name"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Title/Role *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white focus:border-purple-500 focus:outline-none"
                placeholder="e.g., Elven Ranger, Detective, Wizard"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Universe *
              </label>
              <input
                type="text"
                value={formData.universe}
                onChange={(e) => setFormData(prev => ({ ...prev, universe: e.target.value }))}
                className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white focus:border-purple-500 focus:outline-none"
                placeholder="e.g., Middle Earth, Marvel Universe"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Verse Tag *
              </label>
              <input
                type="text"
                value={formData.verseTag}
                onChange={(e) => setFormData(prev => ({ ...prev, verseTag: e.target.value }))}
                className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white focus:border-purple-500 focus:outline-none"
                placeholder="e.g., Marvel, Fantasy, SciFi"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Character Color
              </label>
              <div className="flex items-center space-x-3">
                <input
                  type="color"
                  value={formData.customColor}
                  onChange={(e) => setFormData(prev => ({ ...prev, customColor: e.target.value }))}
                  className="w-12 h-12 rounded-lg border border-gray-600 bg-gray-800"
                />
                <div className="flex-1">
                  <input
                    type="text"
                    value={formData.customColor}
                    onChange={(e) => setFormData(prev => ({ ...prev, customColor: e.target.value }))}
                    className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white focus:border-purple-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Bio *
            </label>
            <textarea
              value={formData.bio}
              onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
              rows={4}
              className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white focus:border-purple-500 focus:outline-none resize-none"
              placeholder="Describe your character's background, personality, and story..."
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Traits (comma-separated)
            </label>
            <input
              type="text"
              value={formData.traits}
              onChange={(e) => setFormData(prev => ({ ...prev, traits: e.target.value }))}
              className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white focus:border-purple-500 focus:outline-none"
              placeholder="e.g., Brave, Mysterious, Loyal, Cunning"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Custom Font
            </label>
            <select
              value={formData.customFont}
              onChange={(e) => setFormData(prev => ({ ...prev, customFont: e.target.value }))}
              className="w-full bg-gray-800 border border-gray-600 rounded-lg px-4 py-3 text-white focus:border-purple-500 focus:outline-none"
            >
              {fontOptions.map(font => (
                <option key={font} value={font} style={{ fontFamily: font }}>
                  {font}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end space-x-4 pt-6 border-t border-gray-700/50">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 text-gray-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold px-6 py-2 rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-200"
            >
              Create Character
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateCharacter;