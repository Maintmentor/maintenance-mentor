import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LineChart, Line, ResponsiveContainer } from 'recharts';
import { Activity, Users, Zap, AlertCircle, TrendingUp } from 'lucide-react';

interface RealTimeMetrics {
  activeUsers: number;
  systemLoad: number;
  responseTime: number;
  errorRate: number;
  throughput: number;
  timestamp: string;
}

interface RealTimeMetricsWidgetProps {
  data: RealTimeMetrics;
}

export default function RealTimeMetricsWidget({ data }: RealTimeMetricsWidgetProps) {
  const [historicalData, setHistoricalData] = useState<RealTimeMetrics[]>([]);
  const [isLive, setIsLive] = useState(true);

  useEffect(() => {
    if (data) {
      setHistoricalData(prev => {
        const newData = [...prev, data].slice(-20); // Keep last 20 data points
        return newData;
      });
    }
  }, [data]);

  const getStatusColor = (value: number, thresholds: { warning: number; critical: number }) => {
    if (value > thresholds.critical) return 'destructive';
    if (value > thresholds.warning) return 'secondary';
    return 'default';
  };

  const chartData = historicalData.map((item, index) => ({
    time: index,
    systemLoad: item.systemLoad,
    responseTime: item.responseTime / 10, // Scale down for better visualization
    errorRate: item.errorRate * 10, // Scale up for better visualization
  }));

  if (!data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Real-Time Metrics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4 animate-pulse" />
            <p className="text-lg font-medium">Connecting to live data...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Real-Time Metrics
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isLive ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
            <span className="text-sm text-gray-600">
              {isLive ? 'Live' : 'Offline'}
            </span>
          </div>
        </CardTitle>
        <CardDescription>
          Live system performance and user activity metrics
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <Users className="h-4 w-4 text-blue-600 mr-1" />
              <span className="text-sm font-medium">Active Users</span>
            </div>
            <p className="text-2xl font-bold">{data.activeUsers}</p>
            <Badge variant="default" className="mt-1">
              Online
            </Badge>
          </div>

          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <Activity className="h-4 w-4 text-green-600 mr-1" />
              <span className="text-sm font-medium">System Load</span>
            </div>
            <p className="text-2xl font-bold">{Math.round(data.systemLoad)}%</p>
            <Badge variant={getStatusColor(data.systemLoad, { warning: 70, critical: 90 })}>
              {data.systemLoad > 90 ? 'High' : data.systemLoad > 70 ? 'Medium' : 'Low'}
            </Badge>
          </div>

          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <Zap className="h-4 w-4 text-purple-600 mr-1" />
              <span className="text-sm font-medium">Response</span>
            </div>
            <p className="text-2xl font-bold">{Math.round(data.responseTime)}ms</p>
            <Badge variant={getStatusColor(data.responseTime, { warning: 300, critical: 500 })}>
              {data.responseTime > 500 ? 'Slow' : data.responseTime > 300 ? 'Medium' : 'Fast'}
            </Badge>
          </div>

          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <AlertCircle className="h-4 w-4 text-red-600 mr-1" />
              <span className="text-sm font-medium">Error Rate</span>
            </div>
            <p className="text-2xl font-bold">{data.errorRate.toFixed(1)}%</p>
            <Badge variant={getStatusColor(data.errorRate, { warning: 2, critical: 5 })}>
              {data.errorRate > 5 ? 'High' : data.errorRate > 2 ? 'Medium' : 'Low'}
            </Badge>
          </div>

          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <TrendingUp className="h-4 w-4 text-orange-600 mr-1" />
              <span className="text-sm font-medium">Throughput</span>
            </div>
            <p className="text-2xl font-bold">{data.throughput}</p>
            <Badge variant="default">
              req/min
            </Badge>
          </div>
        </div>

        {chartData.length > 1 && (
          <div className="space-y-4">
            <h4 className="text-sm font-medium">Live Performance Trends</h4>
            <div className="h-32">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <Line 
                    type="monotone" 
                    dataKey="systemLoad" 
                    stroke="#10b981" 
                    strokeWidth={2}
                    dot={false}
                    name="System Load"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="responseTime" 
                    stroke="#8b5cf6" 
                    strokeWidth={2}
                    dot={false}
                    name="Response Time"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="errorRate" 
                    stroke="#ef4444" 
                    strokeWidth={2}
                    dot={false}
                    name="Error Rate"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between text-sm">
            <span>Last Updated:</span>
            <span className="font-medium">
              {new Date(data.timestamp).toLocaleTimeString()}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}