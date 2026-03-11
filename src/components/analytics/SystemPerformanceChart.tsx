import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { Activity, Cpu, HardDrive, Zap, TrendingUp, TrendingDown } from 'lucide-react';

interface SystemPerformanceChartProps {
  data: {
    cpuUsage: Array<{ timestamp: string; metric_value: number }>;
    memoryUsage: Array<{ timestamp: string; metric_value: number }>;
    responseTime: Array<{ timestamp: string; metric_value: number }>;
    throughput: Array<{ timestamp: string; metric_value: number }>;
  };
}

export default function SystemPerformanceChart({ data }: SystemPerformanceChartProps) {
  // Generate sample data if empty
  const generateSampleData = (baseValue: number, variance: number) => {
    return Array.from({ length: 24 }, (_, i) => ({
      time: `${i}:00`,
      value: Math.max(0, baseValue + (Math.random() - 0.5) * variance)
    }));
  };

  const cpuData = data.cpuUsage.length > 0 
    ? data.cpuUsage.slice(-24).map((item, index) => ({
        time: `${index}:00`,
        value: item.metric_value
      }))
    : generateSampleData(45, 30);

  const memoryData = data.memoryUsage.length > 0
    ? data.memoryUsage.slice(-24).map((item, index) => ({
        time: `${index}:00`,
        value: item.metric_value
      }))
    : generateSampleData(60, 25);

  const responseData = data.responseTime.length > 0
    ? data.responseTime.slice(-24).map((item, index) => ({
        time: `${index}:00`,
        value: item.metric_value
      }))
    : generateSampleData(200, 100);

  const throughputData = data.throughput.length > 0
    ? data.throughput.slice(-24).map((item, index) => ({
        time: `${index}:00`,
        value: item.metric_value
      }))
    : generateSampleData(850, 200);

  const currentCpu = cpuData[cpuData.length - 1]?.value || 0;
  const currentMemory = memoryData[memoryData.length - 1]?.value || 0;
  const currentResponse = responseData[responseData.length - 1]?.value || 0;
  const currentThroughput = throughputData[throughputData.length - 1]?.value || 0;

  const getStatusColor = (value: number, thresholds: { warning: number; critical: number }) => {
    if (value > thresholds.critical) return 'destructive';
    if (value > thresholds.warning) return 'secondary';
    return 'default';
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">CPU Usage</p>
                <p className="text-2xl font-bold">{Math.round(currentCpu)}%</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <Cpu className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <div className="flex items-center mt-2">
              <Badge variant={getStatusColor(currentCpu, { warning: 70, critical: 90 })}>
                {currentCpu > 90 ? 'Critical' : currentCpu > 70 ? 'Warning' : 'Normal'}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Memory Usage</p>
                <p className="text-2xl font-bold">{Math.round(currentMemory)}%</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <HardDrive className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <div className="flex items-center mt-2">
              <Badge variant={getStatusColor(currentMemory, { warning: 80, critical: 95 })}>
                {currentMemory > 95 ? 'Critical' : currentMemory > 80 ? 'Warning' : 'Normal'}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Response Time</p>
                <p className="text-2xl font-bold">{Math.round(currentResponse)}ms</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <Activity className="h-6 w-6 text-purple-600" />
              </div>
            </div>
            <div className="flex items-center mt-2">
              <Badge variant={getStatusColor(currentResponse, { warning: 300, critical: 500 })}>
                {currentResponse > 500 ? 'Slow' : currentResponse > 300 ? 'Warning' : 'Fast'}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Throughput</p>
                <p className="text-2xl font-bold">{Math.round(currentThroughput)}</p>
              </div>
              <div className="p-3 bg-orange-100 rounded-full">
                <Zap className="h-6 w-6 text-orange-600" />
              </div>
            </div>
            <div className="flex items-center mt-2">
              <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
              <span className="text-sm text-green-600">+5% from last hour</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>CPU & Memory Usage</CardTitle>
            <CardDescription>System resource utilization over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  data={cpuData}
                  name="CPU %"
                />
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#10b981" 
                  strokeWidth={2}
                  data={memoryData}
                  name="Memory %"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Response Time</CardTitle>
            <CardDescription>API response time trends</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={responseData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip formatter={(value) => [`${value}ms`, 'Response Time']} />
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#8b5cf6" 
                  fill="#ddd6fe" 
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>System Throughput</CardTitle>
            <CardDescription>Requests processed per minute</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={throughputData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip formatter={(value) => [`${value} req/min`, 'Throughput']} />
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#f59e0b" 
                  fill="#fef3c7" 
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Performance Summary</CardTitle>
            <CardDescription>Key performance indicators</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { metric: 'Uptime', value: '99.9%', status: 'excellent' },
                { metric: 'Error Rate', value: '0.1%', status: 'good' },
                { metric: 'Peak CPU', value: '87%', status: 'warning' },
                { metric: 'Peak Memory', value: '92%', status: 'warning' },
                { metric: 'Avg Response', value: '245ms', status: 'good' },
                { metric: 'Cache Hit Rate', value: '94%', status: 'excellent' }
              ].map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">{item.metric}</p>
                    <p className="text-sm text-gray-600">{item.value}</p>
                  </div>
                  <Badge variant={
                    item.status === 'excellent' ? 'default' :
                    item.status === 'good' ? 'secondary' : 'destructive'
                  }>
                    {item.status === 'excellent' ? '✓' : item.status === 'good' ? '○' : '⚠'}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}