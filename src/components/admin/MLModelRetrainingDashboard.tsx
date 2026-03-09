import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';
import { Brain, TrendingUp, AlertCircle, CheckCircle, Play, Calendar } from 'lucide-react';
import { toast } from 'sonner';

export function MLModelRetrainingDashboard() {
  const [loading, setLoading] = useState(false);
  const [retraining, setRetraining] = useState(false);
  const [modelInfo, setModelInfo] = useState<any>(null);

  const loadModelInfo = async () => {
    setLoading(true);
    try {
      const { data: config } = await supabase
        .from('ml_model_configs')
        .select('*')
        .eq('model_name', 'image_quality_scorer')
        .order('version', { ascending: false })
        .limit(1)
        .single();

      const { count: feedbackCount } = await supabase
        .from('image_quality_feedback')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', config?.last_trained_at || new Date(0).toISOString());

      setModelInfo({ ...config, newFeedbackCount: feedbackCount || 0 });
    } catch (error) {
      toast.error('Failed to load model info');
    } finally {
      setLoading(false);
    }
  };

  const triggerRetraining = async () => {
    setRetraining(true);
    try {
      const { data, error } = await supabase.functions.invoke('ml-model-retrainer');
      
      if (error) throw error;

      if (data.success) {
        toast.success(`Model retrained! Accuracy: ${(data.accuracy * 100).toFixed(2)}%`);
        loadModelInfo();
      } else if (data.skipped) {
        toast.info(data.message);
      } else if (data.rejected) {
        toast.warning(data.message);
      }
    } catch (error: any) {
      toast.error('Retraining failed: ' + error.message);
    } finally {
      setRetraining(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">ML Model Retraining</h2>
        <Button onClick={loadModelInfo} disabled={loading}>
          Refresh
        </Button>
      </div>

      {modelInfo && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Model Version</CardTitle>
              <Brain className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">v{modelInfo.version}</div>
              <p className="text-xs text-muted-foreground">
                Last trained: {new Date(modelInfo.last_trained_at).toLocaleDateString()}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Accuracy</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{(modelInfo.accuracy * 100).toFixed(2)}%</div>
              <p className="text-xs text-muted-foreground">
                Training samples: {modelInfo.training_samples}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">New Feedback</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{modelInfo.newFeedbackCount}</div>
              <p className="text-xs text-muted-foreground">
                {modelInfo.newFeedbackCount >= 100 ? (
                  <Badge variant="default" className="mt-1">Ready to retrain</Badge>
                ) : (
                  <span>Need {100 - modelInfo.newFeedbackCount} more</span>
                )}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Manual Retraining</CardTitle>
          <CardDescription>
            Trigger model retraining manually. Requires at least 100 new feedback entries.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={triggerRetraining} 
            disabled={retraining || !modelInfo || modelInfo.newFeedbackCount < 100}
            className="w-full"
          >
            <Play className="mr-2 h-4 w-4" />
            {retraining ? 'Retraining...' : 'Start Retraining'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}