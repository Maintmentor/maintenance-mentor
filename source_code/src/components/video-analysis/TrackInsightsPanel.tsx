import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getObjectTracks } from '@/services/objectTrackingService';
import { Lightbulb, TrendingUp, Clock, Target } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';


interface TrackInsightsPanelProps {
  analysisId: string;
}

export const TrackInsightsPanel = ({ analysisId }: TrackInsightsPanelProps) => {
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
          <div className="space-y-2">
            <div className="h-20 bg-muted rounded" />
            <div className="h-20 bg-muted rounded" />
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Track Insights</h3>
        </div>

        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-4">
            {tracks.map((track) => (
              <Card key={track.id} className="p-4 bg-muted/50">
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-semibold text-sm">{track.object_class}</h4>
                      <p className="text-xs text-muted-foreground">Track ID: {track.track_id}</p>
                    </div>
                    <Badge variant="secondary">
                      {(track.confidence_avg * 100).toFixed(0)}% confidence
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>
                        {formatTime(track.first_timestamp)} - {formatTime(track.last_timestamp)}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Target className="h-3 w-3" />
                      <span>{track.frame_count} frames</span>
                    </div>
                  </div>

                  {track.trajectory_data && (
                    <div className="flex items-center gap-2 text-xs">
                      <TrendingUp className="h-3 w-3 text-primary" />
                      <span className="text-muted-foreground">
                        Moved {track.trajectory_data.movement_direction}
                        {' '}({Math.round(track.trajectory_data.distance)}px)
                      </span>
                    </div>
                  )}

                  {track.insights && track.insights.length > 0 && (
                    <div className="space-y-1">
                      {track.insights.map((insight: string, idx: number) => (
                        <p key={idx} className="text-xs text-muted-foreground flex items-start gap-1">
                          <span className="text-primary">•</span>
                          {insight}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </ScrollArea>

        {tracks.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Lightbulb className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No tracking insights available yet</p>
          </div>
        )}
      </div>
    </Card>
  );
};
