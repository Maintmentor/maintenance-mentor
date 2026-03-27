import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { 
  Activity, AlertTriangle, Upload, HardDrive, 
  TrendingUp, Clock, Zap, Bell, BellRing 
} from 'lucide-react';
import { 
  realtimeStorageService, 
  StorageEvent, 
  UploadProgress, 
  CriticalAlert 
} from '@/services/realtimeStorageService';
import { pushNotificationService } from '@/services/pushNotificationService';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';
import PushNotificationManager from '@/components/notifications/PushNotificationManager';

export function RealtimeStorageDashboard() {
  const [liveMetrics, setLiveMetrics] = useState<any>(null);
  const [recentEvents, setRecentEvents] = useState<StorageEvent[]>([]);
  const [activeUploads, setActiveUploads] = useState<UploadProgress[]>([]);
  const [criticalAlerts, setCriticalAlerts] = useState<CriticalAlert[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Subscribe to real-time metrics
    const metricsChannel = realtimeStorageService.subscribeToMetrics((payload) => {
      if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
        setLiveMetrics(payload.new);
      }
    });

    // Subscribe to storage events
    const eventsChannel = realtimeStorageService.subscribeToStorageEvents((event) => {
      setRecentEvents(prev => [event, ...prev].slice(0, 20));
      
      // Show toast for important events
      if (event.event_type === 'upload') {
        toast.success(`New file uploaded: ${event.file_path}`);
      }
    });

    // Subscribe to critical alerts
    const alertsChannel = realtimeStorageService.subscribeToAlerts((alert) => {
      setCriticalAlerts(prev => [alert, ...prev].slice(0, 10));
      
      // Show notification for critical alerts
      if (alert.severity === 'critical') {
        toast.error(alert.message, {
          duration: 10000,
          action: {
            label: 'View',
            onClick: () => console.log('View alert:', alert)
          }
        });
        
        // Browser notification if permitted
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('Critical Storage Alert', {
            body: alert.message,
            icon: '/icon-192.png'
          });
        }
      }
    });

    // Load initial live stats
    realtimeStorageService.getLiveStats().then(setLiveMetrics);
    
    setIsConnected(true);

    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    return () => {
      realtimeStorageService.unsubscribeAll();
      setIsConnected(false);
    };
  }, []);

  // Handle file upload with progress tracking
  const handleFileUpload = async (file: File, bucketName: string) => {
    const uploadId = `${Date.now()}-${file.name}`;
    
    realtimeStorageService.trackUpload(
      file,
      bucketName,
      (progress) => {
        setActiveUploads(prev => {
          const existing = prev.findIndex(u => u.file_id === progress.file_id);
          if (existing >= 0) {
            const updated = [...prev];
            updated[existing] = progress;
            return updated;
          }
          return [...prev, progress];
        });

        // Remove completed uploads after 5 seconds
        if (progress.status === 'completed') {
          setTimeout(() => {
            setActiveUploads(prev => prev.filter(u => u.file_id !== progress.file_id));
          }, 5000);
        }
      }
    );
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      default: return 'bg-blue-500';
    }
  };

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Real-time Storage Monitor</h2>
        <Badge variant={isConnected ? 'default' : 'secondary'}>
          <Zap className="w-3 h-3 mr-1" />
          {isConnected ? 'Live' : 'Disconnected'}
        </Badge>
      </div>

      {/* Push Notification Manager */}
      <PushNotificationManager />


      {/* Critical Alerts */}
      {criticalAlerts.length > 0 && (
        <Card className="border-red-500">
          <CardHeader>
            <CardTitle className="flex items-center text-red-600">
              <AlertTriangle className="w-5 h-5 mr-2" />
              Critical Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-32">
              {criticalAlerts.map((alert) => (
                <Alert key={alert.id} className="mb-2">
                  <AlertDescription className="flex items-center justify-between">
                    <span>{alert.message}</span>
                    <Badge className={getSeverityColor(alert.severity)}>
                      {alert.severity}
                    </Badge>
                  </AlertDescription>
                </Alert>
              ))}
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Live Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center">
              <HardDrive className="w-4 h-4 mr-2" />
              Total Storage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {liveMetrics ? formatBytes(liveMetrics.total_size || 0) : '-'}
            </div>
            <Progress 
              value={liveMetrics?.usage_percentage || 0} 
              className="mt-2"
            />
            <p className="text-xs text-muted-foreground mt-1">
              {liveMetrics?.usage_percentage?.toFixed(1) || 0}% used
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center">
              <Activity className="w-4 h-4 mr-2" />
              Active Uploads
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeUploads.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {activeUploads.filter(u => u.status === 'uploading').length} in progress
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center">
              <Clock className="w-4 h-4 mr-2" />
              Recent Events
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{recentEvents.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Last 24 hours
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center">
              <TrendingUp className="w-4 h-4 mr-2" />
              Upload Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {liveMetrics?.upload_rate || 0}/min
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Average today
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Active Uploads */}
      {activeUploads.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Upload className="w-5 h-5 mr-2" />
              Active Uploads
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {activeUploads.map((upload) => (
                <div key={upload.file_id} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium truncate">{upload.file_name}</span>
                    <span className="text-muted-foreground">
                      {upload.progress.toFixed(0)}%
                    </span>
                  </div>
                  <Progress value={upload.progress} />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{formatBytes(upload.uploaded_size)} / {formatBytes(upload.total_size)}</span>
                    <Badge variant={
                      upload.status === 'completed' ? 'default' : 
                      upload.status === 'failed' ? 'destructive' : 'secondary'
                    }>
                      {upload.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Events */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Bell className="w-5 h-5 mr-2" />
            Recent Storage Events
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-64">
            {recentEvents.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                No recent events
              </p>
            ) : (
              <div className="space-y-2">
                {recentEvents.map((event) => (
                  <div key={event.id} className="flex items-center justify-between p-2 rounded hover:bg-muted">
                    <div className="flex items-center space-x-3">
                      <Badge variant="outline">{event.event_type}</Badge>
                      <span className="text-sm">{event.file_path}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                      <span>{formatBytes(event.file_size)}</span>
                      <span>•</span>
                      <span>{formatDistanceToNow(new Date(event.timestamp))} ago</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}