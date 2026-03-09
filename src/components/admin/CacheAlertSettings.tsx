import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Bell, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function CacheAlertSettings() {
  const [settings, setSettings] = useState({
    minHitRate: 60,
    maxResponseTime: 1000,
    maxStorageSize: 1024,
    maxApiErrors: 10
  });
  const { toast } = useToast();

  const saveSettings = () => {
    localStorage.setItem('cacheAlertSettings', JSON.stringify(settings));
    toast({
      title: 'Settings Saved',
      description: 'Alert thresholds have been updated'
    });
  };

  useEffect(() => {
    const saved = localStorage.getItem('cacheAlertSettings');
    if (saved) {
      setSettings(JSON.parse(saved));
    }
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="w-5 h-5" />
          Alert Thresholds
        </CardTitle>
        <CardDescription>
          Configure when to receive alerts about cache performance
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Minimum Hit Rate (%)</Label>
            <Input
              type="number"
              value={settings.minHitRate}
              onChange={(e) => setSettings({ ...settings, minHitRate: parseInt(e.target.value) })}
            />
          </div>

          <div className="space-y-2">
            <Label>Max Response Time (ms)</Label>
            <Input
              type="number"
              value={settings.maxResponseTime}
              onChange={(e) => setSettings({ ...settings, maxResponseTime: parseInt(e.target.value) })}
            />
          </div>

          <div className="space-y-2">
            <Label>Max Storage Size (MB)</Label>
            <Input
              type="number"
              value={settings.maxStorageSize}
              onChange={(e) => setSettings({ ...settings, maxStorageSize: parseInt(e.target.value) })}
            />
          </div>

          <div className="space-y-2">
            <Label>Max API Errors/Hour</Label>
            <Input
              type="number"
              value={settings.maxApiErrors}
              onChange={(e) => setSettings({ ...settings, maxApiErrors: parseInt(e.target.value) })}
            />
          </div>
        </div>

        <Button onClick={saveSettings} className="w-full">
          <Save className="w-4 h-4 mr-2" />
          Save Settings
        </Button>
      </CardContent>
    </Card>
  );
}
