import React, { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { 
  Play, Pause, Volume2, VolumeX, Maximize, Minimize, 
  Bookmark, BookmarkCheck, Clock, SkipForward, SkipBack 
} from 'lucide-react';

interface VideoTutorial {
  id: string;
  title: string;
  category: string;
  duration: string;
  thumbnail: string;
  videoUrl: string;
}

interface Timestamp {
  time: number;
  label: string;
}

interface VideoPlayerModalProps {
  video: VideoTutorial | null;
  isOpen: boolean;
  onClose: () => void;
  timestamps?: Timestamp[];
}

export default function VideoPlayerModal({ 
  video, 
  isOpen, 
  onClose,
  timestamps = []
}: VideoPlayerModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [bookmarks, setBookmarks] = useState<number[]>([]);
  const [playbackRate, setPlaybackRate] = useState(1);

  useEffect(() => {
    if (video && videoRef.current) {
      videoRef.current.load();
      setCurrentTime(0);
      setIsPlaying(false);
    }
  }, [video]);

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

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
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

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      videoRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const addBookmark = () => {
    if (!bookmarks.includes(currentTime)) {
      setBookmarks([...bookmarks, currentTime].sort((a, b) => a - b));
    }
  };

  const removeBookmark = (time: number) => {
    setBookmarks(bookmarks.filter(b => b !== time));
  };

  const jumpToTime = (time: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const skip = (seconds: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime += seconds;
    }
  };

  const changePlaybackRate = (rate: number) => {
    setPlaybackRate(rate);
    if (videoRef.current) {
      videoRef.current.playbackRate = rate;
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!video) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>{video.title}</span>
            <Badge variant="secondary">{video.category}</Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Video Player */}
          <div className="relative bg-black rounded-lg overflow-hidden">
            <video
              ref={videoRef}
              className="w-full aspect-video"
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={handleLoadedMetadata}
              onEnded={() => setIsPlaying(false)}
            >
              <source src={video.videoUrl} type="video/mp4" />
              Your browser does not support video playback.
            </video>

            {/* Video Controls */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
              <Slider
                value={[currentTime]}
                max={duration || 100}
                step={0.1}
                onValueChange={handleSeek}
                className="mb-3"
              />

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="ghost" onClick={() => skip(-10)} className="text-white">
                    <SkipBack className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={togglePlay} className="text-white">
                    {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => skip(10)} className="text-white">
                    <SkipForward className="w-4 h-4" />
                  </Button>
                  
                  <div className="flex items-center gap-2 ml-2">
                    <Button size="sm" variant="ghost" onClick={toggleMute} className="text-white">
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

                  <span className="text-white text-sm ml-2">
                    {formatTime(currentTime)} / {formatTime(duration)}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={playbackRate}
                    onChange={(e) => changePlaybackRate(Number(e.target.value))}
                    className="bg-black/50 text-white text-sm rounded px-2 py-1 border border-white/20"
                  >
                    <option value={0.5}>0.5x</option>
                    <option value={0.75}>0.75x</option>
                    <option value={1}>1x</option>
                    <option value={1.25}>1.25x</option>
                    <option value={1.5}>1.5x</option>
                    <option value={2}>2x</option>
                  </select>

                  <Button size="sm" variant="ghost" onClick={addBookmark} className="text-white">
                    <Bookmark className="w-4 h-4" />
                  </Button>

                  <Button size="sm" variant="ghost" onClick={toggleFullscreen} className="text-white">
                    {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Repair Steps / Timestamps */}
            {timestamps.length > 0 && (
              <Card className="p-4">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Repair Steps
                </h3>
                <div className="space-y-2">
                  {timestamps.map((ts, idx) => (
                    <button
                      key={idx}
                      onClick={() => jumpToTime(ts.time)}
                      className="w-full text-left p-2 rounded hover:bg-gray-100 transition-colors flex items-center gap-2"
                    >
                      <Badge variant="outline" className="text-xs">
                        {formatTime(ts.time)}
                      </Badge>
                      <span className="text-sm">{ts.label}</span>
                    </button>
                  ))}
                </div>
              </Card>
            )}

            {/* Bookmarks */}
            <Card className="p-4">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <BookmarkCheck className="w-4 h-4" />
                Your Bookmarks
              </h3>
              {bookmarks.length === 0 ? (
                <p className="text-sm text-gray-500">
                  Click the bookmark button to save important moments
                </p>
              ) : (
                <div className="space-y-2">
                  {bookmarks.map((time, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2 rounded bg-gray-50"
                    >
                      <button
                        onClick={() => jumpToTime(time)}
                        className="text-sm hover:text-blue-600"
                      >
                        {formatTime(time)}
                      </button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeBookmark(time)}
                        className="h-6 px-2"
                      >
                        ×
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}