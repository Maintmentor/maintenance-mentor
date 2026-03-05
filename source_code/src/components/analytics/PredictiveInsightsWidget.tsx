import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { mlAnalyticsService, MLPrediction } from '@/services/mlAnalyticsService';
import { AlertTriangle, TrendingUp, TrendingDown, Minus, Clock } from 'lucide-react';

export function PredictiveInsightsWidget({ userId }: { userId: string }) {
  const [predictions, setPredictions] = useState<MLPrediction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPredictions();
  }, [userId]);

  const loadPredictions = async () => {
    setLoading(true);
    const data = await mlAnalyticsService.getPredictions(userId);
    setPredictions(data.filter(p => p.will_miss_goal && p.hours_until_miss));
    setLoading(false);
  };

  const getRiskColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-red-600 bg-red-50';
    if (confidence >= 0.6) return 'text-orange-600 bg-orange-50';
    return 'text-yellow-600 bg-yellow-50';
  };

  const goalTypeLabels = {
    response_time: 'Response Time',
    false_positive_rate: 'False Positive Rate',
    uptime_percentage: 'System Uptime'
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Predictive Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">Loading predictions...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          Predictive Insights
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {predictions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No predicted goal misses in the next 48 hours
          </div>
        ) : (
          predictions.map((prediction) => (
            <Alert key={prediction.id} className={getRiskColor(prediction.confidence_score)}>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">
                      {goalTypeLabels[prediction.goal_type]}
                    </span>
                    <Badge variant="outline" className="ml-2">
                      {(prediction.confidence_score * 100).toFixed(0)}% confidence
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-3 w-3" />
                    <span>Predicted miss in {prediction.hours_until_miss} hours</span>
                  </div>
                  <div className="text-sm">
                    <span className="text-muted-foreground">Predicted: </span>
                    <span className="font-medium">{prediction.predicted_value.toFixed(2)}</span>
                    <span className="text-muted-foreground"> (Target: {prediction.goal_threshold})</span>
                  </div>
                  {prediction.recommended_actions && prediction.recommended_actions.length > 0 && (
                    <div className="mt-2 space-y-1">
                      <div className="text-sm font-medium">Recommended Actions:</div>
                      <ul className="text-sm space-y-1 ml-4">
                        {prediction.recommended_actions.slice(0, 2).map((action, idx) => (
                          <li key={idx} className="list-disc">{action}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          ))
        )}
      </CardContent>
    </Card>
  );
}
