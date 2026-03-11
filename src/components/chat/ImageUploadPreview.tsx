import React from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ImageUploadPreviewProps {
  images: string[];
  onRemove: (index: number) => void;
}

export default function ImageUploadPreview({ images, onRemove }: ImageUploadPreviewProps) {
  if (images.length === 0) return null;

  return (
    <div className="flex gap-2 flex-wrap p-2 bg-gray-50 rounded-lg border">
      {images.map((url, index) => (
        <div key={index} className="relative group">
          <img 
            src={url} 
            alt={`Upload ${index + 1}`}
            className="w-20 h-20 object-cover rounded-lg border-2 border-gray-200"
          />
          <Button
            size="sm"
            variant="destructive"
            onClick={() => onRemove(index)}
            className="absolute -top-2 -right-2 w-6 h-6 p-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      ))}
    </div>
  );
}
