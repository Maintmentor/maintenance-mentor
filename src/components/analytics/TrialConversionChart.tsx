import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend, CartesianGrid } from 'recharts';

interface ConversionTrend {
  date: string;
  conversions: number;
  trials: number;
  conversionRate: number;
}

interface TrialConversionChartProps {
  data: ConversionTrend[];
}

export function TrialConversionChart({ data }: TrialConversionChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Trial Conversion Trends</CardTitle>
        <CardDescription>
          Daily trial starts and conversion rates over time
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            />
            <YAxis yAxisId="left" />
            <YAxis yAxisId="right" orientation="right" />
            <Tooltip 
              labelFormatter={(value) => new Date(value).toLocaleDateString()}
              formatter={(value: any, name: string) => {
                if (name === 'conversionRate') return [`${value.toFixed(1)}%`, 'Conversion Rate'];
                return [value, name === 'trials' ? 'Total Trials' : 'Conversions'];
              }}
            />
            <Legend />
            <Line 
              yAxisId="left"
              type="monotone" 
              dataKey="trials" 
              stroke="#8884d8" 
              name="Total Trials"
              strokeWidth={2}
            />
            <Line 
              yAxisId="left"
              type="monotone" 
              dataKey="conversions" 
              stroke="#82ca9d" 
              name="Conversions"
              strokeWidth={2}
            />
            <Line 
              yAxisId="right"
              type="monotone" 
              dataKey="conversionRate" 
              stroke="#ffc658" 
              name="Conversion Rate (%)"
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
