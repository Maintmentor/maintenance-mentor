import React, { useState, useEffect } from 'react';
import { Bell, Mail, Smartphone, Clock, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

interface NotificationPreferences {
  in_app_enabled: boolean;
  email_enabled: boolean;
  push_enabled: boolean;
  maintenance_alerts: boolean;
  repair_alerts: boolean;
  parts_alerts: boolean;
  email_report_alerts: boolean;
  system_alerts: boolean;
  quiet_hours_start: string;
  quiet_hours_end: string;
}

export default function NotificationPreferences() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    in_app_enabled: true,
    email_enabled: true,
    push_enabled: false,
    maintenance_alerts: true,
    repair_alerts: true,
    parts_alerts: true,
    email_report_alerts: true,
    system_alerts: true,
    quiet_hours_start: '22:00',
    quiet_hours_end: '08:00'
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      fetchPreferences();
    }
  }, [user]);

  const fetchPreferences = async () => {
    try {
      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        setPreferences(data);
      }
    } catch (error) {
      console.error('Error fetching preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const savePreferences = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('notification_preferences')
        .upsert({
          user_id: user?.id,
          ...preferences,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      toast({
        title: "Preferences saved",
        description: "Your notification preferences have been updated successfully."
      });
    } catch (error) {
      console.error('Error saving preferences:', error);
      toast({
        title: "Error",
        description: "Failed to save notification preferences. Please try again.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const updatePreference = (key: keyof NotificationPreferences, value: boolean | string) => {
    setPreferences(prev => ({ ...prev, [key]: value }));
  };

  if (loading) {
    return <div className="p-6 text-center">Loading preferences...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notification Preferences
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Delivery Methods */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Delivery Methods</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Bell className="h-5 w-5 text-blue-500" />
                  <div>
                    <Label className="text-sm font-medium">In-App Notifications</Label>
                    <p className="text-sm text-gray-600">Show notifications in the app</p>
                  </div>
                </div>
                <Switch
                  checked={preferences.in_app_enabled}
                  onCheckedChange={(checked) => updatePreference('in_app_enabled', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-green-500" />
                  <div>
                    <Label className="text-sm font-medium">Email Notifications</Label>
                    <p className="text-sm text-gray-600">Send notifications via email</p>
                  </div>
                </div>
                <Switch
                  checked={preferences.email_enabled}
                  onCheckedChange={(checked) => updatePreference('email_enabled', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Smartphone className="h-5 w-5 text-purple-500" />
                  <div>
                    <Label className="text-sm font-medium">Push Notifications</Label>
                    <p className="text-sm text-gray-600">Browser push notifications</p>
                  </div>
                </div>
                <Switch
                  checked={preferences.push_enabled}
                  onCheckedChange={(checked) => updatePreference('push_enabled', checked)}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Notification Types */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Notification Types</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Maintenance Reminders</Label>
                <Switch
                  checked={preferences.maintenance_alerts}
                  onCheckedChange={(checked) => updatePreference('maintenance_alerts', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Repair Updates</Label>
                <Switch
                  checked={preferences.repair_alerts}
                  onCheckedChange={(checked) => updatePreference('repair_alerts', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Parts & Inventory</Label>
                <Switch
                  checked={preferences.parts_alerts}
                  onCheckedChange={(checked) => updatePreference('parts_alerts', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Email Reports</Label>
                <Switch
                  checked={preferences.email_report_alerts}
                  onCheckedChange={(checked) => updatePreference('email_report_alerts', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">System Updates</Label>
                <Switch
                  checked={preferences.system_alerts}
                  onCheckedChange={(checked) => updatePreference('system_alerts', checked)}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Quiet Hours */}
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Quiet Hours
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Set hours when you don't want to receive notifications
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium">Start Time</Label>
                <Input
                  type="time"
                  value={preferences.quiet_hours_start}
                  onChange={(e) => updatePreference('quiet_hours_start', e.target.value)}
                />
              </div>
              <div>
                <Label className="text-sm font-medium">End Time</Label>
                <Input
                  type="time"
                  value={preferences.quiet_hours_end}
                  onChange={(e) => updatePreference('quiet_hours_end', e.target.value)}
                />
              </div>
            </div>
          </div>

          <div className="pt-4">
            <Button onClick={savePreferences} disabled={saving} className="w-full">
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Saving...' : 'Save Preferences'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}