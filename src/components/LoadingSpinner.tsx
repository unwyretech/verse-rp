import React from 'react';
import { Feather } from 'lucide-react';

const LoadingSpinner: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="text-center">
        <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Feather className="w-8 h-8 text-white animate-pulse" />
        </div>
        <div className="space-y-2">
          <p className="text-white text-lg font-medium">Loading VERSE...</p>
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-400"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoadingSpinner;