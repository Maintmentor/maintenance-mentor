import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle, Clock, RefreshCw } from 'lucide-react';

interface Alert {
  id: string;
  function_name: string;
  severity: 'critical' | 'warning' | 'info';
  message: string;
  details: any;
  resolved: boolean;
  created_at: string;
  resolved_at: string | null;
}

export default function AlertHistoryViewer() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unresolved'>('unresolved');

  useEffect(() => {
    loadAlerts();
  }, [filter]);

  const loadAlerts = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('health_check_alerts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (filter === 'unresolved') {
        query = query.eq('resolved', false);
      }

      const { data, error } = await query;
      if (error) throw error;
      setAlerts(data || []);
    } catch (error) {
      console.error('Failed to load alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const resolveAlert = async (id: string) => {
    try {
      const { error } = await supabase
        .from('health_check_alerts')
        .update({ resolved: true, resolved_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
      loadAlerts();
    } catch (error) {
      console.error('Failed to resolve alert:', error);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500';
      case 'warning': return 'bg-yellow-500';
      case 'info': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <Button
            variant={filter === 'unresolved' ? 'default' : 'outline'}
            onClick={() => setFilter('unresolved')}
          >
            Unresolved
          </Button>
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            onClick={() => setFilter('all')}
          >
            All Alerts
          </Button>
        </div>
        <Button variant="outline" onClick={loadAlerts}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-8">Loading alerts...</div>
      ) : alerts.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No alerts found
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {alerts.map((alert) => (
            <Card key={alert.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="flex items-center gap-2">
                      <AlertCircle className="h-5 w-5" />
                      {alert.function_name}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-2">
                      <Clock className="h-3 w-3" />
                      {new Date(alert.created_at).toLocaleString()}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getSeverityColor(alert.severity)}>
                      {alert.severity}
                    </Badge>
                    {alert.resolved && (
                      <Badge variant="outline" className="bg-green-50">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Resolved
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm">{alert.message}</p>
                {alert.details && (
                  <details className="text-xs">
                    <summary className="cursor-pointer font-medium">
                      View Details
                    </summary>
                    <pre className="mt-2 p-2 bg-muted rounded overflow-auto">
                      {JSON.stringify(alert.details, null, 2)}
                    </pre>
                  </details>
                )}
                {!alert.resolved && (
                  <Button
                    size="sm"
                    onClick={() => resolveAlert(alert.id)}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Mark as Resolved
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
