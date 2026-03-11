import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { format } from 'date-fns';

interface SlackNotification {
  id: string;
  alert_type: string;
  key_name: string;
  status: string;
  error_message: string | null;
  sent_at: string;
}

export default function SlackNotificationHistory() {
  const [notifications, setNotifications] = useState<SlackNotification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      const { data, error } = await supabase
        .from('slack_notifications')
        .select('*')
        .order('sent_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setNotifications(data || []);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Slack Notification History</CardTitle>
        <CardDescription>Recent Slack alerts sent by the system</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className="flex items-center justify-between p-4 border rounded-lg"
            >
              <div className="flex items-center gap-4">
                {notification.status === 'sent' ? (
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-500" />
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{notification.key_name}</span>
                    <Badge
                      variant={
                        notification.alert_type === 'critical'
                          ? 'destructive'
                          : notification.alert_type === 'warning'
                          ? 'default'
                          : 'secondary'
                      }
                    >
                      {notification.alert_type}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(notification.sent_at), 'PPpp')}
                  </p>
                  {notification.error_message && (
                    <p className="text-sm text-red-500 mt-1">
                      {notification.error_message}
                    </p>
                  )}
                </div>
              </div>
              <Badge variant={notification.status === 'sent' ? 'default' : 'destructive'}>
                {notification.status}
              </Badge>
            </div>
          ))}
          {notifications.length === 0 && (
            <p className="text-center text-muted-foreground py-8">
              No Slack notifications sent yet
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}