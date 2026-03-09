import { useState, useEffect } from 'react';
import { Bell, BellOff, Settings, History, Check, X } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { pushNotificationService } from '@/services/pushNotificationService';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export default function PushNotificationManager() {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [preferences, setPreferences] = useState({
    storage_alerts: true,
    critical_alerts: true,
    upload_alerts: false,
    access_alerts: false,
    daily_summary: true
  });
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkSubscription();
    loadPreferences();
    loadHistory();
  }, []);

  const checkSubscription = async () => {
    const subscribed = await pushNotificationService.isSubscribed();
    setIsSubscribed(subscribed);
    setPermission(Notification.permission);
  };

  const loadPreferences = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (data) setPreferences(data);
  };

  const loadHistory = async () => {
    const { data } = await supabase
      .from('notification_history')
      .select('*')
      .order('sent_at', { ascending: false })
      .limit(20);

    if (data) setHistory(data);
  };

  const handleSubscribe = async () => {
    setLoading(true);
    try {
      await pushNotificationService.subscribe();
      setIsSubscribed(true);
      toast.success('Push notifications enabled!');
    } catch (error) {
      toast.error('Failed to enable notifications');
    } finally {
      setLoading(false);
    }
  };

  const handleUnsubscribe = async () => {
    setLoading(true);
    try {
      await pushNotificationService.unsubscribe();
      setIsSubscribed(false);
      toast.success('Push notifications disabled');
    } catch (error) {
      toast.error('Failed to disable notifications');
    } finally {
      setLoading(false);
    }
  };

  const updatePreferences = async (key: string, value: boolean) => {
    const newPrefs = { ...preferences, [key]: value };
    setPreferences(newPrefs);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from('notification_preferences')
      .upsert({ user_id: user.id, ...newPrefs });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Push Notifications
        </CardTitle>
        <CardDescription>
          Manage browser notifications for storage alerts
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="settings">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="settings">Settings</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          <TabsContent value="settings" className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <h3 className="font-medium">Push Notifications</h3>
                <p className="text-sm text-muted-foreground">
                  {permission === 'granted' ? 'Enabled' : permission === 'denied' ? 'Blocked' : 'Not enabled'}
                </p>
              </div>
              {isSubscribed ? (
                <Button variant="outline" onClick={handleUnsubscribe} disabled={loading}>
                  <BellOff className="h-4 w-4 mr-2" />
                  Disable
                </Button>
              ) : (
                <Button onClick={handleSubscribe} disabled={loading || permission === 'denied'}>
                  <Bell className="h-4 w-4 mr-2" />
                  Enable
                </Button>
              )}
            </div>

            {isSubscribed && (
              <div className="space-y-4">
                <h3 className="font-medium flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Notification Preferences
                </h3>
                
                {[
                  { key: 'critical_alerts', label: 'Critical Storage Alerts', desc: 'Immediate alerts for critical issues' },
                  { key: 'storage_alerts', label: 'Storage Warnings', desc: 'Alerts when buckets reach 80% capacity' },
                  { key: 'upload_alerts', label: 'Upload Activity', desc: 'Notifications for unusual upload patterns' },
                  { key: 'access_alerts', label: 'Access Alerts', desc: 'Alerts for stale files (6+ months)' },
                  { key: 'daily_summary', label: 'Daily Summary', desc: 'Daily storage usage summary' }
                ].map(({ key, label, desc }) => (
                  <div key={key} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <Label htmlFor={key}>{label}</Label>
                      <p className="text-sm text-muted-foreground">{desc}</p>
                    </div>
                    <Switch
                      id={key}
                      checked={preferences[key as keyof typeof preferences]}
                      onCheckedChange={(checked) => updatePreferences(key, checked)}
                    />
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="history" className="space-y-2">
            {history.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No notifications yet</p>
            ) : (
              history.map((notif) => (
                <div key={notif.id} className="p-3 border rounded-lg space-y-1">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium">{notif.title}</h4>
                      <p className="text-sm text-muted-foreground">{notif.body}</p>
                    </div>
                    <Badge variant={notif.clicked ? 'default' : 'secondary'}>
                      {notif.clicked ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {new Date(notif.sent_at).toLocaleString()}
                  </p>
                </div>
              ))
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
