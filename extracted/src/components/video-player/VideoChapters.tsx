import React, { useState, useEffect } from 'react';
import { List, Clock } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface Chapter {
  id: string;
  title: string;
  start_time: number;
  end_time?: number;
  description?: string;
  order_index: number;
}

interface VideoChaptersProps {
  videoId: string;
  currentTime: number;
  onSeek: (time: number) => void;
}

export const VideoChapters: React.FC<VideoChaptersProps> = ({ videoId, currentTime, onSeek }) => {
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadChapters();
  }, [videoId]);

  const loadChapters = async () => {
    const { data, error } = await supabase
      .from('video_chapters')
      .select('*')
      .eq('video_id', videoId)
      .order('order_index');

    if (!error && data) setChapters(data);
    setLoading(false);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getCurrentChapter = () => {
    return chapters.find((chapter, index) => {
      const nextChapter = chapters[index + 1];
      return currentTime >= chapter.start_time && 
             (!nextChapter || currentTime < nextChapter.start_time);
    });
  };

  const currentChapter = getCurrentChapter();

  if (loading || chapters.length === 0) return null;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
        <List className="w-5 h-5" />
        Chapters
      </h3>
      <div className="space-y-2">
        {chapters.map((chapter) => {
          const isActive = currentChapter?.id === chapter.id;
          return (
            <button
              key={chapter.id}
              onClick={() => onSeek(chapter.start_time)}
              className={`w-full text-left p-3 rounded-lg transition-colors ${
                isActive
                  ? 'bg-blue-50 border-2 border-blue-500'
                  : 'hover:bg-gray-50 border border-gray-200'
              }`}
            >
              <div className="flex items-start gap-3">
                <Clock className={`w-4 h-4 mt-1 flex-shrink-0 ${isActive ? 'text-blue-600' : 'text-gray-400'}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className={`font-medium text-sm ${isActive ? 'text-blue-600' : 'text-gray-900'}`}>
                      {chapter.title}
                    </p>
                    <span className={`text-xs ${isActive ? 'text-blue-600' : 'text-gray-500'}`}>
                      {formatTime(chapter.start_time)}
                    </span>
                  </div>
                  {chapter.description && (
                    <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                      {chapter.description}
                    </p>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};