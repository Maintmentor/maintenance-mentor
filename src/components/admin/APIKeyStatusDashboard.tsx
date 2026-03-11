import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { apiKeyValidator, KeyStatus, KeyAlert } from '@/utils/apiKeyValidator';
import { RefreshCw, CheckCircle, XCircle, AlertTriangle, Clock, Mail, Send, MessageSquare } from 'lucide-react';

import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export function APIKeyStatusDashboard() {
  const [keyStatuses, setKeyStatuses] = useState<KeyStatus[]>([]);
  const [alerts, setAlerts] = useState<KeyAlert[]>([]);
  const [validating, setValidating] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [sendingSlack, setSendingSlack] = useState(false);
  const [loading, setLoading] = useState(true);



  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [statuses, alertsData] = await Promise.all([
      apiKeyValidator.getKeyStatus(),
      apiKeyValidator.getAlerts()
    ]);
    setKeyStatuses(statuses);
    setAlerts(alertsData);
    setLoading(false);
  };

  const handleValidateAll = async () => {
    setValidating(true);
    await apiKeyValidator.validateAllKeys();
    await loadData();
    setValidating(false);
  };

  const handleValidateSingle = async (keyName: string) => {
    setValidating(true);
    await apiKeyValidator.validateSingleKey(keyName);
    await loadData();
    setValidating(false);
  };

  const handleResolveAlert = async (alertId: string) => {
    await apiKeyValidator.resolveAlert(alertId);
    await loadData();
  };

  const handleSendEmailAlerts = async () => {
    setSendingEmail(true);
    try {
      const { data, error } = await supabase.functions.invoke('api-key-email-alerts', {
        body: {}
      });

      if (error) throw error;

      toast.success(`Email alerts sent to ${data.emailsSent?.length || 0} admins`);
    } catch (error) {
      console.error('Error sending email alerts:', error);
      toast.error('Failed to send email alerts');
    } finally {
      setSendingEmail(false);
    }
  };

  const handleSendSlackAlerts = async () => {
    setSendingSlack(true);
    try {
      // Send Slack alerts for all active alerts
      const slackPromises = alerts.map(async (alert) => {
        const status = keyStatuses.find(s => s.key_name === alert.key_name);
        if (!status) return;

        return supabase.functions.invoke('slack-alert-sender', {
          body: {
            keyName: alert.key_name,
            alertType: alert.severity,
            healthScore: status.health_score,
            errorMessage: status.last_error,
            lastValidated: status.last_validated_at,
            expiresAt: status.expires_at
          }
        });
      });

      const results = await Promise.all(slackPromises);
      const successCount = results.filter(r => r.data?.success).length;

      toast.success(`Slack alerts sent to ${successCount} channel(s)`);
    } catch (error) {
      console.error('Error sending Slack alerts:', error);
      toast.error('Failed to send Slack alerts');
    } finally {
      setSendingSlack(false);
    }
  };



  const getHealthColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'warning': return 'default';
      default: return 'secondary';
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center p-8">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-3xl font-bold">API Key Health Monitor</h2>
          <p className="text-muted-foreground">Real-time validation and monitoring</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button 
            variant="outline" 
            onClick={handleSendSlackAlerts} 
            disabled={sendingSlack || alerts.length === 0}
          >
            <MessageSquare className={`w-4 h-4 mr-2 ${sendingSlack ? 'animate-pulse' : ''}`} />
            Send Slack Alerts
          </Button>
          <Button 
            variant="outline" 
            onClick={handleSendEmailAlerts} 
            disabled={sendingEmail || alerts.length === 0}
          >
            <Mail className={`w-4 h-4 mr-2 ${sendingEmail ? 'animate-pulse' : ''}`} />
            Send Email Alerts
          </Button>
          <Button onClick={handleValidateAll} disabled={validating}>
            <RefreshCw className={`w-4 h-4 mr-2 ${validating ? 'animate-spin' : ''}`} />
            Validate All Keys
          </Button>
        </div>

      </div>


      {alerts.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="flex items-center text-red-700">
              <AlertTriangle className="w-5 h-5 mr-2" />
              Active Alerts ({alerts.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {alerts.map((alert) => (
              <Alert key={alert.id} variant="destructive">
                <AlertDescription className="flex items-center justify-between">
                  <div>
                    <strong>{alert.key_name}</strong>: {alert.message}
                    <div className="text-xs mt-1">
                      {new Date(alert.created_at).toLocaleString()}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleResolveAlert(alert.id)}
                  >
                    Resolve
                  </Button>
                </AlertDescription>
              </Alert>
            ))}
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {keyStatuses.map((status) => (
          <Card key={status.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{status.key_name}</CardTitle>
                {status.is_valid ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-600" />
                )}
              </div>
              <CardDescription>{status.key_type.toUpperCase()}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Health Score</span>
                <span className={`text-2xl font-bold ${getHealthColor(status.health_score)}`}>
                  {status.health_score}%
                </span>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status</span>
                  <Badge variant={status.is_valid ? 'default' : 'destructive'}>
                    {status.is_valid ? 'Valid' : 'Invalid'}
                  </Badge>
                </div>

                <div className="flex justify-between">
                  <span className="text-muted-foreground">Validations</span>
                  <span>{status.validation_count}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-muted-foreground">Failures</span>
                  <span className="text-red-600">{status.consecutive_failures}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Last Check</span>
                  <span className="text-xs">
                    {new Date(status.last_validated_at).toLocaleString()}
                  </span>
                </div>

                {status.expires_at && (
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Expires</span>
                    <Badge variant={status.days_until_expiration! < 7 ? 'destructive' : 'secondary'}>
                      <Clock className="w-3 h-3 mr-1" />
                      {status.days_until_expiration} days
                    </Badge>
                  </div>
                )}

                {status.last_error && (
                  <div className="pt-2 border-t">
                    <p className="text-xs text-red-600">{status.last_error}</p>
                  </div>
                )}
              </div>

              <Button
                size="sm"
                variant="outline"
                className="w-full"
                onClick={() => handleValidateSingle(status.key_name)}
                disabled={validating}
              >
                <RefreshCw className={`w-3 h-3 mr-2 ${validating ? 'animate-spin' : ''}`} />
                Validate Now
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {keyStatuses.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No API keys have been validated yet. Click "Validate All Keys" to start monitoring.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
