import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { AlertTriangle, TrendingUp, HardDrive, Mail, RefreshCw, CheckCircle } from 'lucide-react';
import { storageMonitoringService } from '@/services/storageMonitoringService';
import { storageService } from '@/services/storageService';
import { useToast } from '@/hooks/use-toast';

export function StorageMonitoringDashboard() {
  const [metrics, setMetrics] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [predictions, setPredictions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBucket, setSelectedBucket] = useState<string>('all');
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, [selectedBucket]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [metricsData, alertsData, predictionsData] = await Promise.all([
        storageMonitoringService.getStorageMetrics(selectedBucket === 'all' ? undefined : selectedBucket),
        storageMonitoringService.getStorageAlerts(false),
        storageMonitoringService.getStoragePredictions(selectedBucket === 'all' ? undefined : selectedBucket)
      ]);
      setMetrics(metricsData || []);
      setAlerts(alertsData || []);
      setPredictions(predictionsData || []);
    } catch (error) {
      console.error('Error loading monitoring data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load monitoring data',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const runMonitor = async () => {
    try {
      await storageMonitoringService.triggerStorageMonitor();
      toast({ title: 'Success', description: 'Storage monitor executed successfully' });
      loadData();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to run monitor', variant: 'destructive' });
    }
  };

  const sendNotifications = async () => {
    try {
      const result = await storageMonitoringService.triggerAlertNotifications();
      toast({ title: 'Success', description: `Sent ${result.alertsNotified} notifications` });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to send notifications', variant: 'destructive' });
    }
  };

  const resolveAlert = async (alertId: string) => {
    try {
      await storageMonitoringService.resolveAlert(alertId);
      toast({ title: 'Success', description: 'Alert resolved' });
      loadData();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to resolve alert', variant: 'destructive' });
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'outline';
    }
  };

  const chartData = metrics.slice(0, 30).reverse().map(m => ({
    date: new Date(m.created_at).toLocaleDateString(),
    size: m.total_size / (1024 * 1024 * 1024),
    files: m.file_count,
    capacity: m.capacity_percentage
  }));

  const predictionData = predictions.map(p => ({
    date: new Date(p.prediction_date).toLocaleDateString(),
    predicted: p.predicted_size / (1024 * 1024 * 1024),
    confidence: p.confidence_score * 100
  }));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Storage Monitoring</h2>
        <div className="flex gap-2">
          <Button onClick={runMonitor} size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Run Monitor
          </Button>
          <Button onClick={sendNotifications} variant="outline" size="sm">
            <Mail className="h-4 w-4 mr-2" />
            Send Notifications
          </Button>
        </div>
      </div>

      {/* Active Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.slice(0, 5).map(alert => (
            <Alert key={alert.id} className="flex justify-between items-start">
              <div className="flex-1">
                <AlertDescription>
                  <div className="flex items-center gap-2 mb-1">
                    <AlertTriangle className="h-4 w-4" />
                    <strong>{alert.title}</strong>
                    <Badge variant={getSeverityColor(alert.severity)}>
                      {alert.severity}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{alert.message}</p>
                </AlertDescription>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => resolveAlert(alert.id)}
              >
                <CheckCircle className="h-4 w-4" />
              </Button>
            </Alert>
          ))}
        </div>
      )}

      <Tabs defaultValue="trends" className="space-y-4">
        <TabsList>
          <TabsTrigger value="trends">Storage Trends</TabsTrigger>
          <TabsTrigger value="predictions">Predictions</TabsTrigger>
          <TabsTrigger value="alerts">Alert History</TabsTrigger>
        </TabsList>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Storage Usage Over Time</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Area type="monotone" dataKey="size" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} name="Size (GB)" />
                  <Line type="monotone" dataKey="capacity" stroke="#ef4444" name="Capacity %" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>File Count Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="files" stroke="#10b981" name="File Count" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="predictions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>30-Day Storage Predictions</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={predictionData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Area type="monotone" dataKey="predicted" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.6} name="Predicted Size (GB)" />
                  <Line type="monotone" dataKey="confidence" stroke="#f59e0b" name="Confidence %" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <div className="space-y-2">
            {alerts.map(alert => (
              <Card key={alert.id}>
                <CardContent className="pt-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant={getSeverityColor(alert.severity)}>
                          {alert.severity}
                        </Badge>
                        <Badge variant="outline">{alert.alert_type}</Badge>
                        {alert.notification_sent && (
                          <Badge variant="secondary">Notified</Badge>
                        )}
                      </div>
                      <h4 className="font-semibold">{alert.title}</h4>
                      <p className="text-sm text-muted-foreground mt-1">{alert.message}</p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {new Date(alert.created_at).toLocaleString()}
                      </p>
                    </div>
                    {!alert.resolved && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => resolveAlert(alert.id)}
                      >
                        Resolve
                      </Button>
                    )}
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