import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

interface ProgressChartProps {
  data: any[];
  title: string;
  type: 'line' | 'bar';
  dataKey: string;
  xAxisKey: string;
  color?: string;
}

export default function ProgressChart({ 
  data, 
  title, 
  type = 'line', 
  dataKey, 
  xAxisKey, 
  color = '#3b82f6' 
}: ProgressChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            {type === 'line' ? (
              <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey={xAxisKey} 
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => {
                    if (xAxisKey === 'date') {
                      return new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                    }
                    return value;
                  }}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip 
                  labelFormatter={(value) => {
                    if (xAxisKey === 'date') {
                      return new Date(value).toLocaleDateString();
                    }
                    return value;
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey={dataKey} 
                  stroke={color} 
                  strokeWidth={2}
                  dot={{ fill: color, strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            ) : (
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey={xAxisKey} 
                  tick={{ fontSize: 12 }}
                />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey={dataKey} fill={color} />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}