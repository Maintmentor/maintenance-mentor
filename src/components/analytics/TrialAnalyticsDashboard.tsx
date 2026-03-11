import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, RefreshCw } from 'lucide-react';
import { TrialMetricsCards } from './TrialMetricsCards';
import { TrialConversionChart } from './TrialConversionChart';
import { trialAnalyticsService, TrialMetrics, ConversionTrend, RevenueByPlan } from '@/services/trialAnalyticsService';
import { toast } from 'sonner';
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend, CartesianGrid } from 'recharts';

export function TrialAnalyticsDashboard() {
  const [metrics, setMetrics] = useState<TrialMetrics>({
    totalTrials: 0,
    activeTrials: 0,
    expiredTrials: 0,
    convertedTrials: 0,
    conversionRate: 0,
    averageDaysToConversion: 0,
    totalRevenue: 0,
    cancelledTrials: 0,
  });
  const [conversionTrends, setConversionTrends] = useState<ConversionTrend[]>([]);
  const [revenueByPlan, setRevenueByPlan] = useState<RevenueByPlan[]>([]);
  const [loading, setLoading] = useState(true);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const [metricsData, trendsData, revenueData] = await Promise.all([
        trialAnalyticsService.getTrialMetrics(),
        trialAnalyticsService.getConversionTrends(30),
        trialAnalyticsService.getRevenueByPlan(),
      ]);
      setMetrics(metricsData);
      setConversionTrends(trendsData);
      setRevenueByPlan(revenueData);
    } catch (error) {
      console.error('Error loading analytics:', error);
      toast.error('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, []);

  const handleExportMetrics = () => {
    trialAnalyticsService.exportToCSV([metrics], 'trial-metrics.csv');
    toast.success('Metrics exported successfully');
  };

  const handleExportTrends = () => {
    trialAnalyticsService.exportToCSV(conversionTrends, 'conversion-trends.csv');
    toast.success('Trends exported successfully');
  };

  const handleExportRevenue = () => {
    trialAnalyticsService.exportToCSV(revenueByPlan, 'revenue-by-plan.csv');
    toast.success('Revenue data exported successfully');
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading analytics...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Trial Analytics</h2>
          <p className="text-muted-foreground">Track trial performance and conversion metrics</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={loadAnalytics} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={handleExportMetrics} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export All
          </Button>
        </div>
      </div>

      <TrialMetricsCards metrics={metrics} />

      <TrialConversionChart data={conversionTrends} />

      <Card>
        <CardHeader>
          <CardTitle>Revenue by Plan</CardTitle>
          <CardDescription>Revenue breakdown from trial conversions by subscription plan</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={revenueByPlan}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="plan" />
              <YAxis />
              <Tooltip formatter={(value: any) => `$${value.toFixed(2)}`} />
              <Legend />
              <Bar dataKey="revenue" fill="#8884d8" name="Revenue ($)" />
              <Bar dataKey="conversions" fill="#82ca9d" name="Conversions" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
