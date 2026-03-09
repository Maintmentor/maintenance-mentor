import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { CheckCircle, XCircle, TrendingUp, Clock, MessageSquare } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface QuestionStats {
  totalQuestions: number;
  acceptedQuestions: number;
  rejectedQuestions: number;
  acceptanceRate: number;
  avgResponseTime: number;
}

interface TopicData {
  topic: string;
  count: number;
}

interface DailyPattern {
  date: string;
  accepted: number;
  rejected: number;
}

export default function QuestionAnalyticsDashboard() {
  const [stats, setStats] = useState<QuestionStats | null>(null);
  const [topicDistribution, setTopicDistribution] = useState<TopicData[]>([]);
  const [rejectedTopics, setRejectedTopics] = useState<TopicData[]>([]);
  const [dailyPatterns, setDailyPatterns] = useState<DailyPattern[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const COLORS = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);

      // Fetch all analytics data
      const { data: analyticsData, error } = await supabase
        .from('question_analytics')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (!analyticsData || analyticsData.length === 0) {
        setStats({
          totalQuestions: 0,
          acceptedQuestions: 0,
          rejectedQuestions: 0,
          acceptanceRate: 0,
          avgResponseTime: 0
        });
        return;
      }

      // Calculate overall stats
      const total = analyticsData.length;
      const accepted = analyticsData.filter(q => q.is_maintenance_related).length;
      const rejected = total - accepted;
      const avgTime = analyticsData.reduce((sum, q) => sum + (q.response_time_ms || 0), 0) / total;

      setStats({
        totalQuestions: total,
        acceptedQuestions: accepted,
        rejectedQuestions: rejected,
        acceptanceRate: (accepted / total) * 100,
        avgResponseTime: avgTime
      });

      // Calculate topic distribution for rejected questions
      const topicCounts: Record<string, number> = {};
      analyticsData
        .filter(q => !q.is_maintenance_related)
        .forEach(q => {
          const topic = q.detected_topic || 'unknown';
          topicCounts[topic] = (topicCounts[topic] || 0) + 1;
        });

      const topicsArray = Object.entries(topicCounts)
        .map(([topic, count]) => ({ topic, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 8);

      setRejectedTopics(topicsArray);

      // Calculate acceptance/rejection distribution
      setTopicDistribution([
        { topic: 'Accepted', count: accepted },
        { topic: 'Rejected', count: rejected }
      ]);

      // Calculate daily patterns (last 7 days)
      const last7Days = new Date();
      last7Days.setDate(last7Days.getDate() - 7);

      const dailyData: Record<string, { accepted: number; rejected: number }> = {};
      
      analyticsData
        .filter(q => new Date(q.created_at) >= last7Days)
        .forEach(q => {
          const date = new Date(q.created_at).toLocaleDateString();
          if (!dailyData[date]) {
            dailyData[date] = { accepted: 0, rejected: 0 };
          }
          if (q.is_maintenance_related) {
            dailyData[date].accepted++;
          } else {
            dailyData[date].rejected++;
          }
        });

      const patternsArray = Object.entries(dailyData)
        .map(([date, counts]) => ({ date, ...counts }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      setDailyPatterns(patternsArray);

    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold">Question Analytics Dashboard</h2>
        <p className="text-gray-600 mt-2">Track and analyze user question patterns</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Total Questions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <MessageSquare className="h-5 w-5 text-blue-600" />
              <span className="text-2xl font-bold">{stats?.totalQuestions || 0}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Accepted</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="text-2xl font-bold">{stats?.acceptedQuestions || 0}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Rejected</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <XCircle className="h-5 w-5 text-red-600" />
              <span className="text-2xl font-bold">{stats?.rejectedQuestions || 0}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Acceptance Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-purple-600" />
              <span className="text-2xl font-bold">{stats?.acceptanceRate.toFixed(1)}%</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-600">Avg Response Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-orange-600" />
              <span className="text-2xl font-bold">{Math.round(stats?.avgResponseTime || 0)}ms</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Tabs defaultValue="distribution" className="space-y-4">
        <TabsList>
          <TabsTrigger value="distribution">Distribution</TabsTrigger>
          <TabsTrigger value="topics">Rejected Topics</TabsTrigger>
          <TabsTrigger value="patterns">Daily Patterns</TabsTrigger>
        </TabsList>

        <TabsContent value="distribution" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Question Acceptance Distribution</CardTitle>
              <CardDescription>Breakdown of accepted vs rejected questions</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={topicDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ topic, count }) => `${topic}: ${count}`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {topicDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.topic === 'Accepted' ? '#10b981' : '#ef4444'} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="topics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Most Common Non-Maintenance Topics</CardTitle>
              <CardDescription>Understanding what users are asking about outside maintenance scope</CardDescription>
            </CardHeader>
            <CardContent>
              {rejectedTopics.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={rejectedTopics}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="topic" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#ef4444" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-center text-gray-500 py-8">No rejected questions yet</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="patterns" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Daily Question Patterns (Last 7 Days)</CardTitle>
              <CardDescription>Track question trends over time</CardDescription>
            </CardHeader>
            <CardContent>
              {dailyPatterns.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={dailyPatterns}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="accepted" stroke="#10b981" name="Accepted" strokeWidth={2} />
                    <Line type="monotone" dataKey="rejected" stroke="#ef4444" name="Rejected" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-center text-gray-500 py-8">Not enough data for pattern analysis</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
