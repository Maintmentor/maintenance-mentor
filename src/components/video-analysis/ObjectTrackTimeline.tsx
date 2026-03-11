import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getObjectTracks } from '@/services/objectTrackingService';
import { Clock, TrendingUp, Info } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface ObjectTrackTimelineProps {
  analysisId: string;
  duration: number;
}

export const ObjectTrackTimeline = ({ analysisId, duration }: ObjectTrackTimelineProps) => {
  const [tracks, setTracks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTracks();
  }, [analysisId]);

  const loadTracks = async () => {
    try {
      const data = await getObjectTracks(analysisId);
      setTracks(data);
    } catch (error) {
      console.error('Failed to load tracks:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTrackColor = (index: number) => {
    const colors = [
      'bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500',
      'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-orange-500'
    ];
    return colors[index % colors.length];
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-muted rounded w-1/3" />
          <div className="h-48 bg-muted rounded" />
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold">Object Tracks & Trajectories</h3>
          </div>
          <Badge variant="secondary">{tracks.length} tracks</Badge>
        </div>

        <div className="space-y-3">
          {tracks.map((track, idx) => {
            const startPercent = (track.first_timestamp / duration) * 100;
            const widthPercent = ((track.last_timestamp - track.first_timestamp) / duration) * 100;
            
            return (
              <TooltipProvider key={track.id}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="relative">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium w-24 truncate">
                          {track.object_class}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {track.frame_count} frames
                        </Badge>
                      </div>
                      <div className="h-8 bg-muted rounded-lg relative overflow-hidden">
                        <div
                          className={`absolute h-full ${getTrackColor(idx)} opacity-70 rounded transition-all hover:opacity-90`}
                          style={{
                            left: `${startPercent}%`,
                            width: `${widthPercent}%`
                          }}
                        >
                          {track.trajectory_data && (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <TrendingUp className="h-4 w-4 text-white" />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent className="max-w-sm">
                    <div className="space-y-2">
                      <p className="font-semibold">{track.object_class}</p>
                      <div className="text-xs space-y-1">
                        {track.insights?.map((insight: string, i: number) => (
                          <p key={i} className="flex items-start gap-1">
                            <Info className="h-3 w-3 mt-0.5 flex-shrink-0" />
                            {insight}
                          </p>
                        ))}
                        <p>Avg confidence: {(track.confidence_avg * 100).toFixed(1)}%</p>
                      </div>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            );
          })}
        </div>

        <div className="flex justify-between text-xs text-muted-foreground pt-2">
          <span>0:00</span>
          <span>{formatTime(duration)}</span>
        </div>

        {tracks.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Clock className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No object tracks found in this video</p>
          </div>
        )}
      </div>
    </Card>
  );
};
