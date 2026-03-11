import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Lock, Sparkles } from 'lucide-react';

export function TrialAccessGate({ children }: { children: React.ReactNode }) {
  const { profile } = useAuth();
  const navigate = useNavigate();

  // Allow access if user has active trial or paid subscription
  const hasAccess = profile?.subscription_status === 'trial' || 
                    profile?.subscription_status === 'active' ||
                    profile?.subscription_tier !== 'free';

  if (!hasAccess) {
    return (
      <Card className="p-12 text-center">
        <Lock className="h-16 w-16 mx-auto mb-4 text-gray-400" />
        <h3 className="text-2xl font-bold mb-2">Premium Feature</h3>
        <p className="text-gray-600 mb-6 max-w-md mx-auto">
          Your free trial has expired. Upgrade to a paid plan to continue using the AI-powered repair assistant.
        </p>
        <div className="space-y-4">
          <Button 
            size="lg"
            onClick={() => navigate('/profile?tab=subscription')}
            className="bg-gradient-to-r from-purple-600 to-blue-600"
          >
            <Sparkles className="h-5 w-5 mr-2" />
            Upgrade Now - Starting at $29/month
          </Button>
          <p className="text-sm text-gray-500">
            Get unlimited AI consultations, advanced analytics, and more
          </p>
        </div>
      </Card>
    );
  }

  return <>{children}</>;
}
