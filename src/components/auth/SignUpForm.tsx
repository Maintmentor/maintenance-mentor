import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { Eye, EyeOff, Loader2, Zap, CreditCard } from 'lucide-react';
import { calculatePrice } from '@/components/subscription/PricingTiers';
import { isSupabaseConfigured } from '@/lib/supabase';

interface SignUpFormProps {
  onToggleForm: () => void;
  onSuccess?: () => void;
}

export const SignUpForm: React.FC<SignUpFormProps> = ({ onToggleForm, onSuccess }) => {
  const [signupType, setSignupType] = useState<'trial' | 'direct'>('trial');
  const [bedCount, setBedCount] = useState<string>('');
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const { signUp } = useAuth();
  const navigate = useNavigate();

  const monthlyPrice = bedCount ? calculatePrice(parseInt(bedCount)) : 0;

  const validatePassword = (password: string) => {
    const minLength = password.length >= 8;
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    
    return minLength && hasUpper && hasLower && hasNumber && hasSpecial;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!formData.fullName.trim()) {
      setError('Full name is required');
      setLoading(false);
      return;
    }

    if (signupType === 'direct' && (!bedCount || parseInt(bedCount) <= 0)) {
      setError('Please enter your property bed count');
      setLoading(false);
      return;
    }

    if (!validatePassword(formData.password)) {
      setError('Password must be at least 8 characters with uppercase, lowercase, number, and special character');
      setLoading(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (!isSupabaseConfigured) {
      setError('The application is not properly configured. Please contact support.');
      setLoading(false);
      return;
    }

    try {
      const { error } = await signUp(formData.email, formData.password, formData.fullName);
      
      if (error) {
        if (error.message?.includes('Failed to fetch') || error.message?.includes('NetworkError')) {
          setError('Unable to connect to the server. Please check your internet connection and try again.');
        } else {
          setError(error.message);
        }
      } else {
        setSuccess(true);
        if (onSuccess) onSuccess();
        
        if (signupType === 'direct') {
          setTimeout(() => {
            navigate('/dashboard', { 
              state: { 
                showSubscription: true, 
                bedCount: parseInt(bedCount),
                monthlyPrice 
              } 
            });
          }, 2000);
        } else {
          setTimeout(() => {
            navigate('/');
          }, 2000);
        }
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-green-600">
            {signupType === 'trial' ? '🎉 Welcome to Your Free Trial!' : '🎉 Account Created!'}
          </CardTitle>
          <CardDescription>
            We've sent a verification link to {formData.email}. Please check your email and click the link to verify your account.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {signupType === 'trial' ? (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-2">Your 7-Day Free Trial is Active!</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>✓ Full access to all features</li>
                <li>✓ No credit card required</li>
                <li>✓ Cancel anytime</li>
              </ul>
            </div>
          ) : (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="font-semibold text-green-900 mb-2">Complete Your Subscription</h4>
              <p className="text-sm text-green-800">
                Redirecting you to complete payment for ${monthlyPrice.toFixed(2)}/month ({bedCount} beds × $0.50)...

              </p>
            </div>
          )}
          <Button onClick={onToggleForm} variant="outline" className="w-full">
            Back to Sign In
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Create Account</CardTitle>
        <CardDescription>Choose how you'd like to get started</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={signupType} onValueChange={(v) => setSignupType(v as 'trial' | 'direct')} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="trial" className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Free Trial
            </TabsTrigger>
            <TabsTrigger value="direct" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Direct Sign Up
            </TabsTrigger>
          </TabsList>

          <TabsContent value="trial">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <h4 className="font-semibold text-blue-900 mb-2">7-Day Free Trial</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>✓ Full access to all features</li>
                <li>✓ No credit card required</li>
                <li>✓ Cancel anytime</li>
              </ul>
            </div>
            <SignUpFormFields
              formData={formData}
              setFormData={setFormData}
              showPassword={showPassword}
              setShowPassword={setShowPassword}
              error={error}
              loading={loading}
              onSubmit={handleSubmit}
              onToggleForm={onToggleForm}
              buttonText="Start Free Trial"
              showBedCount={false}
              bedCount=""
              setBedCount={() => {}}
            />
          </TabsContent>

          <TabsContent value="direct">
            <SignUpFormFields
              formData={formData}
              setFormData={setFormData}
              showPassword={showPassword}
              setShowPassword={setShowPassword}
              error={error}
              loading={loading}
              onSubmit={handleSubmit}
              onToggleForm={onToggleForm}
              buttonText={bedCount && parseInt(bedCount) > 0 ? `Sign Up & Subscribe ($${monthlyPrice.toFixed(2)}/mo)` : 'Sign Up'}

              showBedCount={true}
              bedCount={bedCount}
              setBedCount={setBedCount}
            />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

interface SignUpFormFieldsProps {
  formData: any;
  setFormData: any;
  showPassword: boolean;
  setShowPassword: any;
  error: string;
  loading: boolean;
  onSubmit: (e: React.FormEvent) => void;
  onToggleForm: () => void;
  buttonText: string;
  showBedCount: boolean;
  bedCount: string;
  setBedCount: (value: string) => void;
}

const SignUpFormFields: React.FC<SignUpFormFieldsProps> = ({
  formData,
  setFormData,
  showPassword,
  setShowPassword,
  error,
  loading,
  onSubmit,
  onToggleForm,
  buttonText,
  showBedCount,
  bedCount,
  setBedCount
}) => {
  const monthlyPrice = bedCount ? calculatePrice(parseInt(bedCount)) : 0;

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {showBedCount && (
        <>
          <div className="space-y-2">
            <Label htmlFor="bedCount">Property Bed Count</Label>
            <Input
              id="bedCount"
              type="number"
              min="1"
              placeholder="Enter total number of beds"
              value={bedCount}
              onChange={(e) => setBedCount(e.target.value)}
              required
            />
          </div>
          {bedCount && parseInt(bedCount) > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                Your monthly subscription: <span className="font-bold text-xl text-blue-600">${monthlyPrice.toFixed(2)}</span>
              </p>
              <p className="text-xs text-blue-600 mt-1">{bedCount} beds × $0.50</p>
            </div>
          )}

        </>
      )}

      <div className="space-y-2">
        <Label htmlFor="fullName">Full Name</Label>
        <Input
          id="fullName"
          type="text"
          value={formData.fullName}
          onChange={(e) => setFormData((prev: any) => ({ ...prev, fullName: e.target.value }))}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData((prev: any) => ({ ...prev, email: e.target.value }))}
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
            onChange={(e) => setFormData((prev: any) => ({ ...prev, password: e.target.value }))}
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

      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirm Password</Label>
        <Input
          id="confirmPassword"
          type="password"
          value={formData.confirmPassword}
          onChange={(e) => setFormData((prev: any) => ({ ...prev, confirmPassword: e.target.value }))}
          required
        />
      </div>

      {error && (
        <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
          {error}
        </div>
      )}

      <Button type="submit" className="w-full" disabled={loading}>
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {buttonText}
      </Button>

      <div className="text-center">
        <Button type="button" variant="link" onClick={onToggleForm}>
          Already have an account? Sign in
        </Button>
      </div>
    </form>
  );
};
