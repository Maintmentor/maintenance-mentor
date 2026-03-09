import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { Mail, CheckCircle, XCircle, Clock, RefreshCw } from 'lucide-react';

export function AlertExecutionLogs() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('alert_execution_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setLogs(data || []);
    } catch (error) {
      console.error('Failed to load logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: any = {
      success: 'default',
      failed: 'destructive',
      pending: 'secondary'
    };
    return <Badge variant={variants[status] || 'outline'}>{status}</Badge>;
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Alert Execution Logs
        </CardTitle>
        <Button onClick={loadLogs} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">Loading logs...</div>
        ) : logs.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">No execution logs found</div>
        ) : (
          <div className="space-y-4">
            {logs.map((log) => (
              <div key={log.id} className="border rounded-lg p-4 hover:bg-accent/50 transition-colors">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(log.status)}
                    <span className="font-medium">{log.alert_type}</span>
                  </div>
                  {getStatusBadge(log.status)}
                </div>
                
                <div className="text-sm text-muted-foreground space-y-1">
                  <div>
                    <strong>Executed:</strong> {new Date(log.created_at).toLocaleString()}
                  </div>
                  {log.execution_time && (
                    <div>
                      <strong>Duration:</strong> {log.execution_time}ms
                    </div>
                  )}
                  {log.error_message && (
                    <div className="text-red-500">
                      <strong>Error:</strong> {log.error_message}
                    </div>
                  )}
                  {log.metadata && (
                    <div className="mt-2 p-2 bg-muted rounded text-xs font-mono">
                      {JSON.stringify(log.metadata, null, 2)}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
