import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { InteractiveVideoPlayer } from '@/components/video-player/InteractiveVideoPlayer';
import { VideoRating } from '@/components/video-player/VideoRating';
import { VideoComments } from '@/components/video-player/VideoComments';
import { VideoChapters } from '@/components/video-player/VideoChapters';
import { RelatedVideos } from '@/components/video-library/RelatedVideos';
import { Loader2, Eye, Clock } from 'lucide-react';

interface Video {
  id: string;
  title: string;
  description: string;
  video_url: string;
  thumbnail_url: string;
  category: string;
  difficulty: string;
  duration_seconds: number;
  views: number;
  average_rating: number;
  total_ratings: number;
}

export default function VideoPlayerPage() {
  const { videoId } = useParams<{ videoId: string }>();
  const [video, setVideo] = useState<Video | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);

  useEffect(() => {
    loadVideo();
  }, [videoId]);

  const loadVideo = async () => {
    if (!videoId) return;

    const { data, error } = await supabase
      .from('videos')
      .select('*')
      .eq('id', videoId)
      .single();

    if (error) {
      console.error('Error loading video:', error);
      setLoading(false);
      return;
    }

    setVideo(data);
    
    // Increment view count
    await supabase.rpc('increment_video_views', { vid: videoId });
    
    setLoading(false);
  };

  const handleSeek = (time: number) => {
    setCurrentTime(time);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (!video) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Video not found</p>
      </div>
    );
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <InteractiveVideoPlayer
              videoId={video.id}
              videoUrl={video.video_url}
              title={video.title}
              description={video.description}
              onTimeUpdate={setCurrentTime}
            />

            {/* Video Info */}
            <div className="bg-white rounded-lg p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <span className="flex items-center gap-1">
                    <Eye className="w-4 h-4" />
                    {video.views.toLocaleString()} views
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {formatDuration(video.duration_seconds)}
                  </span>
                  <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                    {video.difficulty}
                  </span>
                </div>
              </div>

              <VideoRating
                videoId={video.id}
                currentRating={video.average_rating}
                totalRatings={video.total_ratings}
              />

              {video.description && (
                <div className="pt-4 border-t">
                  <p className="text-gray-700">{video.description}</p>
                </div>
              )}
            </div>

            <VideoComments videoId={video.id} />
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            <VideoChapters
              videoId={video.id}
              currentTime={currentTime}
              onSeek={handleSeek}
            />
            <RelatedVideos videoId={video.id} />
          </div>
        </div>
      </div>
    </div>
  );
}