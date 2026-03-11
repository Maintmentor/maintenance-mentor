import React, { useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Mail, X, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

interface EmailVerificationBannerProps {
  onDismiss?: () => void;
}

export const EmailVerificationBanner: React.FC<EmailVerificationBannerProps> = ({ 
  onDismiss 
}) => {
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [dismissed, setDismissed] = useState(false);

  // Don't show if email is verified or banner is dismissed
  if (!user || !profile || profile.email_verified || dismissed) {
    return null;
  }

  const handleResendVerification = async () => {
    setLoading(true);
    setError('');
    setMessage('');

    try {
      // Call the resend verification function
      const { data, error } = await supabase.rpc('resend_verification_email', {
        p_user_id: user.id
      });

      if (error) throw error;

      if (data?.success) {
        // Send the actual email via edge function
        const { error: emailError } = await supabase.functions.invoke('send-verification-email', {
          body: {
            to: user.email,
            token: data.token,
            userName: profile.full_name,
            action: 'resend'
          }
        });

        if (emailError) throw emailError;

        setMessage('Verification email sent! Check your inbox.');
      } else {
        throw new Error(data?.error || 'Failed to resend verification email');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to send verification email');
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    onDismiss?.();
  };

  return (
    <Alert className="mb-4 border-yellow-200 bg-yellow-50">
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3">
          <Mail className="h-5 w-5 text-yellow-600 mt-0.5" />
          <div className="flex-1">
            <AlertDescription className="text-yellow-800">
              <strong>Please verify your email address</strong>
              <p className="mt-1 text-sm">
                We've sent a verification email to <strong>{user.email}</strong>. 
                Verify your email to unlock all features.
              </p>
              
              {message && (
                <div className="mt-2 flex items-center text-green-600 text-sm">
                  <CheckCircle className="h-4 w-4 mr-1" />
                  {message}
                </div>
              )}
              
              {error && (
                <div className="mt-2 flex items-center text-red-600 text-sm">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {error}
                </div>
              )}
              
              <div className="mt-3 flex items-center space-x-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleResendVerification}
                  disabled={loading}
                  className="bg-white"
                >
                  {loading ? 'Sending...' : 'Resend Verification Email'}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => window.location.href = '/verify-email'}
                  className="text-yellow-700 hover:text-yellow-800"
                >
                  Enter Code Manually
                </Button>
              </div>
            </AlertDescription>
          </div>
        </div>
        <Button
          size="sm"
          variant="ghost"
          onClick={handleDismiss}
          className="text-yellow-600 hover:text-yellow-700 -mt-1 -mr-1"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </Alert>
  );
};