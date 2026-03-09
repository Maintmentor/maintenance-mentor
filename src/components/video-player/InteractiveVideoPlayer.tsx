import { useState, useRef, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Play, Pause, Volume2, VolumeX, Maximize, Bookmark, ArrowLeft } from 'lucide-react';
import { VideoBookmarks } from './VideoBookmarks';
import { VideoNotes } from './VideoNotes';
import { PlaybackSpeedControl } from './PlaybackSpeedControl';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

interface InteractiveVideoPlayerProps {
  videoId: string;
  videoUrl: string;
  title: string;
  description: string;
  onTimeUpdate?: (time: number) => void;
}

export function InteractiveVideoPlayer({ videoId, videoUrl, title, description, onTimeUpdate }: InteractiveVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [bookmarkTitle, setBookmarkTitle] = useState('');
  const [showBookmarkInput, setShowBookmarkInput] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const updateTime = () => {
      setCurrentTime(video.currentTime);
      if (onTimeUpdate) {
        onTimeUpdate(video.currentTime);
      }
    };
    const updateDuration = () => setDuration(video.duration);
    const handleEnded = () => {
      setIsPlaying(false);
      updateProgress(true);
    };

    video.addEventListener('timeupdate', updateTime);
    video.addEventListener('loadedmetadata', updateDuration);
    video.addEventListener('ended', handleEnded);

    return () => {
      video.removeEventListener('timeupdate', updateTime);
      video.removeEventListener('loadedmetadata', updateDuration);
      video.removeEventListener('ended', handleEnded);
    };
  }, [onTimeUpdate]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (isPlaying) updateProgress(false);
    }, 5000);
    return () => clearInterval(interval);
  }, [isPlaying, currentTime]);

  const updateProgress = async (completed: boolean) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from('video_watch_progress').upsert({
      user_id: user.id,
      video_id: videoId,
      current_time_seconds: Math.floor(currentTime),
      duration_seconds: Math.floor(duration),
      completed,
      last_watched_at: new Date().toISOString(),
    }, { onConflict: 'user_id,video_id' });
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleSeek = (value: number[]) => {
    if (videoRef.current) {
      videoRef.current.currentTime = value[0];
      setCurrentTime(value[0]);
    }
  };

  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0];
    setVolume(newVolume);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
    }
    setIsMuted(newVolume === 0);
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleSpeedChange = (speed: number) => {
    setPlaybackSpeed(speed);
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
    }
  };

  const toggleFullscreen = () => {
    if (videoRef.current) {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        videoRef.current.requestFullscreen();
      }
    }
  };

  const addBookmark = async () => {
    if (!bookmarkTitle.trim()) {
      toast({ title: 'Please enter a bookmark title', variant: 'destructive' });
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from('video_bookmarks').insert({
      user_id: user.id,
      video_id: videoId,
      timestamp_seconds: Math.floor(currentTime),
      title: bookmarkTitle,
    });

    if (error) {
      toast({ title: 'Error adding bookmark', variant: 'destructive' });
      return;
    }

    toast({ title: 'Bookmark added' });
    setBookmarkTitle('');
    setShowBookmarkInput(false);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Button variant="ghost" onClick={() => navigate('/video-library')} className="mb-4">
        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Library
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Card className="overflow-hidden">
            <video
              ref={videoRef}
              src={videoUrl}
              className="w-full aspect-video bg-black"
              onClick={togglePlay}
            />
            <div className="p-4 space-y-3">
              <Slider
                value={[currentTime]}
                max={duration}
                step={0.1}
                onValueChange={handleSeek}
                className="cursor-pointer"
              />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="ghost" onClick={togglePlay}>
                    {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  </Button>
                  <span className="text-sm">{formatTime(currentTime)} / {formatTime(duration)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <PlaybackSpeedControl currentSpeed={playbackSpeed} onSpeedChange={handleSpeedChange} />
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="ghost" onClick={toggleMute}>
                      {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                    </Button>
                    <Slider
                      value={[isMuted ? 0 : volume]}
                      max={1}
                      step={0.1}
                      onValueChange={handleVolumeChange}
                      className="w-20"
                    />
                  </div>
                  <Button size="sm" variant="ghost" onClick={toggleFullscreen}>
                    <Maximize className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h1 className="text-2xl font-bold mb-2">{title}</h1>
            <p className="text-muted-foreground">{description}</p>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Bookmark className="w-5 h-5" />
              <h3 className="font-semibold">Quick Bookmark</h3>
            </div>
            {showBookmarkInput ? (
              <div className="flex gap-2">
                <Input
                  placeholder="Bookmark title..."
                  value={bookmarkTitle}
                  onChange={(e) => setBookmarkTitle(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addBookmark()}
                />
                <Button onClick={addBookmark}>Add</Button>
                <Button variant="outline" onClick={() => setShowBookmarkInput(false)}>Cancel</Button>
              </div>
            ) : (
              <Button onClick={() => setShowBookmarkInput(true)}>
                <Bookmark className="w-4 h-4 mr-2" /> Bookmark Current Time
              </Button>
            )}
          </Card>
        </div>

        <div className="lg:col-span-1">
          <Card className="p-4">
            <Tabs defaultValue="bookmarks">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="bookmarks">Bookmarks</TabsTrigger>
                <TabsTrigger value="notes">Notes</TabsTrigger>
              </TabsList>
              <TabsContent value="bookmarks" className="mt-4">
                <VideoBookmarks videoId={videoId} onSeek={handleSeek} />
              </TabsContent>
              <TabsContent value="notes" className="mt-4">
                <VideoNotes videoId={videoId} currentTime={currentTime} />
              </TabsContent>
            </Tabs>
          </Card>
        </div>
      </div>
    </div>
  );
}
