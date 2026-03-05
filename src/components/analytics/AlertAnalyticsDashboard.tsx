import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertFrequencyChart } from './AlertFrequencyChart';
import { AlertTypeDistributionChart } from './AlertTypeDistributionChart';
import { AlertExecutionLogs } from './AlertExecutionLogs';
import { PredictiveInsightsWidget } from './PredictiveInsightsWidget';
import { AnomalyDetectionWidget } from './AnomalyDetectionWidget';

import { 
  alertAnalyticsService,
  ResponseTimeMetrics,
  SystemReliabilityMetrics,
  AlertEffectivenessMetrics,
  PeakAlertTime 
} from '@/services/alertAnalyticsService';
import { alertGoalService, AlertPerformanceGoal } from '@/services/alertGoalService';
import { Download, TrendingUp, Clock, CheckCircle, AlertTriangle, Activity, TrendingDown } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { toast } from 'sonner';



export function AlertAnalyticsDashboard() {
  const [responseMetrics, setResponseMetrics] = useState<ResponseTimeMetrics | null>(null);
  const [reliabilityMetrics, setReliabilityMetrics] = useState<SystemReliabilityMetrics | null>(null);
  const [effectivenessMetrics, setEffectivenessMetrics] = useState<AlertEffectivenessMetrics | null>(null);
  const [peakTimes, setPeakTimes] = useState<PeakAlertTime[]>([]);
  const [goals, setGoals] = useState<AlertPerformanceGoal[]>([]);
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    loadMetrics();
  }, []);

  const loadMetrics = async () => {
    try {
      setLoading(true);
      const [response, reliability, effectiveness, peaks, activeGoals] = await Promise.all([
        alertAnalyticsService.getResponseTimeMetrics(),
        alertAnalyticsService.getSystemReliabilityMetrics(),
        alertAnalyticsService.getAlertEffectivenessMetrics(),
        alertAnalyticsService.getPeakAlertTimes(),
        alertGoalService.getActiveGoals()
      ]);
      setResponseMetrics(response);
      setReliabilityMetrics(reliability);
      setEffectivenessMetrics(effectiveness);
      setPeakTimes(peaks);
      setGoals(activeGoals);
    } catch (error) {
      console.error('Error loading metrics:', error);
      toast.error('Failed to load analytics metrics');
    } finally {
      setLoading(false);
    }
  };

  const getGoalStatus = (goalType: string, actualValue: number) => {
    const goal = goals.find(g => g.goal_type === goalType);
    if (!goal) return null;

    const metGoal = alertGoalService.evaluateGoal(goalType, goal.target_value, actualValue);
    return { metGoal, targetValue: goal.target_value };
  };

  const renderGoalBadge = (goalType: string, actualValue: number) => {
    const status = getGoalStatus(goalType, actualValue);
    if (!status) return null;

    return (
      <Badge variant={status.metGoal ? 'default' : 'destructive'} className="ml-2">
        {status.metGoal ? (
          <><TrendingUp className="h-3 w-3 mr-1" /> Meeting Goal</>
        ) : (
          <><TrendingDown className="h-3 w-3 mr-1" /> Below Goal</>
        )}
      </Badge>
    );
  };


  const handleExport = async () => {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);
      
      const blob = await alertAnalyticsService.exportAlertAnalytics(startDate, endDate);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `alert-analytics-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Analytics report exported successfully');
    } catch (error) {
      console.error('Error exporting analytics:', error);
      toast.error('Failed to export analytics report');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Alert System Analytics</h2>
          <p className="text-muted-foreground">Monitor alert performance and system reliability</p>
        </div>
        <Button onClick={handleExport} className="gap-2">
          <Download className="h-4 w-4" />
          Export Report
        </Button>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              Avg Response Time
              {responseMetrics && renderGoalBadge('response_time', responseMetrics.averageResponseTime * 60)}
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {responseMetrics?.averageResponseTime.toFixed(1) || 0} min
            </div>
            <p className="text-xs text-muted-foreground">
              Median: {responseMetrics?.medianResponseTime.toFixed(1) || 0} min
            </p>
          </CardContent>
        </Card>


        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              System Uptime
              {reliabilityMetrics && renderGoalBadge('uptime_percentage', reliabilityMetrics.uptimePercentage)}
            </CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {reliabilityMetrics?.uptimePercentage.toFixed(2) || 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              {reliabilityMetrics?.successfulExecutions || 0} / {reliabilityMetrics?.totalExecutions || 0} successful
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium flex items-center">
              False Positive Rate
              {effectivenessMetrics && renderGoalBadge('false_positive_rate', effectivenessMetrics.falsePositiveRate)}
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {effectivenessMetrics?.falsePositiveRate.toFixed(1) || 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              {effectivenessMetrics?.falsePositives || 0} false positives
            </p>
          </CardContent>
        </Card>


        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Acknowledgment Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {effectivenessMetrics 
                ? ((effectivenessMetrics.acknowledgedAlerts / effectivenessMetrics.totalAlerts) * 100).toFixed(1)
                : 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              {effectivenessMetrics?.acknowledgedAlerts || 0} / {effectivenessMetrics?.totalAlerts || 0} acknowledged
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="trends" className="space-y-4">
        <TabsList>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="distribution">Distribution</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="logs">Execution Logs</TabsTrigger>
        </TabsList>


        <TabsContent value="trends" className="space-y-4">
          <AlertFrequencyChart days={30} />
          
          <Card>
            <CardHeader>
              <CardTitle>Peak Alert Times (24-Hour)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={peakTimes}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="hour" tickFormatter={(hour) => `${hour}:00`} />
                  <YAxis />
                  <Tooltip labelFormatter={(hour) => `${hour}:00 - ${hour}:59`} />
                  <Bar dataKey="count" fill="#8b5cf6" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="distribution" className="space-y-4">
          <AlertTypeDistributionChart />
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Response Time Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Fastest Response</span>
                  <span className="font-medium">{responseMetrics?.fastestResponse.toFixed(1) || 0} min</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Average Response</span>
                  <span className="font-medium">{responseMetrics?.averageResponseTime.toFixed(1) || 0} min</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Median Response</span>
                  <span className="font-medium">{responseMetrics?.medianResponseTime.toFixed(1) || 0} min</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Slowest Response</span>
                  <span className="font-medium">{responseMetrics?.slowestResponse.toFixed(1) || 0} min</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>System Reliability</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Total Executions</span>
                  <span className="font-medium">{reliabilityMetrics?.totalExecutions || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Successful</span>
                  <span className="font-medium text-green-600">{reliabilityMetrics?.successfulExecutions || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Failed</span>
                  <span className="font-medium text-red-600">{reliabilityMetrics?.failedExecutions || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Avg Execution Time</span>
                  <span className="font-medium">{reliabilityMetrics?.averageExecutionTime.toFixed(0) || 0} ms</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="logs" className="space-y-4">
          <AlertExecutionLogs />
        </TabsContent>
      </Tabs>

    </div>
  );
}
