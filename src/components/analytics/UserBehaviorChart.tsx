import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Users, Clock, MousePointer, Eye } from 'lucide-react';

interface UserBehaviorChartProps {
  data: {
    sessionDuration: Array<{ timestamp: string; duration: number }>;
    pageViews: Record<string, number>;
    actionFrequency: Record<string, number>;
  };
}

export default function UserBehaviorChart({ data }: UserBehaviorChartProps) {
  const sessionData = data.sessionDuration.slice(-7).map((item, index) => ({
    day: `Day ${index + 1}`,
    duration: Math.round(item.duration / 60) // Convert to minutes
  }));

  const pageViewData = Object.entries(data.pageViews).map(([page, views]) => ({
    page: page.replace('/', '') || 'Home',
    views
  })).slice(0, 6);

  const actionData = Object.entries(data.actionFrequency).map(([action, count]) => ({
    action: action.replace('_', ' ').toUpperCase(),
    count
  }));

  const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4'];

  const avgSessionTime = sessionData.reduce((acc, curr) => acc + curr.duration, 0) / sessionData.length || 0;
  const totalPageViews = Object.values(data.pageViews).reduce((acc, curr) => acc + curr, 0);
  const totalActions = Object.values(data.actionFrequency).reduce((acc, curr) => acc + curr, 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Avg Session</p>
                <p className="text-2xl font-bold">{Math.round(avgSessionTime)}m</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-full">
                <Clock className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Page Views</p>
                <p className="text-2xl font-bold">{totalPageViews}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-full">
                <Eye className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">User Actions</p>
                <p className="text-2xl font-bold">{totalActions}</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-full">
                <MousePointer className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Engagement</p>
                <p className="text-2xl font-bold">87%</p>
              </div>
              <div className="p-3 bg-orange-100 rounded-full">
                <Users className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Session Duration Trends</CardTitle>
            <CardDescription>Average session duration over time</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={sessionData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip formatter={(value) => [`${value} minutes`, 'Duration']} />
                <Bar dataKey="duration" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Page Views Distribution</CardTitle>
            <CardDescription>Most visited pages</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pageViewData}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="views"
                  label={({ page, percent }) => `${page} ${(percent * 100).toFixed(0)}%`}
                >
                  {pageViewData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>User Actions</CardTitle>
            <CardDescription>Most frequent user interactions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {actionData.slice(0, 6).map((action, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">{action.action}</p>
                    <p className="text-sm text-gray-600">User interaction</p>
                  </div>
                  <Badge variant="secondary">{action.count}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Behavior Patterns</CardTitle>
            <CardDescription>Key user behavior insights</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { pattern: 'Peak Activity Hours', value: '2:00 PM - 4:00 PM', trend: 'up' },
                { pattern: 'Most Active Day', value: 'Wednesday', trend: 'stable' },
                { pattern: 'Bounce Rate', value: '23%', trend: 'down' },
                { pattern: 'Return Visitors', value: '68%', trend: 'up' },
                { pattern: 'Mobile Usage', value: '45%', trend: 'up' },
                { pattern: 'Feature Adoption', value: '82%', trend: 'up' }
              ].map((insight, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">{insight.pattern}</p>
                    <p className="text-sm text-gray-600">{insight.value}</p>
                  </div>
                  <Badge variant={insight.trend === 'up' ? 'default' : insight.trend === 'down' ? 'destructive' : 'secondary'}>
                    {insight.trend === 'up' ? '↗' : insight.trend === 'down' ? '↘' : '→'}
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