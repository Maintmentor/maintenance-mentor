import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, CheckCircle2, XCircle, Eye, EyeOff, Lock, ArrowLeft, Shield } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

export default function ResetPassword() {
  const navigate = useNavigate();
  const { user, isPasswordRecovery, updatePassword, session } = useAuth();
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [canReset, setCanReset] = useState(false);

  useEffect(() => {
    // Check if user arrived via password reset link
    // Supabase will have already processed the token and signed the user in
    const checkResetStatus = async () => {
      // Give Supabase a moment to process the auth state
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Check URL hash for recovery token (Supabase puts tokens in hash)
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const accessToken = hashParams.get('access_token');
      const type = hashParams.get('type');
      
      console.log('Reset password check:', { 
        hasUser: !!user, 
        isPasswordRecovery, 
        hasSession: !!session,
        type,
        hasAccessToken: !!accessToken
      });
      
      // User can reset if:
      // 1. They're in password recovery mode (detected by auth state change)
      // 2. They have a session and came from a recovery link (type=recovery in hash)
      // 3. They have a valid session (for manual password changes)
      if (isPasswordRecovery || type === 'recovery' || (session && user)) {
        setCanReset(true);
      } else if (!session && !accessToken) {
        // No session and no token - invalid access
        setError('Invalid or expired password reset link. Please request a new one.');
        setCanReset(false);
      }
      
      setInitializing(false);
    };
    
    checkResetStatus();
  }, [user, isPasswordRecovery, session]);

  const calculatePasswordStrength = (pwd: string): number => {
    let strength = 0;
    if (pwd.length >= 8) strength += 25;
    if (pwd.length >= 12) strength += 25;
    if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) strength += 25;
    if (/\d/.test(pwd)) strength += 15;
    if (/[^a-zA-Z0-9]/.test(pwd)) strength += 10;
    return Math.min(strength, 100);
  };

  const getStrengthLabel = (strength: number): { label: string; color: string } => {
    if (strength < 25) return { label: 'Very Weak', color: 'bg-red-500' };
    if (strength < 50) return { label: 'Weak', color: 'bg-orange-500' };
    if (strength < 75) return { label: 'Good', color: 'bg-yellow-500' };
    return { label: 'Strong', color: 'bg-green-500' };
  };

  const getPasswordFeedback = (pwd: string): { text: string; met: boolean }[] => {
    return [
      { text: 'At least 8 characters', met: pwd.length >= 8 },
      { text: 'One lowercase letter', met: /[a-z]/.test(pwd) },
      { text: 'One uppercase letter', met: /[A-Z]/.test(pwd) },
      { text: 'One number', met: /\d/.test(pwd) },
      { text: 'One special character', met: /[^a-zA-Z0-9]/.test(pwd) },
    ];
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    const strength = calculatePasswordStrength(password);
    if (strength < 50) {
      setError('Please choose a stronger password');
      return;
    }

    setLoading(true);

    try {
      const { error } = await updatePassword(password);

      if (error) {
        throw new Error(error.message || 'Failed to reset password');
      }

      setSuccess(true);
      
      // Redirect to home after success
      setTimeout(() => {
        navigate('/');
      }, 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to reset password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const strength = calculatePasswordStrength(password);
  const strengthInfo = getStrengthLabel(strength);
  const feedback = getPasswordFeedback(password);

  // Loading state
  if (initializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
        <Card className="w-full max-w-md shadow-xl">
          <CardContent className="pt-8 pb-8 text-center">
            <div className="relative">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-16 h-16 border-4 border-blue-200 rounded-full"></div>
              </div>
              <Loader2 className="h-16 w-16 animate-spin mx-auto text-blue-600 relative z-10" />
            </div>
            <p className="mt-6 text-gray-600 font-medium">Verifying your reset link...</p>
            <p className="mt-2 text-sm text-gray-500">This will only take a moment</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Invalid/expired token state
  if (!canReset && error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 p-4">
        <Card className="w-full max-w-md shadow-xl">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
            <CardTitle className="text-red-600 text-xl">Link Expired</CardTitle>
            <CardDescription className="text-gray-600 mt-2">
              {error}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              onClick={() => navigate('/')} 
              className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Return to Home
            </Button>
            <p className="text-center text-sm text-gray-500">
              Need a new reset link?{' '}
              <button 
                onClick={() => navigate('/')}
                className="text-blue-600 hover:underline font-medium"
              >
                Request one here
              </button>
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Success state
  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 p-4">
        <Card className="w-full max-w-md shadow-xl">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4 animate-bounce">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <CardTitle className="text-green-600 text-xl">Password Updated!</CardTitle>
            <CardDescription className="text-gray-600 mt-2">
              Your password has been successfully changed. You can now sign in with your new password.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Redirecting to home...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Password reset form
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mb-4 shadow-lg">
            <Lock className="h-8 w-8 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-800">Create New Password</CardTitle>
          <CardDescription className="text-gray-600 mt-2">
            Choose a strong password to secure your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* New Password Field */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                New Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your new password"
                  className="pr-10 h-11"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              
              {/* Password Strength Indicator */}
              {password && (
                <div className="space-y-3 mt-3">
                  <div className="flex items-center gap-3">
                    <Progress value={strength} className="flex-1 h-2" />
                    <span className={`text-xs font-medium px-2 py-1 rounded ${
                      strength < 50 ? 'bg-red-100 text-red-700' : 
                      strength < 75 ? 'bg-yellow-100 text-yellow-700' : 
                      'bg-green-100 text-green-700'
                    }`}>
                      {strengthInfo.label}
                    </span>
                  </div>
                  
                  {/* Password Requirements */}
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs font-medium text-gray-600 mb-2">Password requirements:</p>
                    <ul className="grid grid-cols-1 gap-1">
                      {feedback.map((item, i) => (
                        <li key={i} className="flex items-center gap-2 text-xs">
                          {item.met ? (
                            <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                          ) : (
                            <div className="h-3.5 w-3.5 rounded-full border-2 border-gray-300" />
                          )}
                          <span className={item.met ? 'text-green-700' : 'text-gray-500'}>
                            {item.text}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>

            {/* Confirm Password Field */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
                Confirm Password
              </Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your new password"
                  className={`pr-10 h-11 ${
                    confirmPassword && password !== confirmPassword 
                      ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
                      : confirmPassword && password === confirmPassword
                      ? 'border-green-300 focus:border-green-500 focus:ring-green-500'
                      : ''
                  }`}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {confirmPassword && password !== confirmPassword && (
                <p className="text-xs text-red-600 flex items-center gap-1">
                  <XCircle className="h-3 w-3" />
                  Passwords do not match
                </p>
              )}
              {confirmPassword && password === confirmPassword && (
                <p className="text-xs text-green-600 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Passwords match
                </p>
              )}
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-start gap-2">
                <XCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Submit Button */}
            <Button 
              type="submit" 
              className="w-full h-11 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium shadow-lg shadow-blue-500/25 transition-all duration-200" 
              disabled={loading || strength < 50 || password !== confirmPassword}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Updating Password...
                </>
              ) : (
                <>
                  <Shield className="mr-2 h-5 w-5" />
                  Update Password
                </>
              )}
            </Button>

            {/* Security Note */}
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 mt-4">
              <div className="flex items-start gap-2">
                <Shield className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-blue-700">
                  <strong>Security tip:</strong> Use a unique password that you don't use for other accounts. Consider using a password manager.
                </p>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
