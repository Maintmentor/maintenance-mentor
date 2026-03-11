import React, { useState } from 'react';
import { Play, Clock, Star, Bookmark, BookmarkCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Video {
  id: string;
  title: string;
  category: string;
  duration: string;
  difficulty: string;
  thumbnail: string;
  views: number;
  rating: number;
  description: string;
  isBookmarked: boolean;
  progress: number;
  videoUrl?: string;
}

interface VideoCardProps {
  video: Video;
}

export const VideoCard: React.FC<VideoCardProps> = ({ video }) => {
  const [isBookmarked, setIsBookmarked] = useState(video.isBookmarked);
  const navigate = useNavigate();
  
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'beginner': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleBookmarkToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsBookmarked(!isBookmarked);
  };

  const handleClick = () => {
    navigate(`/video/${video.id}`);
  };

  return (
    <div 
      onClick={handleClick}
      className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden group cursor-pointer"
    >
      {/* Thumbnail */}
      <div className="relative aspect-video bg-gray-200">
        <img 
          src={video.thumbnail} 
          alt={video.title}
          className="w-full h-full object-cover"
        />
        
        {/* Play Button Overlay */}
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all duration-200 flex items-center justify-center">
          <div className="w-12 h-12 bg-white bg-opacity-90 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <Play className="w-5 h-5 text-gray-800 ml-1" />
          </div>
        </div>

        {/* Progress Bar */}
        {video.progress > 0 && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-300">
            <div 
              className="h-full bg-blue-600 transition-all duration-300"
              style={{ width: `${video.progress}%` }}
            />
          </div>
        )}

        {/* Duration */}
        <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
          {video.duration}
        </div>

        {/* Bookmark */}
        <button 
          onClick={handleBookmarkToggle}
          className="absolute top-2 right-2 p-1.5 bg-white bg-opacity-90 rounded-full hover:bg-opacity-100 transition-all duration-200"
        >
          {isBookmarked ? (
            <BookmarkCheck className="w-4 h-4 text-blue-600" />
          ) : (
            <Bookmark className="w-4 h-4 text-gray-600" />
          )}
        </button>
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-semibold text-gray-900 line-clamp-2 flex-1">
            {video.title}
          </h3>
        </div>

        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
          {video.description}
        </p>

        <div className="flex items-center justify-between text-sm">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(video.difficulty)}`}>
            {video.difficulty}
          </span>
          
          <div className="flex items-center space-x-3 text-gray-500">
            <div className="flex items-center space-x-1">
              <Star className="w-4 h-4 text-yellow-400 fill-current" />
              <span>{video.rating}</span>
            </div>
            <span>{video.views.toLocaleString()} views</span>
          </div>
        </div>
      </div>
    </div>
  );
};
