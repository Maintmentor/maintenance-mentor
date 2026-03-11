import { useState, useEffect } from 'react';
import { Elements } from '@stripe/react-stripe-js';
import { getStripe, stripeService } from '@/services/stripeService';
import { PricingTiers, calculatePrice } from './PricingTiers';
import { PaymentForm } from './PaymentForm';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, CreditCard, Calendar, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

export function SubscriptionManager() {
  const { user, profile, refreshProfile } = useAuth();
  const [bedCount, setBedCount] = useState<string>('');
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currentSubscription, setCurrentSubscription] = useState<any>(null);

  const monthlyPrice = bedCount ? calculatePrice(parseInt(bedCount)) : 0;

  useEffect(() => {
    if (profile?.stripe_subscription_id) {
      loadSubscription();
    }
  }, [profile]);

  const loadSubscription = async () => {
    if (!profile?.stripe_subscription_id) return;
    
    try {
      const { subscription } = await stripeService.getSubscription(profile.stripe_subscription_id);
      setCurrentSubscription(subscription);
    } catch (error) {
      console.error('Failed to load subscription:', error);
    }
  };

  const handleSubscribe = async () => {
    if (!user || !bedCount || parseInt(bedCount) <= 0) {
      toast.error('Please enter a valid bed count');
      return;
    }
    
    setIsLoading(true);

    try {
      // Create a custom price ID based on bed count
      const priceId = `price_${monthlyPrice}_monthly`;
      
      const { clientSecret, subscriptionId } = await stripeService.createSubscription(
        user.id,
        priceId,
        user.email!
      );

      await supabase.from('profiles').update({
        stripe_subscription_id: subscriptionId,
        subscription_price_id: priceId,
        bed_count: parseInt(bedCount)
      }).eq('id', user.id);

      setClientSecret(clientSecret);
    } catch (error: any) {
      toast.error(error.message || 'Failed to create subscription');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePaymentSuccess = async () => {
    await supabase.from('profiles').update({
      subscription_status: 'active'
    }).eq('id', user!.id);

    await refreshProfile();
    setClientSecret(null);
    setBedCount('');
    toast.success('Subscription activated successfully!');
  };

  const handleCancelSubscription = async () => {
    if (!currentSubscription) return;
    
    setIsLoading(true);
    try {
      await stripeService.cancelSubscription(currentSubscription.id);
      await supabase.from('profiles').update({
        subscription_status: 'canceled'
      }).eq('id', user!.id);
      
      await refreshProfile();
      toast.success('Subscription canceled');
    } catch (error: any) {
      toast.error(error.message || 'Failed to cancel subscription');
    } finally {
      setIsLoading(false);
    }
  };

  if (clientSecret) {
    return (
      <div className="max-w-2xl mx-auto">
        <Elements stripe={getStripe()} options={{ clientSecret }}>
          <PaymentForm 
            onSuccess={handlePaymentSuccess}
            onCancel={() => {
              setClientSecret(null);
              setBedCount('');
            }}
          />
        </Elements>
      </div>
    );
  }

  if (profile?.subscription_status === 'active' && currentSubscription) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-6 w-6 text-green-600" />
            Active Subscription
          </CardTitle>
          <CardDescription>Manage your current subscription</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="font-semibold text-lg">{profile.bed_count} Beds</p>
              <p className="text-sm text-gray-600">Property Management</p>
            </div>
            <Badge variant="default">Active</Badge>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <CreditCard className="h-4 w-4" />
            <span>${calculatePrice(profile.bed_count || 0).toFixed(2)}/month</span>
            <span className="text-xs text-gray-500">({profile.bed_count} beds × $0.50)</span>
          </div>

          
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Calendar className="h-4 w-4" />
            <span>Next billing: {new Date(currentSubscription.current_period_end * 1000).toLocaleDateString()}</span>
          </div>

          <Button 
            variant="destructive" 
            onClick={handleCancelSubscription}
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Cancel Subscription'}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold mb-2">Subscribe to Premium</h2>
        <p className="text-gray-600">Simple pricing based on your property size</p>
      </div>
      
      <PricingTiers />

      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Start Your Subscription</CardTitle>
          <CardDescription>Enter your property details to get started</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="bedCount">Property Bed Count</Label>
            <Input
              id="bedCount"
              type="number"
              min="1"
              placeholder="Enter total number of beds"
              value={bedCount}
              onChange={(e) => setBedCount(e.target.value)}
            />
          </div>

          {bedCount && parseInt(bedCount) > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800 mb-1">Your monthly subscription:</p>
              <p className="text-3xl font-bold text-blue-600">${monthlyPrice.toFixed(2)}</p>
              <p className="text-xs text-blue-600 mt-1">{bedCount} beds × $0.50</p>
            </div>
          )}

          <Button

            onClick={handleSubscribe}
            disabled={isLoading || !bedCount || parseInt(bedCount) <= 0}
            className="w-full"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Continue to Payment
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
