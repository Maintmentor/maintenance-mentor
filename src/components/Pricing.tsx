import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Check, Calculator, Home, Zap } from 'lucide-react';
import { AuthModal } from './auth/AuthModal';
import { calculatePrice } from './subscription/PricingTiers';

export const Pricing: React.FC = () => {
  const [bedCount, setBedCount] = useState<number>(250);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authDefaultView, setAuthDefaultView] = useState<'signin' | 'signup'>('signup');
  const monthlyPrice = calculatePrice(bedCount);

  const features = [
    'AI repair diagnostics',
    'Maintenance reminders',
    'Email & chat support',
    'Mobile app access',
    'Unlimited repair requests',
    'Cost estimation tools',
    'Warranty tracking',
    'Parts tracking',
    'Analytics dashboard',
    'Priority support'
  ];

  const handleStartTrial = () => {
    setAuthDefaultView('signup');
    setShowAuthModal(true);
  };

  return (
    <>
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        defaultView={authDefaultView}
      />
      <section id="pricing" className="py-20 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Simple Bed-Based Pricing
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Pay based on your property size. No complex tiers - just straightforward pricing that scales with your needs.
            </p>
          </div>

          <div className="max-w-md mx-auto mb-12">
            <Card className="border-blue-500 shadow-lg">
              <CardHeader className="text-center">
                <div className="flex justify-center mb-4">
                  <div className="p-3 rounded-full bg-blue-100 text-blue-600">
                    <Calculator className="h-6 w-6" />
                  </div>
                </div>
                <CardTitle className="text-2xl font-bold">Calculate Your Price</CardTitle>
                <CardDescription>
                  Enter the number of beds in your property
                </CardDescription>
              </CardHeader>

              <CardContent>
                <div className="space-y-4 mb-6">
                  <div>
                    <Label htmlFor="beds">Number of Beds</Label>
                    <Input
                      id="beds"
                      type="number"
                      min="1"
                      max="2000"
                      value={bedCount}
                      onChange={(e) => setBedCount(Math.max(1, parseInt(e.target.value) || 1))}
                      className="text-center text-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      autoFocus
                    />
                  </div>

                  <div className="text-center p-6 bg-blue-50 rounded-lg">
                    <div className="text-4xl font-bold text-blue-600 mb-2">
                      ${monthlyPrice.toFixed(2)}
                      <span className="text-lg font-normal text-gray-500">/month</span>
                    </div>
                    <p className="text-sm text-gray-600">
                      {bedCount} bed{bedCount !== 1 ? 's' : ''} x $0.50
                    </p>
                  </div>

                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg text-center">
                    <p className="text-sm font-semibold text-gray-700">Simple Pricing</p>
                    <p className="text-xs text-gray-600 mt-1">$0.50 per bed per month</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <Button
                    onClick={handleStartTrial}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                    size="lg"
                  >
                    <Zap className="mr-2 h-4 w-4" />
                    Start 7-Day Free Trial
                  </Button>

                  <p className="text-xs text-center text-gray-500">
                    No credit card required - Cancel anytime
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="max-w-2xl mx-auto">
            <Card>
              <CardHeader className="text-center">
                <div className="flex justify-center mb-4">
                  <div className="p-3 rounded-full bg-green-100 text-green-600">
                    <Home className="h-6 w-6" />
                  </div>
                </div>
                <CardTitle className="text-xl font-bold">Everything Included</CardTitle>
                <CardDescription>
                  All features included at every price point
                </CardDescription>
              </CardHeader>

              <CardContent>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <Check className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-gray-600">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>

          <div className="text-center mt-12">
            <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <Check className="h-4 w-4 text-green-500" />
                Cancel anytime
              </span>
              <span className="flex items-center gap-1">
                <Check className="h-4 w-4 text-green-500" />
                30-day money-back guarantee
              </span>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default Pricing;
