import React, { useState } from 'react';
import { X, Palette, Type } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { Character } from '../types';
import ImageUpload from './ImageUpload';

interface EditCharacterProps {
  character: Character;
  onClose: () => void;
}

const EditCharacter: React.FC<EditCharacterProps> = ({ character, onClose }) => {
  const { updateCharacter } = useApp();
  const [formData, setFormData] = useState({
    username: character.username,
    name: character.name,
    title: character.title,
    bio: character.bio,
    universe: character.universe,
    verseTag: character.verseTag,
    traits: character.traits.join(', '),
    customColor: character.customColor,
    customFont: character.customFont,
    avatar: character.avatar,
    headerImage: character.headerImage
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const updatedCharacter: Partial<Character> = {
      username: formData.username,
      name: formData.name,
      title: formData.title,
      bio: formData.bio,
      universe: formData.universe,
      verseTag: formData.verseTag,
      traits: formData.traits.split(',').map(t => t.trim()).filter(t => t),
      customColor: formData.customColor,
      customFont: formData.customFont,
      avatar: formData.avatar,
      headerImage: formData.headerImage
    };

    updateCharacter(character.id, updatedCharacter);
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
          <h2 className="text-lg font-bold text-white">Edit Character</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-800 rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Header Image Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Header Image
            </label>
            <ImageUpload
              currentImage={formData.headerImage}
              onImageChange={(url) => setFormData(prev => ({ ...prev, headerImage: url }))}
              type="header"
            />
          </div>

          {/* Avatar Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Avatar
            </label>
            <ImageUpload
              currentImage={formData.avatar}
              onImageChange={(url) => setFormData(prev => ({ ...prev, avatar: url }))}
              type="avatar"
              className="w-32"
            />
          </div>

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
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditCharacter;