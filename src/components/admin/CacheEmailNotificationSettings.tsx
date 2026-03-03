import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { cacheEmailNotificationService } from '@/services/cacheEmailNotificationService';
import { useAuth } from '@/contexts/AuthContext';
import { Mail, Bell, Settings } from 'lucide-react';

export function CacheEmailNotificationSettings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [enabled, setEnabled] = useState(true);
  const [alertTypes, setAlertTypes] = useState<string[]>([
    'low_hit_rate',
    'high_response_time',
    'storage_limit',
    'api_errors'
  ]);
  const [severityLevels, setSeverityLevels] = useState<string[]>(['critical', 'warning']);

  useEffect(() => {
    loadPreferences();
  }, [user]);

  const loadPreferences = async () => {
    if (!user) return;
    
    try {
      const prefs = await cacheEmailNotificationService.getPreferences(user.id);
      if (prefs) {
        setEmail(prefs.email);
        setEnabled(prefs.enabled);
        setAlertTypes(prefs.alertTypes);
        setSeverityLevels(prefs.severityLevels);
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      await cacheEmailNotificationService.updatePreferences(user.id, {
        email,
        enabled,
        alertTypes,
        severityLevels
      });

      toast({
        title: 'Settings saved',
        description: 'Email notification preferences updated successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save notification preferences',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleAlertType = (type: string) => {
    setAlertTypes(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  const toggleSeverity = (severity: string) => {
    setSeverityLevels(prev =>
      prev.includes(severity) ? prev.filter(s => s !== severity) : [...prev, severity]
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          Email Notification Settings
        </CardTitle>
        <CardDescription>
          Configure when and how you receive cache performance alerts
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Enable Email Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Receive alerts when cache performance issues are detected
              </p>
            </div>
            <Switch checked={enabled} onCheckedChange={setEnabled} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@example.com"
            />
          </div>

          <div className="space-y-3">
            <Label>Alert Types</Label>
            <div className="space-y-2">
              {[
                { value: 'low_hit_rate', label: 'Low Hit Rate (< 40%)' },
                { value: 'high_response_time', label: 'High Response Time (> 2000ms)' },
                { value: 'storage_limit', label: 'Storage Limit Reached' },
                { value: 'api_errors', label: 'API Errors' }
              ].map(({ value, label }) => (
                <div key={value} className="flex items-center space-x-2">
                  <Checkbox
                    id={value}
                    checked={alertTypes.includes(value)}
                    onCheckedChange={() => toggleAlertType(value)}
                  />
                  <label htmlFor={value} className="text-sm cursor-pointer">
                    {label}
                  </label>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <Label>Severity Levels</Label>
            <div className="space-y-2">
              {[
                { value: 'critical', label: 'Critical', color: 'text-red-600' },
                { value: 'warning', label: 'Warning', color: 'text-yellow-600' }
              ].map(({ value, label, color }) => (
                <div key={value} className="flex items-center space-x-2">
                  <Checkbox
                    id={value}
                    checked={severityLevels.includes(value)}
                    onCheckedChange={() => toggleSeverity(value)}
                  />
                  <label htmlFor={value} className={`text-sm cursor-pointer ${color}`}>
                    {label}
                  </label>
                </div>
              ))}
            </div>
          </div>
        </div>

        <Button onClick={handleSave} disabled={loading} className="w-full">
          <Settings className="mr-2 h-4 w-4" />
          {loading ? 'Saving...' : 'Save Preferences'}
        </Button>
      </CardContent>
    </Card>
  );
}
