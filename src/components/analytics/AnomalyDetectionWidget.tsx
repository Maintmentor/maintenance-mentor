import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { mlAnalyticsService, Anomaly } from '@/services/mlAnalyticsService';
import { Activity, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';

export function AnomalyDetectionWidget({ userId }: { userId: string }) {
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnomalies();
  }, [userId]);

  const loadAnomalies = async () => {
    setLoading(true);
    const data = await mlAnalyticsService.detectAnomalies(userId);
    setAnomalies(data);
    setLoading(false);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      default: return 'secondary';
    }
  };

  const getAnomalyIcon = (type: string) => {
    switch (type) {
      case 'spike': return <TrendingUp className="h-4 w-4" />;
      case 'drop': return <TrendingDown className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
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
            <Activity className="h-5 w-5" />
            Anomaly Detection
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">Analyzing patterns...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Anomaly Detection
        </CardTitle>
      </CardHeader>
      <CardContent>
        {anomalies.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No anomalies detected
          </div>
        ) : (
          <div className="space-y-3">
            {anomalies.map((anomaly) => (
              <div key={anomaly.id} className="flex items-start gap-3 p-3 border rounded-lg">
                <div className="mt-0.5">
                  {getAnomalyIcon(anomaly.anomaly_type)}
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">
                      {goalTypeLabels[anomaly.goal_type]}
                    </span>
                    <Badge variant={getSeverityColor(anomaly.severity)}>
                      {anomaly.severity}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {anomaly.anomaly_type.charAt(0).toUpperCase() + anomaly.anomaly_type.slice(1)} detected
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Score: {anomaly.anomaly_score.toFixed(2)} • {new Date(anomaly.detected_at).toLocaleString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
