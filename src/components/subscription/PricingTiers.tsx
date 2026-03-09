import { Check, Calculator } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useState } from 'react';

export function calculatePrice(bedCount: number): number {
  if (bedCount <= 0) return 0;
  return bedCount * 0.50;
}

export function PricingTiers() {
  const [bedCount, setBedCount] = useState<string>('');
  const price = bedCount ? calculatePrice(parseInt(bedCount)) : 0;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <Card className="border-2 border-blue-500">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Calculator className="h-12 w-12 text-blue-600" />
          </div>
          <CardTitle className="text-3xl">Simple, Transparent Pricing</CardTitle>
          <CardDescription className="text-lg">$0.50 per bed per month</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="bedCount" className="text-base">How many beds does your property have?</Label>
            <Input
              id="bedCount"
              type="number"
              min="1"
              placeholder="Enter bed count"
              value={bedCount}
              onChange={(e) => setBedCount(e.target.value)}
              className="text-lg h-12"
            />
          </div>
          
          {bedCount && parseInt(bedCount) > 0 && (
            <div className="bg-blue-50 p-6 rounded-lg text-center">
              <p className="text-gray-600 mb-2">Your monthly cost:</p>
              <p className="text-5xl font-bold text-blue-600">${price.toFixed(2)}</p>
              <p className="text-sm text-gray-500 mt-2">per month</p>
              <p className="text-xs text-gray-400 mt-1">{bedCount} beds × $0.50</p>
            </div>
          )}

          <div className="border-t pt-6">
            <h3 className="font-semibold mb-4">All subscriptions include:</h3>
            <ul className="space-y-3">
              {[
                'AI-Powered Repair Diagnostics',
                'Maintenance Reminders & Scheduling',
                'Email Reports & Notifications',
                'Analytics Dashboard',
                'Mobile Access',
                'Parts Tracking',
                'Repair History',
                'Priority Support'
              ].map((feature, i) => (
                <li key={i} className="flex items-start gap-2">
                  <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <span className="text-sm">{feature}</span>
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>

      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-8 rounded-lg text-center">
        <h3 className="text-xl font-semibold mb-2">No Hidden Fees</h3>
        <p className="text-gray-600">Simple pricing at $0.50 per bed. No setup fees, no contracts.</p>
      </div>
    </div>
  );
}
