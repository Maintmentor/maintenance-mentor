import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { translationCostService, CostMetrics, CostAlert, CacheRecommendation } from '@/services/translationCostService';
import { DollarSign, TrendingUp, AlertTriangle, CheckCircle, Clock, Target } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function TranslationCostDashboard() {
  const [metrics, setMetrics] = useState<Record<string, CostMetrics>>({});
  const [alerts, setAlerts] = useState<CostAlert[]>([]);
  const [recommendations, setRecommendations] = useState<CacheRecommendation[]>([]);
  const [monthlyTrend, setMonthlyTrend] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState(30);

  useEffect(() => {
    loadData();
  }, [selectedPeriod]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [metricsData, alertsData, recsData, trendData] = await Promise.all([
        translationCostService.analyzeCosts(selectedPeriod),
        translationCostService.getCostAlerts(),
        translationCostService.getCacheRecommendations(),
        translationCostService.getMonthlyCostTrend(6)
      ]);

      setMetrics(metricsData.metrics);
      setAlerts(alertsData);
      setRecommendations(recsData);
      setMonthlyTrend(trendData);
    } catch (error) {
      console.error('Failed to load cost data:', error);
    } finally {
      setLoading(false);
    }
  };

  const totalCost = Object.values(metrics).reduce((sum, m) => sum + m.totalCost, 0);
  const totalSavings = Object.values(metrics).reduce((sum, m) => sum + m.costSaved, 0);
  const avgCacheHitRate = Object.values(metrics).reduce((sum, m) => sum + m.cacheHitRate, 0) / Object.keys(metrics).length || 0;

  const handleResolveAlert = async (alertId: string) => {
    await translationCostService.resolveAlert(alertId);
    loadData();
  };

  const handleApplyRecommendation = async (recId: string) => {
    await translationCostService.applyRecommendation(recId);
    loadData();
  };

  if (loading) {
    return <div className="p-8">Loading cost analytics...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold">Translation Cost Optimization</h2>
        <div className="flex gap-2">
          {[7, 30, 90].map(days => (
            <Button
              key={days}
              variant={selectedPeriod === days ? 'default' : 'outline'}
              onClick={() => setSelectedPeriod(days)}
              size="sm"
            >
              {days} days
            </Button>
          ))}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalCost.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Last {selectedPeriod} days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Cost Saved</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">${totalSavings.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Via caching</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Cache Hit Rate</CardTitle>
            <Target className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgCacheHitRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">Average across pairs</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{alerts.filter(a => !a.resolved).length}</div>
            <p className="text-xs text-muted-foreground">Require attention</p>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Cost Trend */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Cost Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="cost" stroke="#8884d8" name="Cost ($)" />
              <Line type="monotone" dataKey="cacheHitRate" stroke="#82ca9d" name="Cache Hit Rate (%)" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Cost by Language Pair */}
      <Card>
        <CardHeader>
          <CardTitle>Cost by Language Pair</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(metrics).map(([pair, data]) => (
              <div key={pair} className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <div className="font-semibold">{pair}</div>
                  <div className="text-sm text-muted-foreground">
                    {data.totalRequests} requests • {data.cacheHitRate.toFixed(1)}% cache hit rate
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold">${data.totalCost.toFixed(2)}</div>
                  <div className="text-sm text-green-600">Saved: ${data.costSaved.toFixed(2)}</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Cost Alerts */}
      {alerts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Cost Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {alerts.slice(0, 5).map(alert => (
                <Alert key={alert.id} variant={alert.resolved ? 'default' : 'destructive'}>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription className="flex items-center justify-between">
                    <div>
                      <strong>{alert.alertType.replace(/_/g, ' ')}</strong>
                      <div className="text-sm">
                        ${alert.currentAmount.toFixed(2)} / ${alert.thresholdAmount.toFixed(2)} threshold
                        {alert.languagePair && ` • ${alert.languagePair}`}
                      </div>
                    </div>
                    {!alert.resolved && (
                      <Button size="sm" onClick={() => handleResolveAlert(alert.id)}>
                        Resolve
                      </Button>
                    )}
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cache Optimization Recommendations */}
      {recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Cache Optimization Recommendations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recommendations.map(rec => (
                <div key={rec.id} className="p-4 border rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge>{rec.languagePair}</Badge>
                        <Badge variant="outline">
                          {rec.currentTtlHours}h → {rec.recommendedTtlHours}h TTL
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{rec.reason}</p>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-green-600 font-semibold">
                          Potential savings: ${rec.potentialSavings.toFixed(2)}/month
                        </span>
                        <span>Confidence: {(rec.confidenceScore * 100).toFixed(0)}%</span>
                      </div>
                    </div>
                    <Button size="sm" onClick={() => handleApplyRecommendation(rec.id)}>
                      Apply
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
