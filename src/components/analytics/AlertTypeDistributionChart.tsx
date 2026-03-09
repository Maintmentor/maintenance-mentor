import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { alertAnalyticsService, AlertTypeDistribution } from '@/services/alertAnalyticsService';
import { Loader2 } from 'lucide-react';

export function AlertTypeDistributionChart() {
  const [data, setData] = useState<AlertTypeDistribution[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const distribution = await alertAnalyticsService.getAlertTypeDistribution();
      setData(distribution);
    } catch (error) {
      console.error('Error loading alert distribution:', error);
    } finally {
      setLoading(false);
    }
  };

  const COLORS = ['#8b5cf6', '#ef4444', '#f59e0b', '#10b981', '#3b82f6'];

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Alert Type Distribution</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-80">
          <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Alert Type Distribution</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ alertType, percentage }) => `${alertType.replace(/_/g, ' ')}: ${percentage.toFixed(1)}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="count"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value: number) => [`${value} alerts`, 'Count']} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
        <div className="mt-4 space-y-2">
          {data.map((item, index) => (
            <div key={item.alertType} className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                />
                <span className="capitalize">{item.alertType.replace(/_/g, ' ')}</span>
              </div>
              <span className="font-medium">{item.count} ({item.percentage.toFixed(1)}%)</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
