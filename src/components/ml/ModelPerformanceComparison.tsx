import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { supabase } from '@/lib/supabase';
import { Badge } from '@/components/ui/badge';

export function ModelPerformanceComparison() {
  const [performanceData, setPerformanceData] = useState<any[]>([]);
  const [bestModel, setBestModel] = useState<string>('');

  useEffect(() => {
    loadPerformanceData();
  }, []);

  const loadPerformanceData = async () => {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) return;

    const { data: feedback } = await supabase
      .from('ml_prediction_feedback')
      .select('*, ml_predictions(goal_type), ml_model_configs(model_type)')
      .order('created_at', { ascending: true })
      .limit(100);

    if (!feedback) return;

    const modelAccuracy: Record<string, { correct: number; total: number }> = {};
    
    feedback.forEach(f => {
      const modelType = f.ml_model_configs?.model_type || 'unknown';
      if (!modelAccuracy[modelType]) {
        modelAccuracy[modelType] = { correct: 0, total: 0 };
      }
      modelAccuracy[modelType].total++;
      if (f.was_accurate) modelAccuracy[modelType].correct++;
    });

    const chartData = Object.entries(modelAccuracy).map(([model, stats]) => ({
      model,
      accuracy: (stats.correct / stats.total) * 100,
      predictions: stats.total
    }));

    setPerformanceData(chartData);
    
    const best = chartData.reduce((prev, curr) => 
      curr.accuracy > prev.accuracy ? curr : prev
    );
    setBestModel(best.model);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Model Performance Comparison
          {bestModel && (
            <Badge variant="default">Best: {bestModel}</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={performanceData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="model" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="accuracy" 
              stroke="#8884d8" 
              name="Accuracy %" 
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
