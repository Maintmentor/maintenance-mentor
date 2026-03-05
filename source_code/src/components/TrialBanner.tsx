import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Clock, Sparkles } from 'lucide-react';
import { Button } from './ui/button';
import { useNavigate } from 'react-router-dom';

export const TrialBanner: React.FC = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();

  if (!profile || profile.subscription_status !== 'trial') return null;

  const trialEndsAt = profile.trial_ends_at ? new Date(profile.trial_ends_at) : null;
  const now = new Date();
  const daysLeft = trialEndsAt 
    ? Math.ceil((trialEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  if (daysLeft <= 0) return null;

  return (
    <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <Sparkles className="w-5 h-5" />
          <div>
            <p className="font-semibold">Free Trial Active</p>
            <p className="text-sm text-blue-100">
              <Clock className="w-3 h-3 inline mr-1" />
              {daysLeft} day{daysLeft !== 1 ? 's' : ''} remaining
            </p>
          </div>
        </div>
        <Button 
          variant="secondary" 
          size="sm"
          onClick={() => navigate('/profile?tab=subscription')}
        >
          Upgrade Now
        </Button>
      </div>
    </div>
  );
};

export default TrialBanner;

