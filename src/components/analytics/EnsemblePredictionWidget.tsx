import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Brain, TrendingUp, Activity } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export function EnsemblePredictionWidget() {
  const [predictions, setPredictions] = useState<any[]>([]);

  useEffect(() => {
    loadPredictions();
  }, []);

  const loadPredictions = async () => {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) return;

    const { data } = await supabase
      .from('ml_predictions')
      .select('*')
      .eq('user_id', user.user.id)
      .order('prediction_date', { ascending: false })
      .limit(3);

    setPredictions(data || []);
  };

  const getModelIcon = (type: string) => {
    switch (type) {
      case 'arima': return TrendingUp;
      case 'neural_network': return Brain;
      case 'seasonal': return Activity;
      default: return Brain;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ensemble Predictions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {predictions.map((pred) => (
            <div key={pred.id} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">{pred.goal_type}</span>
                <Badge variant={pred.will_miss_goal ? 'destructive' : 'default'}>
                  {pred.will_miss_goal ? 'At Risk' : 'On Track'}
                </Badge>
              </div>

              <div className="space-y-2 mb-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Predicted Value</span>
                  <span className="font-medium">{pred.predicted_value.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Confidence</span>
                  <span className="font-medium">
                    {(pred.confidence_score * 100).toFixed(1)}%
                  </span>
                </div>
              </div>

              <Progress value={pred.confidence_score * 100} className="mb-3" />

              {pred.model_contributions && (
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground mb-2">Model Contributions:</p>
                  {Object.entries(pred.model_contributions).map(([model, value]: [string, any]) => {
                    const Icon = getModelIcon(model);
                    return (
                      <div key={model} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-1">
                          <Icon className="h-3 w-3" />
                          <span>{model}</span>
                        </div>
                        <span className="font-medium">{value.toFixed(2)}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
