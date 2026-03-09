import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, ArrowLeft, Mail, CheckCircle2, AlertCircle, Send } from 'lucide-react';

interface PasswordResetFormProps {
  onBack: () => void;
}

export const PasswordResetForm: React.FC<PasswordResetFormProps> = ({ onBack }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const { resetPassword } = useAuth();

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate email
    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }

    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);

    try {
      const { error } = await resetPassword(email.trim().toLowerCase());
      
      if (error) {
        // Check for specific error types
        if (error.message.includes('Too many') || error.message.includes('rate limit')) {
          setError('Too many password reset requests. Please wait a few minutes before trying again.');
        } else if (error.message.includes('not found') || error.message.includes('invalid')) {
          // Don't reveal if email exists for security
          setSuccess(true);
        } else {
          setError(error.message);
        }
      } else {
        setSuccess(true);
      }

    } catch (err: any) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle2 className="h-8 w-8 text-green-600" />
          </div>
          <CardTitle className="text-green-600 text-xl">Check Your Email</CardTitle>
          <CardDescription className="text-gray-600 mt-2">
            We've sent a password reset link to:
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-gray-50 rounded-lg p-3 text-center">
            <p className="font-medium text-gray-800">{email}</p>
          </div>
          
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
            <h4 className="font-medium text-blue-800 mb-2">What's next?</h4>
            <ol className="text-sm text-blue-700 space-y-2">
              <li className="flex items-start gap-2">
                <span className="bg-blue-200 text-blue-800 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold flex-shrink-0">1</span>
                <span>Check your email inbox (and spam folder)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="bg-blue-200 text-blue-800 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold flex-shrink-0">2</span>
                <span>Click the reset link in the email</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="bg-blue-200 text-blue-800 rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold flex-shrink-0">3</span>
                <span>Create your new password</span>
              </li>
            </ol>
          </div>

          <p className="text-xs text-gray-500 text-center">
            The link will expire in 1 hour for security reasons.
          </p>

          <Button onClick={onBack} variant="outline" className="w-full">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Sign In
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md shadow-xl">
      <CardHeader className="text-center pb-2">
        <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mb-4 shadow-lg">
          <Mail className="h-8 w-8 text-white" />
        </div>
        <CardTitle className="text-2xl font-bold text-gray-800">Forgot Password?</CardTitle>
        <CardDescription className="text-gray-600 mt-2">
          No worries! Enter your email address and we'll send you a link to reset your password.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium text-gray-700">
              Email Address
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError('');
                }}
                placeholder="Enter your email address"
                className="pl-10 h-11"
                required
                autoComplete="email"
                autoFocus
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-start gap-2">
              <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <Button 
            type="submit" 
            className="w-full h-11 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium shadow-lg shadow-blue-500/25" 
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Sending Reset Link...
              </>
            ) : (
              <>
                <Send className="mr-2 h-5 w-5" />
                Send Reset Link
              </>
            )}
          </Button>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-gray-500">or</span>
            </div>
          </div>

          <Button 
            type="button" 
            variant="outline" 
            onClick={onBack} 
            className="w-full h-11"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Sign In
          </Button>
        </form>

        <div className="mt-6 bg-gray-50 rounded-lg p-4">
          <h4 className="font-medium text-gray-700 text-sm mb-2">Need help?</h4>
          <p className="text-xs text-gray-500">
            If you don't receive an email within a few minutes, check your spam folder. 
            If you still need help, contact our support team.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
