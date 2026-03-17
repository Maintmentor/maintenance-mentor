import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import TwoFactorVerification from './TwoFactorVerification';


interface SignInFormProps {
  onToggleForm: () => void;
  onForgotPassword: () => void;
  onSuccess?: () => void;
}


export const SignInForm: React.FC<SignInFormProps> = ({ onToggleForm, onForgotPassword, onSuccess }) => {

  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [show2FA, setShow2FA] = useState(false);

  const { signInWith2FA, requires2FA, set2FARequired } = useAuth();


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { error } = await signInWith2FA(formData.email, formData.password);
      
      if (error) {
        if (error.message === '2FA_REQUIRED') {
          setShow2FA(true);
        } else if (error.message.includes('Invalid login credentials')) {
          setError('Invalid email or password');
        } else if (error.message.includes('Email not confirmed')) {
          setError('Please check your email and verify your account before signing in');
        } else if (error.message?.includes('Failed to fetch') || error.message?.includes('NetworkError')) {
          setError('Unable to connect to the server. Please check your internet connection and try again.');
        } else {
          setError(error.message);
        }
      } else {
        // Successful sign in without 2FA - close modal and redirect to home
        if (onSuccess) onSuccess();
        setTimeout(() => navigate('/'), 100);
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };



  const handle2FAVerification = async (totpCode?: string, backupCode?: string) => {
    setLoading(true);
    setError('');

    try {
      const { error } = await signInWith2FA(formData.email, formData.password, totpCode, backupCode);
      
      if (error) {
        setError(error.message);
      } else {
        setShow2FA(false);
        set2FARequired(false);
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handle2FASuccess = () => {
    setShow2FA(false);
    set2FARequired(false);
    // Close modal and redirect to home page after successful 2FA verification
    if (onSuccess) onSuccess();
    setTimeout(() => navigate('/'), 100);
  };



  const handle2FACancel = () => {
    setShow2FA(false);
    set2FARequired(false);
  };

  if (show2FA || requires2FA) {
    return (
      <TwoFactorVerification
        onVerificationSuccess={handle2FASuccess}
        onCancel={handle2FACancel}
      />
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Welcome Back</CardTitle>
        <CardDescription>Sign in to your Maintenance Mentor account</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                required
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          {error && (
            <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
              {error}
            </div>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Sign In
          </Button>

          <div className="flex flex-col space-y-2 text-center">
            <Button type="button" variant="link" onClick={onForgotPassword}>
              Forgot your password?
            </Button>
            <Button type="button" variant="link" onClick={onToggleForm}>
              Don't have an account? Sign up
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};