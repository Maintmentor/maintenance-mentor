import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { imageQualityAnalyticsService } from '@/services/imageQualityAnalyticsService';
import { imageQualityAnalyticsService2 } from '@/services/imageQualityAnalyticsService2';
import { Download, ThumbsUp, ThumbsDown, TrendingUp, AlertTriangle, Settings } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { RecentAlertsWidget } from './RecentAlertsWidget';
import { ImageQualityAlertSettings } from './ImageQualityAlertSettings';
import { AlertExecutionLogs } from './AlertExecutionLogs';
import { GoalHistoryWidget } from './GoalHistoryWidget';
import { PredictiveInsightsWidget } from './PredictiveInsightsWidget';
import { AnomalyDetectionWidget } from './AnomalyDetectionWidget';
import { EnsemblePredictionWidget } from './EnsemblePredictionWidget';
import { ModelPerformanceComparison } from '../ml/ModelPerformanceComparison';
import { useAuth } from '@/contexts/AuthContext';





export function ImageQualityDashboard() {
  const { user } = useAuth();

  const [overallAccuracy, setOverallAccuracy] = useState(0);
  const [queryPerformance, setQueryPerformance] = useState<any[]>([]);
  const [problematicParts, setProblematicParts] = useState<any[]>([]);
  const [scoreDistribution, setScoreDistribution] = useState<any[]>([]);
  const [feedbackTrends, setFeedbackTrends] = useState<any[]>([]);
  const [negativeFeedback, setNegativeFeedback] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [filters, setFilters] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    partCategory: '',
    source: ''
  });

  useEffect(() => {
    loadAnalytics();
  }, [filters]);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const [accuracy, queries, parts, scores, trends, negative] = await Promise.all([
        imageQualityAnalyticsService.getOverallAccuracy(filters),
        imageQualityAnalyticsService.getQueryPerformance(filters),
        imageQualityAnalyticsService2.getProblematicParts(filters),
        imageQualityAnalyticsService2.getVerificationScoreDistribution(filters),
        imageQualityAnalyticsService2.getFeedbackTrends(filters),
        imageQualityAnalyticsService2.getNegativeFeedbackImages(filters)
      ]);

      setOverallAccuracy(accuracy);
      setQueryPerformance(queries);
      setProblematicParts(parts);
      setScoreDistribution(scores);
      setFeedbackTrends(trends);
      setNegativeFeedback(negative);
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    const csvData = [
      ['Part Number', 'Search Query', 'Image URL', 'Feedback', 'AI Score', 'Date'],
      ...negativeFeedback.map(item => [
        item.part_number,
        item.search_query,
        item.image_url,
        item.feedback_type,
        item.ai_verification_score || 'N/A',
        new Date(item.created_at).toLocaleDateString()
      ])
    ];

    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `image-quality-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading analytics...</div>;
  }

  return (
    <Tabs defaultValue="analytics" className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Image Quality Analytics</h1>
        <Button onClick={exportToCSV} className="flex items-center gap-2">
          <Download className="w-4 h-4" />
          Export CSV
        </Button>
      </div>

      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="analytics">Analytics</TabsTrigger>
        <TabsTrigger value="alerts">Alerts</TabsTrigger>
        <TabsTrigger value="settings">Settings</TabsTrigger>
      </TabsList>

      <TabsContent value="analytics" className="space-y-6">


      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium">Start Date</label>
              <Input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
              />
            </div>
            <div>
              <label className="text-sm font-medium">End Date</label>
              <Input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
              />
            </div>
          </div>
        </CardContent>
      </Card>
      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Overall Accuracy
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-green-600">
              {overallAccuracy.toFixed(1)}%
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Total Feedback</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">
              {negativeFeedback.length + queryPerformance.reduce((acc, q) => acc + q.total_feedback, 0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-600" />
              Problematic Parts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-orange-600">
              {problematicParts.length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Query Performance */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ThumbsUp className="w-5 h-5 text-green-600" />
              Top Performing Queries
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {queryPerformance.slice(0, 5).map((query, idx) => (
                <div key={idx} className="flex justify-between items-center">
                  <span className="text-sm truncate flex-1">{query.search_query}</span>
                  <Badge variant="outline" className="ml-2">
                    {query.accuracy_rate.toFixed(0)}%
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ThumbsDown className="w-5 h-5 text-red-600" />
              Worst Performing Queries
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {queryPerformance.slice(-5).reverse().map((query, idx) => (
                <div key={idx} className="flex justify-between items-center">
                  <span className="text-sm truncate flex-1">{query.search_query}</span>
                  <Badge variant="destructive" className="ml-2">
                    {query.accuracy_rate.toFixed(0)}%
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Problematic Parts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-orange-600" />
            Most Problematic Part Types
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {problematicParts.slice(0, 10).map((part, idx) => (
              <div key={idx} className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
                <div>
                  <div className="font-medium">{part.part_number}</div>
                  <div className="text-sm text-muted-foreground">
                    {part.negative_count} negative / {part.total_feedback} total
                  </div>
                </div>
                <Badge variant="destructive">
                  {part.problem_rate.toFixed(0)}% issues
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Score Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>AI Verification Score Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {scoreDistribution.map((item, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <div className="w-20 text-sm">{item.score}-{item.score + 10}%</div>
                <div className="flex-1 bg-gray-200 rounded-full h-6 overflow-hidden">
                  <div
                    className="bg-blue-600 h-full flex items-center justify-end px-2 text-white text-xs"
                    style={{ width: `${(item.count / Math.max(...scoreDistribution.map(s => s.count))) * 100}%` }}
                  >
                    {item.count > 0 && item.count}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      {/* Feedback Trends */}
      <Card>
        <CardHeader>
          <CardTitle>Feedback Trends Over Time</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {feedbackTrends.map((trend, idx) => (
              <div key={idx} className="flex items-center gap-3">
                <div className="w-24 text-sm">{new Date(trend.date).toLocaleDateString()}</div>
                <div className="flex-1 flex gap-2">
                  <div className="flex-1 bg-green-100 rounded px-2 py-1 text-sm">
                    <ThumbsUp className="w-3 h-3 inline mr-1" />
                    {trend.positive}
                  </div>
                  <div className="flex-1 bg-red-100 rounded px-2 py-1 text-sm">
                    <ThumbsDown className="w-3 h-3 inline mr-1" />
                    {trend.negative}
                  </div>
                </div>
                <Badge>{trend.accuracy_rate.toFixed(0)}%</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Negative Feedback Review */}
      <Card>
        <CardHeader>
          <CardTitle>Images with Negative Feedback - Manual Review</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {negativeFeedback.slice(0, 20).map((item, idx) => (
              <div key={idx} className="border rounded-lg p-4 space-y-2">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="font-medium">{item.part_number}</div>
                    <div className="text-sm text-muted-foreground">Query: {item.search_query}</div>
                    {item.ai_verification_score && (
                      <Badge variant="outline" className="mt-1">
                        AI Score: {item.ai_verification_score}%
                      </Badge>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {new Date(item.created_at).toLocaleDateString()}
                  </div>
                </div>
                <img 
                  src={item.image_url} 
                  alt={item.part_number}
                  className="w-full h-48 object-contain bg-gray-100 rounded"
                />
                {item.ai_verification_reasoning && (
                  <div className="text-sm text-muted-foreground italic">
                    AI: {item.ai_verification_reasoning}
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      </TabsContent>


      <TabsContent value="alerts" className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          {user && <PredictiveInsightsWidget userId={user.id} />}
          {user && <AnomalyDetectionWidget userId={user.id} />}
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          {user && (
            <>
              <EnsemblePredictionWidget />
              <ModelPerformanceComparison />
            </>
          )}
        </div>
        <RecentAlertsWidget />
        <AlertExecutionLogs />
      </TabsContent>



      <TabsContent value="settings" className="space-y-6">
        <ImageQualityAlertSettings />
        <GoalHistoryWidget />
      </TabsContent>

    </Tabs>
  );
}

