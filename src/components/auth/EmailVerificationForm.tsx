import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, Mail, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface EmailVerificationFormProps {
  email?: string;
  onVerified?: () => void;
}

export const EmailVerificationForm: React.FC<EmailVerificationFormProps> = ({ 
  email, 
  onVerified 
}) => {
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token.trim()) return;

    setLoading(true);
    setError('');
    setMessage('');

    try {
      // Use the verify_email RPC function
      const { data: userData } = await supabase.auth.getUser();
      
      const { data, error } = await supabase.rpc('verify_email', {
        p_token: token.trim(),
        p_user_id: userData.user?.id
      });

      if (error) throw error;

      if (data?.success) {
        setMessage('Email verified successfully!');
        setTimeout(() => {
          onVerified?.();
        }, 1500);
      } else {
        throw new Error(data?.error || 'Verification failed');
      }
    } catch (err: any) {
      setError(err.message || 'Verification failed. Please check your token.');
    } finally {
      setLoading(false);
    }
  };


  const handleResendVerification = async () => {
    if (!email) return;

    setResendLoading(true);
    setError('');
    setMessage('');

    try {
      const { data: userData } = await supabase.auth.getUser();
      
      // Call the resend verification RPC function
      const { data, error } = await supabase.rpc('resend_verification_email', {
        p_user_id: userData.user?.id
      });

      if (error) throw error;

      if (data?.success && data?.token) {
        // Send the actual email via edge function
        const { error: emailError } = await supabase.functions.invoke('send-verification-email', {
          body: {
            to: email,
            token: data.token,
            action: 'resend'
          }
        });

        if (emailError) throw emailError;

        setMessage('Verification email sent! Please check your inbox.');
      } else {
        throw new Error(data?.error || 'Failed to resend verification email');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to send verification email.');
    } finally {
      setResendLoading(false);
    }
  };


  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4">
          <Mail className="w-6 h-6 text-blue-600" />
        </div>
        <CardTitle>Verify Your Email</CardTitle>
        <CardDescription>
          Enter the verification code sent to {email || 'your email address'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {message && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>{message}</AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleVerify} className="space-y-4">
          <div>
            <Input
              type="text"
              placeholder="Enter verification code"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              className="text-center text-lg tracking-widest"
              maxLength={32}
            />
          </div>

          <Button 
            type="submit" 
            className="w-full" 
            disabled={loading || !token.trim()}
          >
            {loading ? 'Verifying...' : 'Verify Email'}
          </Button>
        </form>

        <div className="text-center">
          <p className="text-sm text-muted-foreground mb-2">
            Didn't receive the code?
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={handleResendVerification}
            disabled={resendLoading || !email}
          >
            {resendLoading ? 'Sending...' : 'Resend Code'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};