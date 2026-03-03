import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, DollarSign } from 'lucide-react';

interface BedCountVerificationProps {
  onBedCountChange: (bedCount: number, monthlyPrice: number) => void;
}

export const BedCountVerification = ({ onBedCountChange }: BedCountVerificationProps) => {
  const [bedCount, setBedCount] = useState<string>('');
  const [monthlyPrice, setMonthlyPrice] = useState<number>(0);

  useEffect(() => {
    const count = parseInt(bedCount);
    if (!isNaN(count) && count > 0) {
      const price = count * 0.50;
      setMonthlyPrice(price);
      onBedCountChange(count, price);
    } else {
      setMonthlyPrice(0);
    }
  }, [bedCount, onBedCountChange]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Property Bed Count</CardTitle>
        <CardDescription>
          Enter your total bed count - pricing is $0.50 per bed per month
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="bedCount">Total Number of Beds</Label>
          <Input
            id="bedCount"
            type="number"
            min="1"
            placeholder="e.g., 350"
            value={bedCount}
            onChange={(e) => setBedCount(e.target.value)}
          />
        </div>

        {monthlyPrice > 0 && (
          <Alert className="bg-blue-50 border-blue-200">
            <DollarSign className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800">
              Your monthly subscription: <strong>${monthlyPrice.toFixed(2)}</strong>
              <div className="text-xs mt-1">{bedCount} beds × $0.50</div>
            </AlertDescription>
          </Alert>
        )}

        {monthlyPrice > 0 && (
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              All features included - no hidden fees or limits
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};
