import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface RevenueGrowthChartProps {
  data: Array<{
    date: string;
    mrr: number;
    subscribers: number;
  }>;
}

export function RevenueGrowthChart({ data }: RevenueGrowthChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Revenue Growth Trend</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis yAxisId="left" />
            <YAxis yAxisId="right" orientation="right" />
            <Tooltip />
            <Legend />
            <Line yAxisId="left" type="monotone" dataKey="mrr" stroke="#8884d8" name="MRR ($)" />
            <Line yAxisId="right" type="monotone" dataKey="subscribers" stroke="#82ca9d" name="Subscribers" />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
