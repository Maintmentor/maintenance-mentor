import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/lib/supabase';
import { 
  Mic, TrendingUp, Activity, Target, Clock, 
  AlertCircle, Award, BarChart3, MessageSquare 
} from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

export function VoiceAnalyticsDashboard() {
  const [timeRange, setTimeRange] = useState('week');
  const [analytics, setAnalytics] = useState<any>({});
  const [insights, setInsights] = useState<any[]>([]);
  const [patterns, setPatterns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, [timeRange]);

  const loadAnalytics = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase.functions.invoke('voice-analytics-processor', {
        body: { 
          action: 'getAnalytics', 
          userId: user.id,
          data: { timeRange }
        }
      });

      setAnalytics(data?.analytics || {});
      
      const { data: insightsData } = await supabase.functions.invoke('voice-analytics-processor', {
        body: { 
          action: 'getInsights', 
          userId: user.id 
        }
      });
      
      setInsights(insightsData?.insights || []);

      const { data: patternsData } = await supabase.functions.invoke('voice-analytics-processor', {
        body: { 
          action: 'analyzePatterns', 
          userId: user.id 
        }
      });
      
      setPatterns(patternsData?.patterns || []);
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const mockData = {
    accuracy: [
      { date: 'Mon', accuracy: 85 },
      { date: 'Tue', accuracy: 88 },
      { date: 'Wed', accuracy: 82 },
      { date: 'Thu', accuracy: 90 },
      { date: 'Fri', accuracy: 92 },
      { date: 'Sat', accuracy: 89 },
      { date: 'Sun', accuracy: 94 }
    ],
    commands: [
      { type: 'Diagnostic', count: 45, color: '#3b82f6' },
      { type: 'Scheduling', count: 32, color: '#10b981' },
      { type: 'Parts', count: 28, color: '#f59e0b' },
      { type: 'Maintenance', count: 25, color: '#8b5cf6' },
      { type: 'Reports', count: 20, color: '#ef4444' }
    ]
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold">Voice Analytics</h2>
        <div className="flex gap-2">
          {['week', 'month', 'quarter'].map(range => (
            <Button
              key={range}
              variant={timeRange === range ? 'default' : 'outline'}
              onClick={() => setTimeRange(range)}
              size="sm"
            >
              {range.charAt(0).toUpperCase() + range.slice(1)}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Commands</p>
                <p className="text-2xl font-bold">1,234</p>
                <p className="text-xs text-green-600">+12% from last period</p>
              </div>
              <Mic className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Success Rate</p>
                <p className="text-2xl font-bold">92%</p>
                <p className="text-xs text-green-600">+5% improvement</p>
              </div>
              <Target className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Response</p>
                <p className="text-2xl font-bold">320ms</p>
                <p className="text-xs text-green-600">-50ms faster</p>
              </div>
              <Clock className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Accuracy</p>
                <p className="text-2xl font-bold">89%</p>
                <p className="text-xs text-green-600">+3% better</p>
              </div>
              <Activity className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="trends" className="space-y-4">
        <TabsList>
          <TabsTrigger value="trends">Accuracy Trends</TabsTrigger>
          <TabsTrigger value="commands">Command Types</TabsTrigger>
          <TabsTrigger value="patterns">Patterns</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="trends">
          <Card>
            <CardHeader>
              <CardTitle>Accuracy Over Time</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={mockData.accuracy}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="accuracy" stroke="#3b82f6" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="commands">
          <Card>
            <CardHeader>
              <CardTitle>Command Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={mockData.commands}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ type, count }) => `${type}: ${count}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {mockData.commands.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="patterns">
          <Card>
            <CardHeader>
              <CardTitle>Common Command Patterns</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {patterns.slice(0, 5).map((pattern, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium">{pattern.pattern}</p>
                      <div className="flex gap-4 mt-1 text-sm text-muted-foreground">
                        <span>Used {pattern.frequency} times</span>
                        <span>{(pattern.success_rate * 100).toFixed(0)}% success</span>
                      </div>
                    </div>
                    <Badge variant={pattern.success_rate > 0.9 ? 'default' : 'secondary'}>
                      {(pattern.avg_confidence * 100).toFixed(0)}% confidence
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights">
          <div className="grid gap-4">
            {insights.map((insight) => (
              <Card key={insight.id}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    {insight.type === 'improvement' && <AlertCircle className="h-5 w-5 text-orange-600 mt-1" />}
                    {insight.type === 'achievement' && <Award className="h-5 w-5 text-green-600 mt-1" />}
                    {insight.type === 'recommendation' && <MessageSquare className="h-5 w-5 text-blue-600 mt-1" />}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold">{insight.title}</h3>
                        <Badge variant={
                          insight.priority === 'high' ? 'destructive' : 
                          insight.priority === 'medium' ? 'default' : 'secondary'
                        }>
                          {insight.priority}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{insight.description}</p>
                      {insight.action_item && (
                        <Button size="sm" variant="outline" className="mt-2">
                          {insight.action_item}
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}