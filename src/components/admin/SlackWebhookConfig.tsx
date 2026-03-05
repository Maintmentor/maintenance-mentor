import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from '@/components/ui/use-toast';
import { Loader2, Plus, Trash2, Send } from 'lucide-react';

interface SlackConfig {
  id: string;
  webhook_url: string;
  channel_name: string;
  enabled: boolean;
  alert_types: string[];
  created_at: string;
}

export default function SlackWebhookConfig() {
  const [configs, setConfigs] = useState<SlackConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newConfig, setNewConfig] = useState({
    webhook_url: '',
    channel_name: '',
    alert_types: ['critical', 'warning']
  });

  useEffect(() => {
    loadConfigs();
  }, []);

  const loadConfigs = async () => {
    try {
      const { data, error } = await supabase
        .from('slack_webhook_config')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setConfigs(data || []);
    } catch (error) {
      console.error('Error loading Slack configs:', error);
      toast({
        title: 'Error',
        description: 'Failed to load Slack configurations',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const addConfig = async () => {
    if (!newConfig.webhook_url || !newConfig.channel_name) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields',
        variant: 'destructive'
      });
      return;
    }

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('slack_webhook_config')
        .insert([{
          ...newConfig,
          created_by: user?.id
        }]);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Slack webhook configuration added'
      });

      setNewConfig({
        webhook_url: '',
        channel_name: '',
        alert_types: ['critical', 'warning']
      });

      loadConfigs();
    } catch (error) {
      console.error('Error adding config:', error);
      toast({
        title: 'Error',
        description: 'Failed to add Slack configuration',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const toggleEnabled = async (id: string, enabled: boolean) => {
    try {
      const { error } = await supabase
        .from('slack_webhook_config')
        .update({ enabled })
        .eq('id', id);

      if (error) throw error;
      loadConfigs();
    } catch (error) {
      console.error('Error updating config:', error);
    }
  };

  const deleteConfig = async (id: string) => {
    try {
      const { error } = await supabase
        .from('slack_webhook_config')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      toast({
        title: 'Success',
        description: 'Slack configuration deleted'
      });
      
      loadConfigs();
    } catch (error) {
      console.error('Error deleting config:', error);
    }
  };

  const testWebhook = async (config: SlackConfig) => {
    try {
      const { error } = await supabase.functions.invoke('slack-alert-sender', {
        body: {
          keyName: 'TEST_KEY',
          alertType: 'info',
          healthScore: 100,
          errorMessage: 'This is a test alert from the API Key Validation System',
          lastValidated: new Date().toISOString()
        }
      });

      if (error) throw error;

      toast({
        title: 'Test Alert Sent',
        description: `Check ${config.channel_name} for the test message`
      });
    } catch (error) {
      console.error('Error sending test:', error);
      toast({
        title: 'Error',
        description: 'Failed to send test alert',
        variant: 'destructive'
      });
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
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Add Slack Webhook</CardTitle>
          <CardDescription>
            Configure Slack webhooks to receive API key alerts
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="webhook_url">Webhook URL</Label>
            <Input
              id="webhook_url"
              type="url"
              placeholder="https://hooks.slack.com/services/..."
              value={newConfig.webhook_url}
              onChange={(e) => setNewConfig({ ...newConfig, webhook_url: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="channel_name">Channel Name</Label>
            <Input
              id="channel_name"
              placeholder="#api-alerts"
              value={newConfig.channel_name}
              onChange={(e) => setNewConfig({ ...newConfig, channel_name: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label>Alert Types</Label>
            <div className="flex gap-4">
              {['critical', 'warning', 'info'].map((type) => (
                <div key={type} className="flex items-center space-x-2">
                  <Checkbox
                    id={type}
                    checked={newConfig.alert_types.includes(type)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setNewConfig({
                          ...newConfig,
                          alert_types: [...newConfig.alert_types, type]
                        });
                      } else {
                        setNewConfig({
                          ...newConfig,
                          alert_types: newConfig.alert_types.filter(t => t !== type)
                        });
                      }
                    }}
                  />
                  <Label htmlFor={type} className="capitalize">{type}</Label>
                </div>
              ))}
            </div>
          </div>

          <Button onClick={addConfig} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
            Add Webhook
          </Button>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Configured Webhooks</h3>
        {configs.map((config) => (
          <Card key={config.id}>
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold">{config.channel_name}</h4>
                    <Badge variant={config.enabled ? 'default' : 'secondary'}>
                      {config.enabled ? 'Enabled' : 'Disabled'}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {config.webhook_url.substring(0, 50)}...
                  </p>
                  <div className="flex gap-2">
                    {config.alert_types.map((type) => (
                      <Badge key={type} variant="outline" className="capitalize">
                        {type}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Switch
                    checked={config.enabled}
                    onCheckedChange={(checked) => toggleEnabled(config.id, checked)}
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => testWebhook(config)}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => deleteConfig(config.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        {configs.length === 0 && (
          <p className="text-center text-muted-foreground py-8">
            No Slack webhooks configured yet
          </p>
        )}
      </div>
    </div>
  );
}