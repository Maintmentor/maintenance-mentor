import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import { Mail, Clock, Shield, Bell } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface EmailPreferences {
  id?: string;
  user_email: string;
  immediate_alerts: boolean;
  daily_digest: boolean;
  weekly_digest: boolean;
  critical_only: boolean;
  severity_threshold: 'low' | 'medium' | 'high' | 'critical';
  digest_time: string;
  timezone: string;
}

interface EmailPreferencesManagerProps {
  userEmail: string;
}

export function EmailPreferencesManager({ userEmail }: EmailPreferencesManagerProps) {
  const [preferences, setPreferences] = useState<EmailPreferences>({
    user_email: userEmail,
    immediate_alerts: true,
    daily_digest: true,
    weekly_digest: true,
    critical_only: false,
    severity_threshold: 'medium',
    digest_time: '09:00',
    timezone: 'UTC'
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadPreferences();
  }, [userEmail]);

  const loadPreferences = async () => {
    try {
      const { data, error } = await supabase
        .from('email_preferences')
        .select('*')
        .eq('user_email', userEmail)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setPreferences(data);
      }
    } catch (error) {
      console.error('Failed to load preferences:', error);
      toast({
        title: "Error",
        description: "Failed to load email preferences",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const savePreferences = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('email_preferences')
        .upsert({
          ...preferences,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Email preferences saved successfully"
      });
    } catch (error) {
      console.error('Failed to save preferences:', error);
      toast({
        title: "Error",
        description: "Failed to save email preferences",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const updatePreference = (key: keyof EmailPreferences, value: any) => {
    setPreferences(prev => ({ ...prev, [key]: value }));
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="h-8 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Email Notification Preferences
          </CardTitle>
          <CardDescription>
            Configure how you receive security alerts and reports
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Immediate Alerts */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium flex items-center gap-2">
              <Bell className="w-4 h-4" />
              Immediate Alerts
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="immediate-alerts">Security Alert Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Get notified immediately when vulnerabilities are detected
                  </p>
                </div>
                <Switch
                  id="immediate-alerts"
                  checked={preferences.immediate_alerts}
                  onCheckedChange={(checked) => updatePreference('immediate_alerts', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="critical-only">Critical Issues Only</Label>
                  <p className="text-sm text-muted-foreground">
                    Only receive alerts for critical security issues
                  </p>
                </div>
                <Switch
                  id="critical-only"
                  checked={preferences.critical_only}
                  onCheckedChange={(checked) => updatePreference('critical_only', checked)}
                />
              </div>

              <div className="space-y-2">
                <Label>Minimum Severity Level</Label>
                <Select
                  value={preferences.severity_threshold}
                  onValueChange={(value) => updatePreference('severity_threshold', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  Only receive alerts for issues at or above this severity level
                </p>
              </div>
            </div>
          </div>

          {/* Digest Reports */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Digest Reports
            </h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="daily-digest">Daily Security Digest</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive a daily summary of security activities
                  </p>
                </div>
                <Switch
                  id="daily-digest"
                  checked={preferences.daily_digest}
                  onCheckedChange={(checked) => updatePreference('daily_digest', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="weekly-digest">Weekly Security Report</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive a comprehensive weekly security report
                  </p>
                </div>
                <Switch
                  id="weekly-digest"
                  checked={preferences.weekly_digest}
                  onCheckedChange={(checked) => updatePreference('weekly_digest', checked)}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Digest Time</Label>
                  <Input
                    type="time"
                    value={preferences.digest_time}
                    onChange={(e) => updatePreference('digest_time', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Timezone</Label>
                  <Select
                    value={preferences.timezone}
                    onValueChange={(value) => updatePreference('timezone', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UTC">UTC</SelectItem>
                      <SelectItem value="America/New_York">Eastern Time</SelectItem>
                      <SelectItem value="America/Chicago">Central Time</SelectItem>
                      <SelectItem value="America/Denver">Mountain Time</SelectItem>
                      <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                      <SelectItem value="Europe/London">London</SelectItem>
                      <SelectItem value="Europe/Paris">Paris</SelectItem>
                      <SelectItem value="Asia/Tokyo">Tokyo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={savePreferences} disabled={saving}>
              {saving ? 'Saving...' : 'Save Preferences'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default EmailPreferencesManager;