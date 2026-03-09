import { useState } from 'react';
import { MapPin } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { stripeService } from '@/services/stripeService';
import { useToast } from '@/hooks/use-toast';

interface BillingAddressFormProps {
  customerId: string;
  initialAddress?: any;
  onUpdate: () => void;
}

export function BillingAddressForm({ customerId, initialAddress, onUpdate }: BillingAddressFormProps) {
  const [loading, setLoading] = useState(false);
  const [address, setAddress] = useState({
    line1: initialAddress?.line1 || '',
    line2: initialAddress?.line2 || '',
    city: initialAddress?.city || '',
    state: initialAddress?.state || '',
    postal_code: initialAddress?.postal_code || '',
    country: initialAddress?.country || 'US'
  });
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await stripeService.updateBillingAddress(customerId, address);
      toast({
        title: 'Success',
        description: 'Billing address updated successfully'
      });
      onUpdate();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 mb-4">
        <MapPin className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">Billing Address</h3>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="line1">Address Line 1</Label>
          <Input
            id="line1"
            value={address.line1}
            onChange={(e) => setAddress({ ...address, line1: e.target.value })}
            required
          />
        </div>
        <div>
          <Label htmlFor="line2">Address Line 2 (Optional)</Label>
          <Input
            id="line2"
            value={address.line2}
            onChange={(e) => setAddress({ ...address, line2: e.target.value })}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="city">City</Label>
            <Input
              id="city"
              value={address.city}
              onChange={(e) => setAddress({ ...address, city: e.target.value })}
              required
            />
          </div>
          <div>
            <Label htmlFor="state">State</Label>
            <Input
              id="state"
              value={address.state}
              onChange={(e) => setAddress({ ...address, state: e.target.value })}
              required
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="postal_code">Postal Code</Label>
            <Input
              id="postal_code"
              value={address.postal_code}
              onChange={(e) => setAddress({ ...address, postal_code: e.target.value })}
              required
            />
          </div>
          <div>
            <Label htmlFor="country">Country</Label>
            <Input
              id="country"
              value={address.country}
              onChange={(e) => setAddress({ ...address, country: e.target.value })}
              required
            />
          </div>
        </div>
        <Button type="submit" disabled={loading} className="w-full">
          {loading ? 'Updating...' : 'Update Address'}
        </Button>
      </form>
    </Card>
  );
}
