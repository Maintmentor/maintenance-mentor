import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getObjectTimeline } from '@/services/videoAnalysisService';
import { Clock, Package } from 'lucide-react';

interface ObjectTimelineProps {
  analysisId: string;
  duration: number;
}

export const ObjectTimeline = ({ analysisId, duration }: ObjectTimelineProps) => {
  const [timeline, setTimeline] = useState<any[]>([]);
  const [objectTypes, setObjectTypes] = useState<string[]>([]);

  useEffect(() => {
    loadTimeline();
  }, [analysisId]);

  const loadTimeline = async () => {
    const data = await getObjectTimeline(analysisId);
    setTimeline(data);

    const types = [...new Set(data.map(d => d.object_class))];
    setObjectTypes(types);
  };

  const getObjectColor = (objectClass: string) => {
    const colors = [
      'bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500',
      'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-orange-500'
    ];
    const index = objectTypes.indexOf(objectClass) % colors.length;
    return colors[index];
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Object Timeline</h3>
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          {objectTypes.map(type => (
            <Badge key={type} variant="secondary" className="gap-1">
              <Package className="h-3 w-3" />
              {type}
            </Badge>
          ))}
        </div>

        <div className="relative h-64 bg-muted rounded-lg p-4">
          <div className="absolute inset-4">
            {objectTypes.map((type, idx) => (
              <div key={type} className="relative h-8 mb-2">
                <span className="text-xs font-medium absolute -left-2 -top-1 w-20 truncate">
                  {type}
                </span>
                <div className="ml-24 h-full bg-background rounded relative">
                  {timeline
                    .filter(d => d.object_class === type)
                    .map((det, i) => {
                      const left = (det.timestamp_seconds / duration) * 100;
                      return (
                        <div
                          key={i}
                          className={`absolute h-full w-1 ${getObjectColor(type)} opacity-70`}
                          style={{ left: `${left}%` }}
                          title={`${formatTime(det.timestamp_seconds)} - ${det.confidence.toFixed(2)}`}
                        />
                      );
                    })}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-between text-xs text-muted-foreground">
          <span>0:00</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>
    </Card>
  );
};
