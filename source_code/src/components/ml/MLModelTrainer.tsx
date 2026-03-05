import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Brain, TrendingUp, Activity, Zap } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export function MLModelTrainer() {
  const [models, setModels] = useState<any[]>([]);
  const [training, setTraining] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    loadModels();
  }, []);

  const loadModels = async () => {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) return;

    const { data } = await supabase
      .from('ml_model_configs')
      .select('*')
      .eq('user_id', user.user.id)
      .order('updated_at', { ascending: false });

    setModels(data || []);
  };

  const trainModel = async (modelType: string, goalType: string) => {
    setTraining(modelType);
    setProgress(0);

    try {
      const { data, error } = await supabase.functions.invoke('ml-analytics-processor', {
        body: { 
          action: 'train_model',
          modelType,
          goalType
        }
      });

      if (error) throw error;

      setProgress(100);
      toast.success(`${modelType} model trained successfully`);
      loadModels();
    } catch (error) {
      toast.error('Training failed');
      console.error(error);
    } finally {
      setTraining(null);
      setProgress(0);
    }
  };

  const modelTypes = [
    { type: 'arima', name: 'ARIMA', icon: TrendingUp, color: 'blue' },
    { type: 'neural_network', name: 'Neural Network', icon: Brain, color: 'purple' },
    { type: 'seasonal_decomposition', name: 'Seasonal', icon: Activity, color: 'green' },
    { type: 'ensemble', name: 'Ensemble', icon: Zap, color: 'orange' }
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>ML Model Training Center</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {modelTypes.map(({ type, name, icon: Icon, color }) => {
              const model = models.find(m => m.model_type === type);
              const isTraining = training === type;

              return (
                <Card key={type}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <Icon className={`h-5 w-5 text-${color}-500`} />
                        <h3 className="font-semibold">{name}</h3>
                      </div>
                      {model && (
                        <Badge variant={model.is_active ? 'default' : 'secondary'}>
                          {model.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      )}
                    </div>

                    {model && (
                      <div className="space-y-2 mb-4">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Accuracy</span>
                          <span className="font-medium">
                            {(model.accuracy_score * 100).toFixed(1)}%
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Last Trained</span>
                          <span className="font-medium">
                            {new Date(model.last_trained_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    )}

                    {isTraining && (
                      <Progress value={progress} className="mb-4" />
                    )}

                    <Button
                      onClick={() => trainModel(type, 'response_time')}
                      disabled={isTraining}
                      className="w-full"
                    >
                      {isTraining ? 'Training...' : 'Train Model'}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
