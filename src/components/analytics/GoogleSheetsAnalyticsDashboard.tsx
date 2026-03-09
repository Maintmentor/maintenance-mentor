import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, TrendingUp, Users, FileText, Clock, Activity } from 'lucide-react';
import { googleSheetsAnalyticsService, UserQueryStats, QueryTrend, CategoryStats, SheetHealthMetric } from '@/services/googleSheetsAnalyticsService';
import QueryTrendsChart from './QueryTrendsChart';
import CategoryBreakdownChart from './CategoryBreakdownChart';
import { toast } from 'sonner';

export default function GoogleSheetsAnalyticsDashboard() {
  const [loading, setLoading] = useState(true);
  const [userStats, setUserStats] = useState<UserQueryStats[]>([]);
  const [trends, setTrends] = useState<QueryTrend[]>([]);
  const [categories, setCategories] = useState<CategoryStats[]>([]);
  const [health, setHealth] = useState<SheetHealthMetric[]>([]);
  const [avgResponseTime, setAvgResponseTime] = useState(0);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const [users, trendsData, categoriesData, healthData, responseTime] = await Promise.all([
        googleSheetsAnalyticsService.getTotalQueriesPerUser(),
        googleSheetsAnalyticsService.getQueryTrends(30),
        googleSheetsAnalyticsService.getCategoryBreakdown(),
        googleSheetsAnalyticsService.getSheetHealthMetrics(),
        googleSheetsAnalyticsService.getAverageResponseTime()
      ]);

      setUserStats(users);
      setTrends(trendsData);
      setCategories(categoriesData);
      setHealth(healthData);
      setAvgResponseTime(responseTime);
    } catch (error) {
      console.error('Failed to load analytics:', error);
      toast.error('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const blob = await googleSheetsAnalyticsService.exportAnalyticsReport();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `google-sheets-analytics-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Analytics report exported successfully');
    } catch (error) {
      console.error('Export failed:', error);
      toast.error('Failed to export report');
    }
  };

  const totalQueries = userStats.reduce((sum, u) => sum + u.total_queries, 0);
  const healthySheets = health.filter(h => h.status === 'healthy').length;
  const warningSheets = health.filter(h => h.status === 'warning').length;
  const errorSheets = health.filter(h => h.status === 'error').length;

  if (loading) {
    return <div className="flex items-center justify-center p-8">Loading analytics...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold">Google Sheets Analytics</h2>
        <Button onClick={handleExport}>
          <Download className="w-4 h-4 mr-2" />
          Export Report
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Queries</CardTitle>
            <FileText className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalQueries.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Across all users</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Users className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userStats.length}</div>
            <p className="text-xs text-muted-foreground">With Google Sheets</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
            <Clock className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgResponseTime.toFixed(2)}s</div>
            <p className="text-xs text-muted-foreground">Per query</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Sheet Health</CardTitle>
            <Activity className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Badge variant="default">{healthySheets}</Badge>
              <Badge variant="secondary">{warningSheets}</Badge>
              <Badge variant="destructive">{errorSheets}</Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Healthy / Warning / Error</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <QueryTrendsChart data={trends} />
        <CategoryBreakdownChart data={categories} />
      </div>

      {/* Top Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Most Active Users</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">User</th>
                  <th className="text-left p-2">Total Queries</th>
                  <th className="text-left p-2">Last Query</th>
                  <th className="text-left p-2">Sheet ID</th>
                </tr>
              </thead>
              <tbody>
                {userStats.slice(0, 10).map((user) => (
                  <tr key={user.user_id} className="border-b hover:bg-muted/50">
                    <td className="p-2">{user.user_email}</td>
                    <td className="p-2">
                      <Badge variant="secondary">{user.total_queries}</Badge>
                    </td>
                    <td className="p-2 text-sm text-muted-foreground">
                      {new Date(user.last_query).toLocaleDateString()}
                    </td>
                    <td className="p-2 text-sm font-mono">{user.sheet_id.slice(0, 20)}...</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Sheet Health Table */}
      <Card>
        <CardHeader>
          <CardTitle>Sheet Health Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">User</th>
                  <th className="text-left p-2">Status</th>
                  <th className="text-left p-2">Last Updated</th>
                  <th className="text-left p-2">Row Count</th>
                </tr>
              </thead>
              <tbody>
                {health.map((metric) => (
                  <tr key={metric.sheet_id} className="border-b hover:bg-muted/50">
                    <td className="p-2">{metric.user_email}</td>
                    <td className="p-2">
                      <Badge 
                        variant={
                          metric.status === 'healthy' ? 'default' : 
                          metric.status === 'warning' ? 'secondary' : 
                          'destructive'
                        }
                      >
                        {metric.status}
                      </Badge>
                    </td>
                    <td className="p-2 text-sm text-muted-foreground">
                      {new Date(metric.last_updated).toLocaleDateString()}
                    </td>
                    <td className="p-2">{metric.row_count.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
