import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

interface UseEmailVerificationReturn {
  isVerified: boolean;
  isLoading: boolean;
  verificationRequired: boolean;
  resendVerification: () => Promise<void>;
  checkVerificationStatus: () => Promise<void>;
}

export const useEmailVerification = (): UseEmailVerificationReturn => {
  const { user, profile, refreshProfile } = useAuth();
  const [isVerified, setIsVerified] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [verificationRequired, setVerificationRequired] = useState(false);

  useEffect(() => {
    checkVerificationStatus();
  }, [user, profile]);

  const checkVerificationStatus = async () => {
    if (!user || !profile) {
      setIsLoading(false);
      return;
    }

    setIsVerified(profile.email_verified || false);
    setVerificationRequired(!profile.email_verified);
    setIsLoading(false);
  };

  const resendVerification = async () => {
    if (!user) throw new Error('No user logged in');

    try {
      // Call the resend verification function
      const { data, error } = await supabase.rpc('resend_verification_email', {
        p_user_id: user.id
      });

      if (error) throw error;

      if (data?.success && data?.token) {
        // Send the actual email via edge function
        const { error: emailError } = await supabase.functions.invoke('send-verification-email', {
          body: {
            to: user.email,
            token: data.token,
            userName: profile?.full_name,
            action: 'resend'
          }
        });

        if (emailError) throw emailError;
      } else {
        throw new Error(data?.error || 'Failed to resend verification email');
      }
    } catch (error) {
      console.error('Error resending verification:', error);
      throw error;
    }
  };

  return {
    isVerified,
    isLoading,
    verificationRequired,
    resendVerification,
    checkVerificationStatus
  };
};