import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';
import { Brain, TrendingUp, Zap, Activity } from 'lucide-react';

export default function BatchMLOptimizationDashboard() {
  const [recommendation, setRecommendation] = useState<any>(null);
  const [peakPredictions, setPeakPredictions] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const fetchRecommendation = async () => {
    setLoading(true);
    try {
      const { data: patterns } = await supabase
        .from('batch_usage_patterns')
        .select('*')
        .gte('timestamp', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .limit(100);

      const { data, error } = await supabase.functions.invoke('batch-ml-optimizer', {
        body: { action: 'analyze_patterns', data: { patterns } }
      });

      if (error) throw error;
      setRecommendation(data.recommendation);
    } catch (error) {
      console.error('Error fetching recommendation:', error);
    }
    setLoading(false);
  };

  const fetchPeakPredictions = async () => {
    try {
      const { data: patterns } = await supabase
        .from('batch_usage_patterns')
        .select('hour_of_day, total_logs_processed')
        .gte('timestamp', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

      const { data, error } = await supabase.functions.invoke('batch-ml-optimizer', {
        body: { action: 'predict_peak', data: { patterns } }
      });

      if (error) throw error;
      setPeakPredictions(data.predictions.slice(0, 5));
    } catch (error) {
      console.error('Error fetching predictions:', error);
    }
  };

  const fetchMetrics = async () => {
    const { data } = await supabase
      .from('batch_performance_metrics')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(1)
      .single();

    if (data) setMetrics(data);
  };

  useEffect(() => {
    fetchRecommendation();
    fetchPeakPredictions();
    fetchMetrics();
    const interval = setInterval(() => {
      fetchMetrics();
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Current Batch Size</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.current_batch_size || 10}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Flush Interval</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.current_flush_interval || 5000}ms</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Queue Size</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.queue_size || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Optimization Score</CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.optimization_score || 0}%</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>ML Recommendations</CardTitle>
        </CardHeader>
        <CardContent>
          {recommendation ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span>Recommended Batch Size:</span>
                <Badge variant="outline">{recommendation.batchSize}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>Recommended Flush Interval:</span>
                <Badge variant="outline">{recommendation.flushInterval}ms</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>Confidence:</span>
                <Badge>{(recommendation.confidence * 100).toFixed(1)}%</Badge>
              </div>
              <Button onClick={fetchRecommendation} disabled={loading}>
                {loading ? 'Analyzing...' : 'Refresh Recommendations'}
              </Button>
            </div>
          ) : (
            <p className="text-muted-foreground">Loading recommendations...</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Peak Usage Predictions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {peakPredictions.map((pred, idx) => (
              <div key={idx} className="flex items-center justify-between p-2 border rounded">
                <span>Hour {pred.hour}:00</span>
                <Badge variant="secondary">{pred.load.toFixed(0)} logs/hour</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
