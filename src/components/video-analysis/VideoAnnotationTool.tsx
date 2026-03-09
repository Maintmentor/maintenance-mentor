import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';
import { MessageSquare, Plus, Trash2 } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface VideoAnnotationToolProps {
  analysisId: string;
  currentTime: number;
}

export const VideoAnnotationTool = ({ analysisId, currentTime }: VideoAnnotationToolProps) => {
  const [annotations, setAnnotations] = useState<any[]>([]);
  const [newAnnotation, setNewAnnotation] = useState('');
  const [annotationType, setAnnotationType] = useState('note');

  useEffect(() => {
    loadAnnotations();
  }, [analysisId]);

  const loadAnnotations = async () => {
    const { data } = await supabase
      .from('video_annotations')
      .select('*')
      .eq('video_analysis_id', analysisId)
      .order('timestamp_seconds');

    if (data) setAnnotations(data);
  };

  const handleAdd = async () => {
    if (!newAnnotation.trim()) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from('video_annotations')
      .insert({
        video_analysis_id: analysisId,
        user_id: user.id,
        timestamp_seconds: currentTime,
        annotation_type: annotationType,
        content: newAnnotation
      });

    if (!error) {
      setNewAnnotation('');
      loadAnnotations();
    }
  };

  const handleDelete = async (id: string) => {
    await supabase
      .from('video_annotations')
      .delete()
      .eq('id', id);

    loadAnnotations();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      note: 'bg-blue-500',
      warning: 'bg-red-500',
      tip: 'bg-green-500',
      part_identification: 'bg-purple-500'
    };
    return colors[type] || 'bg-gray-500';
  };

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Video Annotations</h3>
        </div>

        <div className="space-y-2">
          <div className="flex gap-2">
            <Select value={annotationType} onValueChange={setAnnotationType}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="note">Note</SelectItem>
                <SelectItem value="warning">Warning</SelectItem>
                <SelectItem value="tip">Tip</SelectItem>
                <SelectItem value="part_identification">Part ID</SelectItem>
              </SelectContent>
            </Select>
            <Textarea
              value={newAnnotation}
              onChange={(e) => setNewAnnotation(e.target.value)}
              placeholder={`Add ${annotationType} at ${formatTime(currentTime)}`}
              className="flex-1"
              rows={2}
            />
          </div>
          <Button onClick={handleAdd} className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            Add Annotation
          </Button>
        </div>

        <div className="space-y-2 max-h-64 overflow-y-auto">
          {annotations.map((ann) => (
            <div key={ann.id} className="flex gap-2 p-3 bg-muted rounded-lg">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Badge className={getTypeColor(ann.annotation_type)}>
                    {ann.annotation_type}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {formatTime(ann.timestamp_seconds)}
                  </span>
                </div>
                <p className="text-sm">{ann.content}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDelete(ann.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
};
