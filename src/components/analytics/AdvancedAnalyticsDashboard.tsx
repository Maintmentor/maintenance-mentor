import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import SecurityTrendsChart from './SecurityTrendsChart';
import UserBehaviorChart from './UserBehaviorChart';
import SystemPerformanceChart from './SystemPerformanceChart';
import AnomalyDetectionWidget from './AnomalyDetectionWidget';
import PredictiveInsightsWidget from './PredictiveInsightsWidget';
import RealTimeMetricsWidget from './RealTimeMetricsWidget';
import MLModelTrainer from '../ml/MLModelTrainer';
import { 
  Shield, 
  Users, 
  Activity, 
  AlertTriangle,
  TrendingUp,
  Zap,
  Eye,
  Brain,
  RefreshCw
} from 'lucide-react';

export default function AdvancedAnalyticsDashboard() {
  const [securityTrends, setSecurityTrends] = useState(null);
  const [userBehavior, setUserBehavior] = useState(null);
  const [systemPerformance, setSystemPerformance] = useState(null);
  const [anomalies, setAnomalies] = useState([]);
  const [insights, setInsights] = useState([]);
  const [realTimeData, setRealTimeData] = useState(null);
  const [timeRange, setTimeRange] = useState('7d');
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      loadAnalyticsData();
      const interval = setInterval(loadRealTimeData, 5000);
      return () => clearInterval(interval);
    }
  }, [user, timeRange]);

  const loadAnalyticsData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        loadSecurityTrends(),
        loadUserBehavior(),
        loadSystemPerformance(),
        loadAnomalies(),
        loadPredictiveInsights(),
        loadRealTimeData()
      ]);
    } catch (error) {
      console.error('Error loading analytics:', error);
      toast({
        title: 'Error',
        description: 'Failed to load analytics data.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadSecurityTrends = async () => {
    const { data, error } = await supabase.functions.invoke('advanced-analytics-processor', {
      body: { action: 'getSecurityTrends', userId: user.id, timeRange }
    });
    if (!error) setSecurityTrends(data.trends);
  };

  const loadUserBehavior = async () => {
    const { data, error } = await supabase.functions.invoke('advanced-analytics-processor', {
      body: { action: 'getUserBehaviorPatterns', userId: user.id, timeRange }
    });
    if (!error) setUserBehavior(data.patterns);
  };

  const loadSystemPerformance = async () => {
    const { data, error } = await supabase.functions.invoke('advanced-analytics-processor', {
      body: { action: 'getSystemPerformance', timeRange }
    });
    if (!error) setSystemPerformance(data.performance);
  };

  const loadAnomalies = async () => {
    const { data, error } = await supabase.functions.invoke('advanced-analytics-processor', {
      body: { action: 'detectAnomalies', userId: user.id, metricTypes: ['login_pattern', 'access_frequency'] }
    });
    if (!error) setAnomalies(data.anomalies);
  };

  const loadPredictiveInsights = async () => {
    const { data, error } = await supabase.functions.invoke('advanced-analytics-processor', {
      body: { action: 'getPredictiveInsights', userId: user.id }
    });
    if (!error) setInsights(data.insights);
  };

  const loadRealTimeData = async () => {
    const { data, error } = await supabase.functions.invoke('advanced-analytics-processor', {
      body: { action: 'generateRealTimeData' }
    });
    if (!error) setRealTimeData(data.realTimeMetrics);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold">Advanced Analytics</h2>
          <p className="text-gray-600">Real-time insights and predictive analytics</p>
        </div>
        <div className="flex gap-3">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1d">24 Hours</SelectItem>
              <SelectItem value="7d">7 Days</SelectItem>
              <SelectItem value="30d">30 Days</SelectItem>
              <SelectItem value="90d">90 Days</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={loadAnalyticsData} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="behavior">User Behavior</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
          <TabsTrigger value="ml">ML Training</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {realTimeData && <RealTimeMetricsWidget data={realTimeData} />}
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <AnomalyDetectionWidget anomalies={anomalies} />
            <PredictiveInsightsWidget insights={insights} />
          </div>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          {securityTrends && <SecurityTrendsChart data={securityTrends} />}
        </TabsContent>

        <TabsContent value="behavior" className="space-y-6">
          {userBehavior && <UserBehaviorChart data={userBehavior} />}
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          {systemPerformance && <SystemPerformanceChart data={systemPerformance} />}
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <AnomalyDetectionWidget anomalies={anomalies} />
            <PredictiveInsightsWidget insights={insights} />
          </div>
        </TabsContent>

        <TabsContent value="ml" className="space-y-6">
          <MLModelTrainer />
        </TabsContent>
      </Tabs>
    </div>
  );
}