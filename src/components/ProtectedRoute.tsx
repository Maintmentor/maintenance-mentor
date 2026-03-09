import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Lock, Crown, Zap } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireSubscription?: boolean;
  minTier?: 'basic' | 'standard' | 'premium' | 'enterprise';
  onAuthRequired?: () => void;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requireSubscription = false,
  minTier = 'basic',
  onAuthRequired 
}) => {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Not authenticated
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Lock className="h-12 w-12 text-gray-400" />
            </div>
            <CardTitle>Authentication Required</CardTitle>
            <CardDescription>
              Please sign in to access this feature
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={onAuthRequired} 
              className="w-full"
            >
              Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Check subscription requirements
  if (requireSubscription && profile) {
    const isTrialActive = profile.subscription_status === 'trial' && 
      profile.trial_ends_at && 
      new Date(profile.trial_ends_at) > new Date();
    
    const hasActiveSubscription = profile.subscription_status === 'active' || isTrialActive;
    
    if (!hasActiveSubscription) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <Crown className="h-12 w-12 text-orange-400" />
              </div>
              <CardTitle>Subscription Required</CardTitle>
              <CardDescription>
                This feature requires an active subscription
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">
                Upgrade Now
              </Button>
            </CardContent>
          </Card>
        </div>
      );
    }

    // Check tier requirements
    const tierHierarchy = {
      basic: 1,
      standard: 2,
      premium: 3,
      enterprise: 4
    };

    const userTier = profile.subscription_tier || 'basic';
    const requiredTierLevel = tierHierarchy[minTier];
    const userTierLevel = tierHierarchy[userTier as keyof typeof tierHierarchy];

    if (userTierLevel < requiredTierLevel) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <Zap className="h-12 w-12 text-blue-400" />
              </div>
              <CardTitle>Upgrade Required</CardTitle>
              <CardDescription>
                This feature requires a {minTier} subscription or higher
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center mb-4">
                <p className="text-sm text-gray-600">
                  Current plan: <span className="font-semibold capitalize">{userTier}</span>
                </p>
                <p className="text-sm text-gray-600">
                  Required: <span className="font-semibold capitalize">{minTier}</span>
                </p>
              </div>
              <Button className="w-full">
                Upgrade Plan
              </Button>
            </CardContent>
          </Card>
        </div>
      );
    }
  }

  return <>{children}</>;
};