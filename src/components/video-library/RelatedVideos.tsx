import React, { useState, useEffect } from 'react';
import { Play, Clock, Star } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useNavigate } from 'react-router-dom';

interface Video {
  id: string;
  title: string;
  thumbnail_url: string;
  duration_seconds: number;
  views: number;
  average_rating: number;
  category: string;
}

interface RelatedVideosProps {
  videoId: string;
  limit?: number;
}

export const RelatedVideos: React.FC<RelatedVideosProps> = ({ videoId, limit = 6 }) => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadRelatedVideos();
  }, [videoId]);

  const loadRelatedVideos = async () => {
    const { data, error } = await supabase.rpc('get_related_videos', {
      vid: videoId,
      lim: limit
    });

    if (!error && data) setVideos(data);
    setLoading(false);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading || videos.length === 0) return null;

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold">Related Videos</h3>
      <div className="grid gap-4">
        {videos.map((video) => (
          <button
            key={video.id}
            onClick={() => navigate(`/video/${video.id}`)}
            className="flex gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors text-left group"
          >
            <div className="relative w-40 h-24 flex-shrink-0 rounded-lg overflow-hidden bg-gray-200">
              {video.thumbnail_url ? (
                <img
                  src={video.thumbnail_url}
                  alt={video.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Play className="w-8 h-8 text-gray-400" />
                </div>
              )}
              <div className="absolute bottom-1 right-1 bg-black bg-opacity-75 text-white text-xs px-1.5 py-0.5 rounded">
                {formatDuration(video.duration_seconds)}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-sm line-clamp-2 group-hover:text-blue-600 transition-colors">
                {video.title}
              </h4>
              <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <Play className="w-3 h-3" />
                  {video.views.toLocaleString()}
                </span>
                {video.average_rating > 0 && (
                  <span className="flex items-center gap-1">
                    <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                    {video.average_rating.toFixed(1)}
                  </span>
                )}
              </div>
              <span className="inline-block mt-1 text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded">
                {video.category}
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};