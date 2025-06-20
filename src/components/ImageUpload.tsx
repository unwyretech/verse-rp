import React, { useRef, useState } from 'react';
import { Camera, Upload, X } from 'lucide-react';
import { uploadImage } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface ImageUploadProps {
  currentImage?: string;
  onImageChange: (imageUrl: string) => void;
  type: 'avatar' | 'header';
  className?: string;
}

const ImageUpload: React.FC<ImageUploadProps> = ({ 
  currentImage, 
  onImageChange, 
  type, 
  className = '' 
}) => {
  const { user } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const handleFileSelect = async (file: File) => {
    if (!user || !file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB');
      return;
    }

    setUploading(true);
    try {
      const bucket = type === 'avatar' ? 'avatars' : 'headers';
      const path = `${user.id}/${type}_${Date.now()}.${file.name.split('.').pop()}`;
      
      const imageUrl = await uploadImage(file, bucket, path);
      if (imageUrl) {
        onImageChange(imageUrl);
      } else {
        alert('Failed to upload image');
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  return (
    <div className={`relative group ${className}`}>
      <div
        onClick={handleClick}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`relative cursor-pointer transition-all duration-200 ${
          dragOver ? 'scale-105 opacity-80' : ''
        } ${
          type === 'avatar' 
            ? 'w-32 h-32 rounded-full' 
            : 'w-full h-48 rounded-lg'
        } overflow-hidden bg-gray-800 border-2 border-dashed border-gray-600 hover:border-purple-500`}
      >
        {currentImage ? (
          <img
            src={currentImage}
            alt={type}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-center">
              <Camera className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-400 text-sm">
                {type === 'avatar' ? 'Upload Avatar' : 'Upload Header'}
              </p>
            </div>
          </div>
        )}

        {/* Overlay */}
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
          {uploading ? (
            <div className="text-white text-center">
              <div className="animate-spin w-6 h-6 border-2 border-white border-t-transparent rounded-full mx-auto mb-2"></div>
              <p className="text-sm">Uploading...</p>
            </div>
          ) : (
            <div className="text-white text-center">
              <Upload className="w-6 h-6 mx-auto mb-2" />
              <p className="text-sm">
                {currentImage ? 'Change' : 'Upload'} {type}
              </p>
            </div>
          )}
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFileSelect(file);
        }}
        className="hidden"
      />

      {dragOver && (
        <div className="absolute inset-0 bg-purple-500/20 border-2 border-purple-500 rounded-lg flex items-center justify-center">
          <p className="text-purple-300 font-medium">Drop image here</p>
        </div>
      )}
    </div>
  );
};

export default ImageUpload;