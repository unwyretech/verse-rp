import React from 'react';
import { Feather } from 'lucide-react';

const LoadingSpinner: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse">
          <Feather className="w-8 h-8 text-white animate-bounce" />
        </div>
        <p className="text-gray-400">Loading CharacterVerse...</p>
      </div>
    </div>
  );
};

export default LoadingSpinner;