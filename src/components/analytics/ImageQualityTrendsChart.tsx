import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/lib/supabase';
import { TrendingUp, TrendingDown } from 'lucide-react';

export default function ImageQualityTrendsChart() {
  const [trends, setTrends] = useState<any[]>([]);
  const [overallTrend, setOverallTrend] = useState<'up' | 'down' | 'stable'>('stable');

  useEffect(() => {
    loadTrends();
  }, []);

  const loadTrends = async () => {
    const { data } = await supabase
      .from('image_quality_feedback')
      .select('created_at, feedback_type, ml_prediction_score')
      .order('created_at', { ascending: false })
      .limit(100);

    if (data) {
      // Group by day
      const grouped = data.reduce((acc: any, item) => {
        const date = new Date(item.created_at).toLocaleDateString();
        if (!acc[date]) {
          acc[date] = { positive: 0, negative: 0, total: 0, avgScore: 0, count: 0 };
        }
        acc[date].total++;
        if (item.feedback_type === 'positive') acc[date].positive++;
        else acc[date].negative++;
        if (item.ml_prediction_score) {
          acc[date].avgScore += item.ml_prediction_score;
          acc[date].count++;
        }
        return acc;
      }, {});

      const trendData = Object.entries(grouped).map(([date, stats]: [string, any]) => ({
        date,
        positiveRate: (stats.positive / stats.total) * 100,
        avgScore: stats.count > 0 ? (stats.avgScore / stats.count) * 100 : 0
      }));

      setTrends(trendData.slice(0, 7).reverse());

      // Calculate trend
      if (trendData.length >= 2) {
        const recent = trendData[0].positiveRate;
        const older = trendData[trendData.length - 1].positiveRate;
        setOverallTrend(recent > older + 5 ? 'up' : recent < older - 5 ? 'down' : 'stable');
      }
    }
  };

  const maxRate = Math.max(...trends.map(t => t.positiveRate), 100);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Quality Trends (Last 7 Days)</span>
          {overallTrend === 'up' && <TrendingUp className="h-5 w-5 text-green-500" />}
          {overallTrend === 'down' && <TrendingDown className="h-5 w-5 text-red-500" />}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {trends.map((trend, idx) => (
            <div key={idx}>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-muted-foreground">{trend.date}</span>
                <span className="font-medium">{trend.positiveRate.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-green-500 to-blue-500 h-2 rounded-full transition-all"
                  style={{ width: `${(trend.positiveRate / maxRate) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
