import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Clock, Sparkles } from 'lucide-react';
import { checkTrialExpiration } from '@/services/trialService';

export function TrialCountdownBanner() {
  const { profile, user } = useAuth();
  const navigate = useNavigate();
  const [daysRemaining, setDaysRemaining] = useState<number | null>(null);
  const [hoursRemaining, setHoursRemaining] = useState<number>(0);

  useEffect(() => {
    if (user && profile?.subscription_status === 'trial') {
      loadTrialStatus();
      const interval = setInterval(loadTrialStatus, 60000); // Update every minute
      return () => clearInterval(interval);
    }
  }, [user, profile]);

  const loadTrialStatus = async () => {
    if (!user) return;
    
    const result = await checkTrialExpiration(user.id);
    if (result.daysRemaining !== null) {
      setDaysRemaining(result.daysRemaining);
      
      // Calculate hours for last day
      if (profile?.trial_ends_at) {
        const now = new Date();
        const end = new Date(profile.trial_ends_at);
        const hours = Math.floor((end.getTime() - now.getTime()) / (1000 * 60 * 60));
        setHoursRemaining(hours);
      }
    }
  };

  if (!profile || profile.subscription_status !== 'trial' || daysRemaining === null) {
    return null;
  }

  const isUrgent = daysRemaining <= 2;
  const isLastDay = daysRemaining === 0;

  return (
    <Alert className={`mb-6 ${isUrgent ? 'border-orange-500 bg-orange-50' : 'border-blue-500 bg-blue-50'}`}>
      <Clock className={`h-5 w-5 ${isUrgent ? 'text-orange-600' : 'text-blue-600'}`} />
      <AlertDescription className="flex items-center justify-between">
        <div>
          <p className={`font-semibold ${isUrgent ? 'text-orange-900' : 'text-blue-900'}`}>
            {isLastDay 
              ? `⏰ Trial ends in ${hoursRemaining} hours!` 
              : `🎉 ${daysRemaining} day${daysRemaining !== 1 ? 's' : ''} left in your free trial`}
          </p>
          <p className={`text-sm mt-1 ${isUrgent ? 'text-orange-700' : 'text-blue-700'}`}>
            {isLastDay
              ? 'Upgrade now to keep access to all premium features'
              : 'Upgrade anytime to unlock unlimited access'}
          </p>
        </div>
        <Button 
          onClick={() => navigate('/profile?tab=subscription')}
          className={isUrgent ? 'bg-orange-600 hover:bg-orange-700' : ''}
        >
          <Sparkles className="h-4 w-4 mr-2" />
          Upgrade Now
        </Button>
      </AlertDescription>
    </Alert>
  );
}
