import React from 'react';
import { Check, X } from 'lucide-react';
import type { Photo } from '../types';

interface PhotoReviewProps {
  photos: Photo[];
  onRetake: (angle: string) => void;
  onContinue: () => void;
}

export const PhotoReview: React.FC<PhotoReviewProps> = ({ photos, onRetake, onContinue }) => {
  const angles = ['front', 'left', 'right', 'top', 'back'];

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Review Your Photos</h2>
        <p className="text-gray-600">Make sure all angles are clear and well-lit</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {angles.map((angle) => {
          const photo = photos.find((p) => p.angle === angle);
          return (
            <div
              key={angle}
              className="relative aspect-square bg-gray-100 rounded-xl overflow-hidden border-2 border-gray-200"
            >
              {photo ? (
                <>
                  <img
                    src={photo.preview}
                    alt={angle}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2 right-2">
                    <button
                      onClick={() => onRetake(angle)}
                      className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-white hover:bg-red-600 transition-colors shadow-lg"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                    <p className="text-white text-sm font-medium capitalize flex items-center gap-1">
                      <Check className="w-4 h-4" /> {angle}
                    </p>
                  </div>
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <p className="text-gray-400 capitalize">{angle}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <button
        onClick={onContinue}
        disabled={photos.length !== 5}
        className="w-full py-4 bg-blue-600 text-white rounded-xl font-semibold text-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors shadow-lg"
      >
        Continue to Form
      </button>
    </div>
  );
};
