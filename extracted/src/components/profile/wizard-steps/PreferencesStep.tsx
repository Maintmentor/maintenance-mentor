import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';

interface PreferencesStepProps {
  data: any;
  onUpdate: (data: any) => void;
}

export function PreferencesStep({ data, onUpdate }: PreferencesStepProps) {
  const notificationPrefs = data.notification_preferences || { email: true, sms: false, push: true };
  const servicePrefs = data.service_preferences || [];

  const handleNotificationChange = (field: string, value: boolean) => {
    onUpdate({
      notification_preferences: { ...notificationPrefs, [field]: value }
    });
  };

  const handleServiceChange = (service: string, checked: boolean) => {
    const updated = checked
      ? [...servicePrefs, service]
      : servicePrefs.filter((s: string) => s !== service);
    onUpdate({ service_preferences: updated });
  };

  const services = [
    { id: 'plumbing', label: 'Plumbing' },
    { id: 'electrical', label: 'Electrical' },
    { id: 'hvac', label: 'HVAC' },
    { id: 'appliance', label: 'Appliance Repair' },
    { id: 'pool', label: 'Pool Maintenance' },
    { id: 'water_system', label: 'Water System' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Preferences</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Customize your notification and service preferences.
        </p>
      </div>

      <div className="space-y-4">
        <h4 className="font-medium">Notification Preferences</h4>
        
        <div className="flex items-center justify-between">
          <Label htmlFor="email-notif">Email Notifications</Label>
          <Switch
            id="email-notif"
            checked={notificationPrefs.email}
            onCheckedChange={(checked) => handleNotificationChange('email', checked)}
          />
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="sms-notif">SMS Notifications</Label>
          <Switch
            id="sms-notif"
            checked={notificationPrefs.sms}
            onCheckedChange={(checked) => handleNotificationChange('sms', checked)}
          />
        </div>

        <div className="flex items-center justify-between">
          <Label htmlFor="push-notif">Push Notifications</Label>
          <Switch
            id="push-notif"
            checked={notificationPrefs.push}
            onCheckedChange={(checked) => handleNotificationChange('push', checked)}
          />
        </div>
      </div>

      <div className="space-y-4">
        <h4 className="font-medium">Service Interests</h4>
        <div className="space-y-3">
          {services.map((service) => (
            <div key={service.id} className="flex items-center space-x-2">
              <Checkbox
                id={service.id}
                checked={servicePrefs.includes(service.id)}
                onCheckedChange={(checked) => handleServiceChange(service.id, checked as boolean)}
              />
              <Label htmlFor={service.id} className="cursor-pointer">
                {service.label}
              </Label>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
