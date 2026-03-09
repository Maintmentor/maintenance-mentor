import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';
import { getObjectTimeline } from '@/services/videoAnalysisService';
import { FileText, Wand2, Download } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface RepairGuideGeneratorProps {
  analysisId: string;
}

export const RepairGuideGenerator = ({ analysisId }: RepairGuideGeneratorProps) => {
  const [title, setTitle] = useState('');
  const [generating, setGenerating] = useState(false);
  const [guide, setGuide] = useState<any>(null);

  const handleGenerate = async () => {
    if (!title.trim()) return;

    setGenerating(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Get detected objects
      const timeline = await getObjectTimeline(analysisId);
      
      // Group objects by type
      const objectCounts = timeline.reduce((acc: any, det: any) => {
        acc[det.object_class] = (acc[det.object_class] || 0) + 1;
        return acc;
      }, {});

      // Generate steps based on detected objects
      const steps = Object.entries(objectCounts)
        .sort(([, a]: any, [, b]: any) => b - a)
        .slice(0, 5)
        .map(([obj, count], idx) => ({
          step: idx + 1,
          title: `Work with ${obj}`,
          description: `This step involves using the ${obj} (detected ${count} times in video)`,
          estimated_minutes: 5
        }));

      const { data, error } = await supabase
        .from('video_repair_guides')
        .insert({
          video_analysis_id: analysisId,
          user_id: user.id,
          title,
          steps,
          detected_parts: Object.keys(objectCounts),
          difficulty_level: steps.length > 3 ? 'intermediate' : 'beginner',
          estimated_time_minutes: steps.length * 5
        })
        .select()
        .single();

      if (error) throw error;
      setGuide(data);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          <h3 className="text-lg font-semibold">Generate Repair Guide</h3>
        </div>

        <div className="space-y-2">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter repair guide title..."
          />
          <Button
            onClick={handleGenerate}
            disabled={!title.trim() || generating}
            className="w-full"
          >
            <Wand2 className="h-4 w-4 mr-2" />
            {generating ? 'Generating...' : 'Generate Guide'}
          </Button>
        </div>

        {guide && (
          <Alert>
            <AlertDescription>
              <div className="space-y-3">
                <div>
                  <h4 className="font-semibold mb-2">{guide.title}</h4>
                  <div className="flex gap-2 mb-3">
                    <Badge>{guide.difficulty_level}</Badge>
                    <Badge variant="outline">{guide.estimated_time_minutes} min</Badge>
                  </div>
                </div>

                <div className="space-y-2">
                  {guide.steps.map((step: any) => (
                    <div key={step.step} className="border-l-2 border-primary pl-3">
                      <p className="font-medium text-sm">Step {step.step}: {step.title}</p>
                      <p className="text-xs text-muted-foreground">{step.description}</p>
                    </div>
                  ))}
                </div>

                <Button variant="outline" size="sm" className="w-full">
                  <Download className="h-4 w-4 mr-2" />
                  Export Guide
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}
      </div>
    </Card>
  );
};
