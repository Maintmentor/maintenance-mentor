import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Bell, Mail, Clock, Save, Plus, Trash2, MessageSquare, TestTube } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface AlertConfig {
  id: string;
  email: string;
  enabled: boolean;
  critical_alerts: boolean;
  warning_alerts: boolean;
  info_alerts: boolean;
  daily_summary: boolean;
  summary_time: string;
  slack_enabled: boolean;
  slack_webhook_url: string;
  slack_channel: string;
  slack_username: string;
  slack_icon_emoji: string;
}


export default function AlertConfigurationManager() {
  const [configs, setConfigs] = useState<AlertConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [newEmail, setNewEmail] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    loadConfigs();
  }, []);

  const loadConfigs = async () => {
    try {
      const { data, error } = await supabase
        .from('alert_configurations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setConfigs(data || []);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load alert configurations',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const addConfig = async () => {
    if (!newEmail) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('alert_configurations')
        .insert({
          user_id: user?.id,
          email: newEmail,
          enabled: true,
          critical_alerts: true,
          warning_alerts: true,
          info_alerts: false,
          daily_summary: true,
          summary_time: '09:00'
        });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Alert configuration added'
      });

      setNewEmail('');
      loadConfigs();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to add configuration',
        variant: 'destructive'
      });
    }
  };

  const updateConfig = async (id: string, updates: Partial<AlertConfig>) => {
    try {
      const { error } = await supabase
        .from('alert_configurations')
        .update(updates)
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Configuration updated'
      });

      loadConfigs();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update configuration',
        variant: 'destructive'
      });
    }
  };

  const deleteConfig = async (id: string) => {
    try {
      const { error } = await supabase
        .from('alert_configurations')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Configuration deleted'
      });

      loadConfigs();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete configuration',
        variant: 'destructive'
      });
    }
  };

  const testSlackWebhook = async (config: AlertConfig) => {
    if (!config.slack_webhook_url) {
      toast({
        title: 'Error',
        description: 'Slack webhook URL is required',
        variant: 'destructive'
      });
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('slack-alert-sender', {
        body: {
          webhookUrl: config.slack_webhook_url,
          channel: config.slack_channel || '#alerts',
          severity: 'info',
          title: 'Test Alert',
          message: 'This is a test alert from the Health Check system.',
          functionName: 'Test',
          details: { timestamp: new Date().toISOString() }
        }
      });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Test alert sent to Slack successfully'
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to send test alert to Slack',
        variant: 'destructive'
      });
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading configurations...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Add Alert Recipient
          </CardTitle>
          <CardDescription>
            Add email addresses to receive health check alerts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              type="email"
              placeholder="admin@example.com"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
            />
            <Button onClick={addConfig}>
              <Plus className="h-4 w-4 mr-2" />
              Add
            </Button>
          </div>
        </CardContent>
      </Card>

      {configs.map((config) => (
        <Card key={config.id}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                {config.email}
              </CardTitle>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => deleteConfig(config.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="email" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="email">
                  <Mail className="h-4 w-4 mr-2" />
                  Email Settings
                </TabsTrigger>
                <TabsTrigger value="slack">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Slack Settings
                </TabsTrigger>
              </TabsList>

              <TabsContent value="email" className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Enabled</Label>
                  <Switch
                    checked={config.enabled}
                    onCheckedChange={(checked) =>
                      updateConfig(config.id, { enabled: checked })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">Alert Levels</h4>
                  <div className="space-y-2 pl-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-red-600">Critical Alerts</Label>
                      <Switch
                        checked={config.critical_alerts}
                        onCheckedChange={(checked) =>
                          updateConfig(config.id, { critical_alerts: checked })
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className="text-yellow-600">Warning Alerts</Label>
                      <Switch
                        checked={config.warning_alerts}
                        onCheckedChange={(checked) =>
                          updateConfig(config.id, { warning_alerts: checked })
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className="text-blue-600">Info Alerts</Label>
                      <Switch
                        checked={config.info_alerts}
                        onCheckedChange={(checked) =>
                          updateConfig(config.id, { info_alerts: checked })
                        }
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Daily Summary
                    </Label>
                    <Switch
                      checked={config.daily_summary}
                      onCheckedChange={(checked) =>
                        updateConfig(config.id, { daily_summary: checked })
                      }
                    />
                  </div>
                  {config.daily_summary && (
                    <Input
                      type="time"
                      value={config.summary_time}
                      onChange={(e) =>
                        updateConfig(config.id, { summary_time: e.target.value })
                      }
                    />
                  )}
                </div>
              </TabsContent>

              <TabsContent value="slack" className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Enable Slack Notifications</Label>
                  <Switch
                    checked={config.slack_enabled}
                    onCheckedChange={(checked) =>
                      updateConfig(config.id, { slack_enabled: checked })
                    }
                  />
                </div>

                {config.slack_enabled && (
                  <>
                    <div className="space-y-2">
                      <Label>Webhook URL</Label>
                      <Input
                        type="url"
                        placeholder="https://hooks.slack.com/services/..."
                        value={config.slack_webhook_url || ''}
                        onChange={(e) =>
                          updateConfig(config.id, { slack_webhook_url: e.target.value })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Channel</Label>
                      <Input
                        placeholder="#alerts"
                        value={config.slack_channel || ''}
                        onChange={(e) =>
                          updateConfig(config.id, { slack_channel: e.target.value })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Bot Username</Label>
                      <Input
                        placeholder="Health Check Bot"
                        value={config.slack_username || ''}
                        onChange={(e) =>
                          updateConfig(config.id, { slack_username: e.target.value })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Icon Emoji</Label>
                      <Input
                        placeholder=":robot_face:"
                        value={config.slack_icon_emoji || ''}
                        onChange={(e) =>
                          updateConfig(config.id, { slack_icon_emoji: e.target.value })
                        }
                      />
                    </div>

                    <Button
                      onClick={() => testSlackWebhook(config)}
                      className="w-full"
                      variant="outline"
                    >
                      <TestTube className="h-4 w-4 mr-2" />
                      Send Test Alert
                    </Button>
                  </>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

