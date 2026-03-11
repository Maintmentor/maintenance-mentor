import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface PersonalInfoStepProps {
  data: any;
  onUpdate: (data: any) => void;
}

export function PersonalInfoStep({ data, onUpdate }: PersonalInfoStepProps) {
  const handleChange = (field: string, value: string) => {
    onUpdate({ [field]: value });
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold mb-4">Personal Information</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Help us personalize your experience with some basic information.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone_number">Phone Number</Label>
        <Input
          id="phone_number"
          type="tel"
          placeholder="+1 (555) 123-4567"
          value={data.phone_number || ''}
          onChange={(e) => handleChange('phone_number', e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="address_line1">Address Line 1</Label>
        <Input
          id="address_line1"
          placeholder="123 Main Street"
          value={data.address_line1 || ''}
          onChange={(e) => handleChange('address_line1', e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="address_line2">Address Line 2 (Optional)</Label>
        <Input
          id="address_line2"
          placeholder="Apt 4B"
          value={data.address_line2 || ''}
          onChange={(e) => handleChange('address_line2', e.target.value)}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="city">City</Label>
          <Input
            id="city"
            placeholder="New York"
            value={data.city || ''}
            onChange={(e) => handleChange('city', e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="state">State</Label>
          <Input
            id="state"
            placeholder="NY"
            value={data.state || ''}
            onChange={(e) => handleChange('state', e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="zip_code">ZIP Code</Label>
          <Input
            id="zip_code"
            placeholder="10001"
            value={data.zip_code || ''}
            onChange={(e) => handleChange('zip_code', e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="country">Country</Label>
          <Input
            id="country"
            placeholder="United States"
            value={data.country || 'United States'}
            onChange={(e) => handleChange('country', e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}
