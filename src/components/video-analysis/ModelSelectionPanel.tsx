import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Zap, Brain, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface ModelSelectionPanelProps {
  videoId: string;
  onMethodChange: (method: 'kalman' | 'lstm') => void;
}

export function ModelSelectionPanel({ videoId, onMethodChange }: ModelSelectionPanelProps) {
  const [selectedMethod, setSelectedMethod] = useState<'kalman' | 'lstm'>('kalman');
  const [models, setModels] = useState<any[]>([]);
  const [isTraining, setIsTraining] = useState(false);
  const [trainingProgress, setTrainingProgress] = useState(0);
  const [objectClasses, setObjectClasses] = useState<string[]>([]);

  useEffect(() => {
    loadModels();
    loadObjectClasses();
  }, [videoId]);

  const loadModels = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('lstm_models')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .order('trained_at', { ascending: false });

    setModels(data || []);
  };

  const loadObjectClasses = async () => {
    const { data } = await supabase
      .from('video_object_tracks')
      .select('object_class')
      .eq('video_id', videoId);

    const classes = [...new Set(data?.map(d => d.object_class) || [])];
    setObjectClasses(classes);
  };

  const handleMethodChange = (method: 'kalman' | 'lstm') => {
    setSelectedMethod(method);
    onMethodChange(method);
  };

  const trainModel = async (objectClass: string) => {
    setIsTraining(true);
    setTrainingProgress(0);

    try {
      const progressInterval = setInterval(() => {
        setTrainingProgress(prev => Math.min(prev + 2, 95));
      }, 500);

      // Import and train model
      const { AdvancedPredictiveTracker } = await import('@/services/advancedPredictiveTracking');
      const tracker = new AdvancedPredictiveTracker({ method: 'lstm' });
      await tracker.initialize(objectClass);
      
      const history = await tracker.trainLSTMModel(objectClass, videoId);
      
      clearInterval(progressInterval);
      setTrainingProgress(100);

      toast.success(`Model trained for ${objectClass}`, {
        description: `Final loss: ${history.loss[history.loss.length - 1].toFixed(4)}`,
      });

      await loadModels();
      tracker.dispose();
    } catch (error: any) {
      toast.error('Training failed', { description: error.message });
    } finally {
      setIsTraining(false);
      setTrainingProgress(0);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Prediction Method</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <RadioGroup value={selectedMethod} onValueChange={handleMethodChange as any}>
          <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-accent">
            <RadioGroupItem value="kalman" id="kalman" />
            <Label htmlFor="kalman" className="flex-1 cursor-pointer">
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-yellow-500" />
                <span className="font-medium">Kalman Filter</span>
                <Badge variant="secondary">Fast</Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Best for simple, linear motion patterns
              </p>
            </Label>
          </div>

          <div className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-accent">
            <RadioGroupItem value="lstm" id="lstm" />
            <Label htmlFor="lstm" className="flex-1 cursor-pointer">
              <div className="flex items-center gap-2">
                <Brain className="h-4 w-4 text-purple-500" />
                <span className="font-medium">LSTM Neural Network</span>
                <Badge variant="secondary">Accurate</Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Best for complex, non-linear motion patterns
              </p>
            </Label>
          </div>
        </RadioGroup>

        {selectedMethod === 'lstm' && (
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">Trained Models</h4>
              {models.length === 0 ? (
                <p className="text-sm text-muted-foreground">No models trained yet</p>
              ) : (
                <div className="space-y-2">
                  {models.map(model => (
                    <div key={model.id} className="flex items-center justify-between p-2 border rounded">
                      <div>
                        <p className="font-medium text-sm">{model.object_class}</p>
                        <p className="text-xs text-muted-foreground">
                          {model.training_samples} samples
                        </p>
                      </div>
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <h4 className="font-medium mb-2">Train New Model</h4>
              {objectClasses.length === 0 ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <AlertCircle className="h-4 w-4" />
                  <span>No objects detected in this video</span>
                </div>
              ) : (
                <div className="space-y-2">
                  {objectClasses.map(cls => {
                    const hasModel = models.some(m => m.object_class === cls);
                    return (
                      <div key={cls} className="flex items-center justify-between">
                        <span className="text-sm">{cls}</span>
                        <Button
                          size="sm"
                          variant={hasModel ? 'outline' : 'default'}
                          onClick={() => trainModel(cls)}
                          disabled={isTraining}
                        >
                          {hasModel ? 'Retrain' : 'Train'}
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {isTraining && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Training in progress...</p>
                <Progress value={trainingProgress} />
                <p className="text-xs text-muted-foreground">{trainingProgress}%</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
