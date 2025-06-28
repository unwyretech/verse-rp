import React, { useRef, useState } from 'react';
import { Camera, Upload, X, Move, RotateCw } from 'lucide-react';
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
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [showCropModal, setShowCropModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [cropData, setCropData] = useState({
    x: 0,
    y: 0,
    scale: 1,
    rotation: 0
  });

  const targetDimensions = type === 'avatar' 
    ? { width: 350, height: 350 } 
    : { width: 1500, height: 500 };

  const resizeAndCropImage = (file: File): Promise<File> => {
    return new Promise((resolve) => {
      const canvas = canvasRef.current!;
      const ctx = canvas.getContext('2d')!;
      const img = new Image();
      
      img.onload = () => {
        // Set canvas dimensions to target size
        canvas.width = targetDimensions.width;
        canvas.height = targetDimensions.height;
        
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Apply transformations
        ctx.save();
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate((cropData.rotation * Math.PI) / 180);
        ctx.scale(cropData.scale, cropData.scale);
        
        // Calculate image position with crop offset
        const drawWidth = img.width;
        const drawHeight = img.height;
        const drawX = -drawWidth / 2 + cropData.x;
        const drawY = -drawHeight / 2 + cropData.y;
        
        ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);
        ctx.restore();
        
        canvas.toBlob((blob) => {
          if (blob) {
            const resizedFile = new File([blob], file.name, {
              type: file.type,
              lastModified: Date.now()
            });
            resolve(resizedFile);
          }
        }, file.type, 0.9);
      };
      
      img.src = URL.createObjectURL(file);
    });
  };

  const handleFileSelect = async (file: File) => {
    if (!user || !file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      alert('File size must be less than 10MB');
      return;
    }

    setSelectedFile(file);
    setShowCropModal(true);
  };

  const handleCropConfirm = async () => {
    if (!selectedFile || !user) return;

    setUploading(true);
    try {
      const resizedFile = await resizeAndCropImage(selectedFile);
      const bucket = type === 'avatar' ? 'avatars' : 'headers';
      const path = `${user.id}/${type}_${Date.now()}.${resizedFile.name.split('.').pop()}`;
      
      const imageUrl = await uploadImage(resizedFile, bucket, path);
      if (imageUrl) {
        onImageChange(imageUrl);
        setShowCropModal(false);
        setSelectedFile(null);
        setCropData({ x: 0, y: 0, scale: 1, rotation: 0 });
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
    <>
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
                <p className="text-gray-500 text-xs mt-1">
                  {type === 'avatar' ? '350x350' : '1500x500'}
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

      {/* Hidden canvas for image processing */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Crop Modal */}
      {showCropModal && selectedFile && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 rounded-2xl border border-gray-700/50 w-full max-w-2xl">
            <div className="p-4 border-b border-gray-700/50 flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">Adjust Image</h3>
              <button
                onClick={() => {
                  setShowCropModal(false);
                  setSelectedFile(null);
                  setCropData({ x: 0, y: 0, scale: 1, rotation: 0 });
                }}
                className="p-2 hover:bg-gray-800 rounded-full transition-colors"
              >
                <X className="w-6 h-6 text-gray-400" />
              </button>
            </div>

            <div className="p-6">
              <div className="mb-6">
                <div 
                  className={`relative mx-auto border-2 border-gray-600 overflow-hidden ${
                    type === 'avatar' ? 'w-64 h-64 rounded-full' : 'w-full h-40 rounded-lg'
                  }`}
                  style={{ maxWidth: type === 'avatar' ? '256px' : '100%' }}
                >
                  <img
                    src={URL.createObjectURL(selectedFile)}
                    alt="Preview"
                    className="w-full h-full object-cover"
                    style={{
                      transform: `translate(${cropData.x}px, ${cropData.y}px) scale(${cropData.scale}) rotate(${cropData.rotation}deg)`,
                      transformOrigin: 'center'
                    }}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Position X: {cropData.x}px
                  </label>
                  <input
                    type="range"
                    min="-200"
                    max="200"
                    value={cropData.x}
                    onChange={(e) => setCropData(prev => ({ ...prev, x: parseInt(e.target.value) }))}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Position Y: {cropData.y}px
                  </label>
                  <input
                    type="range"
                    min="-200"
                    max="200"
                    value={cropData.y}
                    onChange={(e) => setCropData(prev => ({ ...prev, y: parseInt(e.target.value) }))}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Scale: {cropData.scale.toFixed(1)}x
                  </label>
                  <input
                    type="range"
                    min="0.5"
                    max="3"
                    step="0.1"
                    value={cropData.scale}
                    onChange={(e) => setCropData(prev => ({ ...prev, scale: parseFloat(e.target.value) }))}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Rotation: {cropData.rotation}°
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="360"
                    value={cropData.rotation}
                    onChange={(e) => setCropData(prev => ({ ...prev, rotation: parseInt(e.target.value) }))}
                    className="w-full"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-4 mt-6 pt-6 border-t border-gray-700/50">
                <button
                  onClick={() => {
                    setShowCropModal(false);
                    setSelectedFile(null);
                    setCropData({ x: 0, y: 0, scale: 1, rotation: 0 });
                  }}
                  className="px-6 py-2 text-gray-400 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCropConfirm}
                  disabled={uploading}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 text-white font-semibold px-6 py-2 rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all duration-200 disabled:opacity-50"
                >
                  {uploading ? 'Uploading...' : 'Apply & Upload'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ImageUpload;