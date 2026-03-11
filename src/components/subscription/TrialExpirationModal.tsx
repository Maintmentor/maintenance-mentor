import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { AlertTriangle } from 'lucide-react';

export function TrialExpirationModal() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (profile?.subscription_status === 'expired') {
      setShowModal(true);
    }
  }, [profile]);

  const handleUpgrade = () => {
    setShowModal(false);
    navigate('/profile?tab=subscription');
  };

  return (
    <AlertDialog open={showModal} onOpenChange={setShowModal}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-2 text-orange-600">
            <AlertTriangle className="h-6 w-6" />
            <AlertDialogTitle>Free Trial Expired</AlertDialogTitle>
          </div>
          <AlertDialogDescription className="space-y-2">
            <p>Your 7-day free trial has ended.</p>
            <p>Upgrade to a paid plan to continue using all features.</p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction onClick={handleUpgrade}>
            View Pricing Plans
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
