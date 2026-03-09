import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RefreshCw, CheckCircle, XCircle, AlertTriangle, Activity, Bell, History, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';
import AlertConfigurationManager from './AlertConfigurationManager';
import AlertHistoryViewer from './AlertHistoryViewer';
import SlackNotificationHistory from './SlackNotificationHistory';


interface HealthCheck {
  status: 'healthy' | 'error' | 'warning';
  message?: string;
  statusCode?: number;
}

interface HealthStatus {
  timestamp: string;
  overall: 'healthy' | 'degraded' | 'error';
  checks: {
    openai?: HealthCheck;
    stripe?: HealthCheck;
    resend?: HealthCheck;
    google?: HealthCheck;
  };
}

const EDGE_FUNCTIONS = [
  { name: 'repair-diagnostic', label: 'Repair Diagnostic', critical: true },
  { name: 'generate-repair-image', label: 'Image Generation', critical: true },
  { name: 'fetch-real-part-images', label: 'Part Images', critical: false },
  { name: 'send-verification-email', label: 'Email Verification', critical: true },
  { name: 'stripe-webhook-handler', label: 'Stripe Webhooks', critical: true },
  { name: 'user-role-manager', label: 'User Roles', critical: false },
  { name: 'ml-analytics-processor', label: 'ML Analytics', critical: false },
  { name: 'image-cache-handler', label: 'Image Cache', critical: false }
];

export default function HealthCheckDashboard() {
  const [healthStatus, setHealthStatus] = useState<HealthStatus | null>(null);
  const [functionStatus, setFunctionStatus] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);
  const [lastCheck, setLastCheck] = useState<Date | null>(null);

  const checkHealth = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('health-check', {
        body: { action: 'full' }
      });

      if (error) throw error;
      setHealthStatus(data);
      setLastCheck(new Date());
      
      if (data.overall === 'healthy') {
        toast.success('All systems operational');
      } else if (data.overall === 'degraded') {
        toast.warning('Some services are experiencing issues');
      } else {
        toast.error('Critical systems are down');
      }
    } catch (error) {
      console.error('Health check failed:', error);
      toast.error('Failed to perform health check');
    } finally {
      setLoading(false);
    }
  };

  const testFunction = async (functionName: string) => {
    try {
      const { data, error } = await supabase.functions.invoke(functionName, {
        body: { test: true }
      });

      setFunctionStatus(prev => ({
        ...prev,
        [functionName]: {
          status: error ? 'error' : 'healthy',
          lastChecked: new Date(),
          error: error?.message
        }
      }));

      if (!error) {
        toast.success(`${functionName} is operational`);
      } else {
        toast.error(`${functionName} failed: ${error.message}`);
      }
    } catch (error: any) {
      setFunctionStatus(prev => ({
        ...prev,
        [functionName]: {
          status: 'error',
          lastChecked: new Date(),
          error: error.message
        }
      }));
      toast.error(`${functionName} test failed`);
    }
  };

  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 60000); // Check every minute
    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'warning': return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'error': return <XCircle className="h-5 w-5 text-red-500" />;
      default: return <Activity className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      healthy: 'default',
      warning: 'secondary',
      error: 'destructive'
    };
    return <Badge variant={variants[status] || 'outline'}>{status}</Badge>;
  };

  return (
    <Tabs defaultValue="status" className="space-y-6">
      <TabsList>
        <TabsTrigger value="status">
          <Activity className="h-4 w-4 mr-2" />
          System Status
        </TabsTrigger>
        <TabsTrigger value="alerts">
          <Bell className="h-4 w-4 mr-2" />
          Alert Configuration
        </TabsTrigger>
        <TabsTrigger value="history">
          <History className="h-4 w-4 mr-2" />
          Alert History
        </TabsTrigger>
        <TabsTrigger value="slack">
          <MessageSquare className="h-4 w-4 mr-2" />
          Slack History
        </TabsTrigger>
      </TabsList>


      <TabsContent value="status" className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">System Health Dashboard</h2>
            {lastCheck && (
              <p className="text-sm text-muted-foreground">
                Last checked: {lastCheck.toLocaleTimeString()}
              </p>
            )}
          </div>
          <Button onClick={checkHealth} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Overall Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {healthStatus && getStatusIcon(healthStatus.overall)}
              Overall System Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            {healthStatus ? (
              <div className="space-y-2">
                {getStatusBadge(healthStatus.overall)}
                <p className="text-sm text-muted-foreground">
                  {healthStatus.timestamp && new Date(healthStatus.timestamp).toLocaleString()}
                </p>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Loading...</p>
            )}
          </CardContent>
        </Card>

        {/* Dependencies Status */}
        <Card>
          <CardHeader>
            <CardTitle>External Dependencies</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {healthStatus?.checks && Object.entries(healthStatus.checks).map(([key, check]) => (
                <div key={key} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(check.status)}
                    <div>
                      <p className="font-medium capitalize">{key} API</p>
                      <p className="text-sm text-muted-foreground">{check.message}</p>
                    </div>
                  </div>
                  {getStatusBadge(check.status)}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Edge Functions Status */}
        <Card>
          <CardHeader>
            <CardTitle>Edge Functions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {EDGE_FUNCTIONS.map(func => {
                const status = functionStatus[func.name];
                return (
                  <div key={func.name} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {status && getStatusIcon(status.status)}
                      <div>
                        <p className="font-medium">{func.label}</p>
                        <p className="text-xs text-muted-foreground">
                          {func.name} {func.critical && '(Critical)'}
                        </p>
                        {status?.error && (
                          <p className="text-xs text-red-500">{status.error}</p>
                        )}
                      </div>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => testFunction(func.name)}>
                      Test
                    </Button>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="alerts">
        <AlertConfigurationManager />
      </TabsContent>

      <TabsContent value="history">
        <AlertHistoryViewer />
      </TabsContent>

      <TabsContent value="slack">
        <SlackNotificationHistory />
      </TabsContent>
    </Tabs>
  );
}
