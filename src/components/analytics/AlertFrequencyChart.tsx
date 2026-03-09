import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { alertAnalyticsService, AlertFrequencyData } from '@/services/alertAnalyticsService';
import { Loader2 } from 'lucide-react';

export function AlertFrequencyChart({ days = 30 }: { days?: number }) {
  const [data, setData] = useState<AlertFrequencyData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [days]);

  const loadData = async () => {
    try {
      setLoading(true);
      const frequency = await alertAnalyticsService.getAlertFrequency(days);
      setData(frequency);
    } catch (error) {
      console.error('Error loading alert frequency:', error);
    } finally {
      setLoading(false);
    }
  };

  // Transform data for chart
  const chartData = data.reduce((acc: any[], item) => {
    const existing = acc.find(d => d.date === item.date);
    if (existing) {
      existing[item.alertType] = item.count;
    } else {
      acc.push({ date: item.date, [item.alertType]: item.count });
    }
    return acc;
  }, []);

  const alertTypes = [...new Set(data.map(d => d.alertType))];

  const colors = ['#8b5cf6', '#ef4444', '#f59e0b', '#10b981', '#3b82f6'];

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Alert Frequency Over Time</CardTitle>
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
        <CardTitle>Alert Frequency Over Time ({days} days)</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            />
            <YAxis />
            <Tooltip 
              labelFormatter={(value) => new Date(value).toLocaleDateString()}
            />
            <Legend />
            {alertTypes.map((type, index) => (
              <Line 
                key={type}
                type="monotone" 
                dataKey={type} 
                stroke={colors[index % colors.length]} 
                strokeWidth={2}
                name={type.replace(/_/g, ' ').toUpperCase()}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
