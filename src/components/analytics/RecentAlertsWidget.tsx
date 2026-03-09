import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { imageQualityAlertService, ImageQualityAlert } from '@/services/imageQualityAlertService';
import { useAuth } from '@/contexts/AuthContext';
import { AlertTriangle, CheckCircle, Loader2, RefreshCw, Bell } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export function RecentAlertsWidget() {
  const [alerts, setAlerts] = useState<ImageQualityAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    loadAlerts();
  }, []);

  const loadAlerts = async () => {
    try {
      const data = await imageQualityAlertService.getRecentAlerts(5);
      setAlerts(data);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load alerts',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAcknowledge = async (alertId: string) => {
    if (!user) return;
    
    try {
      await imageQualityAlertService.acknowledgeAlert(alertId, user.id);
      toast({
        title: 'Success',
        description: 'Alert acknowledged'
      });
      loadAlerts();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to acknowledge alert',
        variant: 'destructive'
      });
    }
  };

  const handleCheckNow = async () => {
    setChecking(true);
    try {
      const result = await imageQualityAlertService.triggerAlertCheck();
      toast({
        title: 'Alert Check Complete',
        description: `${result.alerts_triggered} alert(s) triggered`
      });
      loadAlerts();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to check alerts',
        variant: 'destructive'
      });
    } finally {
      setChecking(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Recent Alerts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center p-4">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Recent Alerts
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={handleCheckNow}
            disabled={checking}
          >
            {checking ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {alerts.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <CheckCircle className="h-12 w-12 mx-auto mb-2 text-green-500" />
            <p>No recent alerts</p>
          </div>
        ) : (
          <div className="space-y-3">
            {alerts.map(alert => (
              <div
                key={alert.id}
                className={`p-3 rounded-lg border ${
                  alert.acknowledged ? 'bg-muted/50' : 'bg-background'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <AlertTriangle
                        className={`h-4 w-4 ${
                          alert.severity === 'critical' ? 'text-red-500' : 'text-yellow-500'
                        }`}
                      />
                      <span className="font-medium text-sm">{alert.title}</span>
                      <Badge
                        variant={alert.severity === 'critical' ? 'destructive' : 'secondary'}
                        className="text-xs"
                      >
                        {alert.severity}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{alert.message}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(alert.triggered_at), { addSuffix: true })}
                    </p>
                  </div>
                  {!alert.acknowledged && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleAcknowledge(alert.id)}
                    >
                      <CheckCircle className="h-4 w-4" />
                    </Button>
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
