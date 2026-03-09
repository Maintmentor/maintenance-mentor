import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, TrendingUp, Activity, Zap } from 'lucide-react';
import { getPredictions, getWarnings } from '@/services/predictiveTrackingService';

interface PredictiveTrackingPanelProps {
  trackId: string;
  analysisId: string;
}

export function PredictiveTrackingPanel({ trackId, analysisId }: PredictiveTrackingPanelProps) {

  const [predictions, setPredictions] = useState<any[]>([]);
  const [warnings, setWarnings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPredictions, setShowPredictions] = useState(true);

  useEffect(() => {
    loadData();
  }, [trackId, analysisId]);

  const loadData = async () => {
    try {
      const [predData, warnData] = await Promise.all([
        getPredictions(trackId),
        getWarnings(analysisId)
      ]);
      setPredictions(predData || []);
      setWarnings(warnData || []);
    } catch (error) {
      console.error('Error loading predictive data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'outline';
    }
  };

  const getWarningIcon = (type: string) => {
    switch (type) {
      case 'exit_frame': return <TrendingUp className="h-4 w-4" />;
      case 'dangerous_area': return <AlertTriangle className="h-4 w-4" />;
      case 'rapid_movement': return <Zap className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading predictions...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Warnings Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            Tracking Warnings
          </CardTitle>
        </CardHeader>
        <CardContent>
          {warnings.length === 0 ? (
            <p className="text-sm text-muted-foreground">No warnings detected</p>
          ) : (
            <div className="space-y-3">
              {warnings.map((warning, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-3 p-3 rounded-lg border bg-card"
                >
                  <div className="mt-0.5">
                    {getWarningIcon(warning.warning_type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant={getSeverityColor(warning.severity) as any}>
                        {warning.severity}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        Frame {warning.frame_number}
                      </span>
                    </div>
                    <p className="text-sm">{warning.message}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Predictions Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-blue-500" />
              Predicted Positions
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowPredictions(!showPredictions)}
            >
              {showPredictions ? 'Hide' : 'Show'}
            </Button>
          </div>
        </CardHeader>
        {showPredictions && (
          <CardContent>
            {predictions.length === 0 ? (
              <p className="text-sm text-muted-foreground">No predictions available</p>
            ) : (
              <div className="space-y-2">
                {predictions.slice(0, 5).map((pred, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2 rounded border"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium">
                        Frame {pred.predicted_frame}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {(pred.confidence * 100).toFixed(0)}% confidence
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Velocity: ({pred.velocity_x?.toFixed(1)}, {pred.velocity_y?.toFixed(1)})
                    </div>
                  </div>
                ))}
                {predictions.length > 5 && (
                  <p className="text-xs text-muted-foreground text-center pt-2">
                    + {predictions.length - 5} more predictions
                  </p>
                )}
              </div>
            )}
          </CardContent>
        )}
      </Card>

      {/* Velocity & Acceleration Stats */}
      {predictions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Motion Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Avg Velocity</p>
                <p className="text-lg font-semibold">
                  {(predictions.reduce((sum, p) => 
                    sum + Math.sqrt((p.velocity_x || 0) ** 2 + (p.velocity_y || 0) ** 2), 0
                  ) / predictions.length).toFixed(1)} px/frame
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Max Speed</p>
                <p className="text-lg font-semibold">
                  {Math.max(...predictions.map(p => 
                    Math.sqrt((p.velocity_x || 0) ** 2 + (p.velocity_y || 0) ** 2)
                  )).toFixed(1)} px/frame
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
