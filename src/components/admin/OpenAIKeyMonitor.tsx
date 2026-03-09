import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import { AlertCircle, CheckCircle, RefreshCw, DollarSign, Clock } from 'lucide-react';

export default function OpenAIKeyMonitor() {
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [alerts, setAlerts] = useState<any[]>([]);

  const checkKey = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('openai-key-validator');
      
      if (error) throw error;
      
      setStatus(data);
      
      // Save to database
      await supabase.from('openai_key_status').insert({
        is_valid: data.valid,
        error_message: data.error,
        quota_used: data.quota?.used,
        quota_limit: data.quota?.limit,
        quota_remaining: data.quota?.remaining,
        last_successful_call: data.valid ? new Date().toISOString() : null
      });
      
      // Check if alert needed
      if (data.quota?.remaining < 10 || !data.valid) {
        await sendAlert(data);
      }
    } catch (err: any) {
      console.error('Key check failed:', err);
    } finally {
      setLoading(false);
    }
  };

  const sendAlert = async (data: any) => {
    const alertType = !data.valid ? 'invalid_key' : 'low_quota';
    await supabase.from('openai_quota_alerts').insert({
      alert_type: alertType,
      quota_remaining: data.quota?.remaining,
      recipient_email: 'admin@example.com'
    });
  };

  const loadAlerts = async () => {
    const { data } = await supabase
      .from('openai_quota_alerts')
      .select('*')
      .order('sent_at', { ascending: false })
      .limit(5);
    setAlerts(data || []);
  };

  useEffect(() => {
    checkKey();
    loadAlerts();
    const interval = setInterval(checkKey, 300000); // Check every 5 min
    return () => clearInterval(interval);
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          OpenAI API Status
          <Button onClick={checkKey} disabled={loading} size="sm">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {status && (
          <>
            <div className="flex items-center justify-between">
              <span>Status</span>
              <Badge variant={status.valid ? 'default' : 'destructive'}>
                {status.valid ? <CheckCircle className="h-3 w-3 mr-1" /> : <AlertCircle className="h-3 w-3 mr-1" />}
                {status.valid ? 'Valid' : 'Invalid'}
              </Badge>
            </div>
            
            {status.quota && (
              <>
                <div className="flex items-center justify-between">
                  <span className="flex items-center"><DollarSign className="h-4 w-4 mr-1" />Remaining</span>
                  <span className="font-bold">${status.quota.remaining.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>Used / Limit</span>
                  <span>${status.quota.used.toFixed(2)} / ${status.quota.limit.toFixed(2)}</span>
                </div>
              </>
            )}
            
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="flex items-center"><Clock className="h-3 w-3 mr-1" />Last Check</span>
              <span>{new Date(status.timestamp).toLocaleTimeString()}</span>
            </div>
          </>
        )}
        
        {alerts.length > 0 && (
          <div className="mt-4 pt-4 border-t">
            <h4 className="text-sm font-medium mb-2">Recent Alerts</h4>
            {alerts.map(alert => (
              <div key={alert.id} className="text-xs py-1 flex justify-between">
                <span>{alert.alert_type.replace('_', ' ')}</span>
                <span className="text-muted-foreground">
                  {new Date(alert.sent_at).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
