import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { EmailVerificationForm } from '@/components/auth/EmailVerificationForm';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function VerifyEmail() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, profile, refreshProfile } = useAuth();
  const [verifying, setVerifying] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  
  const token = searchParams.get('token');

  useEffect(() => {
    // Auto-verify if token is in URL
    if (token && user) {
      verifyEmailWithToken(token);
    }
  }, [token, user]);

  const verifyEmailWithToken = async (verificationToken: string) => {
    setVerifying(true);
    setError('');
    setMessage('');

    try {
      const { data, error } = await supabase.rpc('verify_email', {
        p_token: verificationToken,
        p_user_id: user?.id
      });

      if (error) throw error;

      if (data?.success) {
        setMessage('Email verified successfully! Redirecting to home page...');
        await refreshProfile();
        setTimeout(() => {
          navigate('/');
        }, 2000);

      } else {
        throw new Error(data?.error || 'Verification failed');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to verify email');
    } finally {
      setVerifying(false);
    }
  };

  const handleVerified = async () => {
    await refreshProfile();
    navigate('/');
  };


  // If email is already verified, redirect
  if (profile?.email_verified) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <CardTitle>Email Already Verified</CardTitle>
            <CardDescription>
              Your email address has already been verified.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              className="w-full" 
              onClick={() => navigate('/dashboard')}
            >
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md space-y-4">
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

        {verifying ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
                <p>Verifying your email...</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <EmailVerificationForm 
            email={user?.email} 
            onVerified={handleVerified}
          />
        )}
      </div>
    </div>
  );
}