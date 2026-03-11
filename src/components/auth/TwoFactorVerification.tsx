import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, Smartphone, Key, AlertTriangle } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface TwoFactorVerificationProps {
  onVerificationSuccess: () => void;
  onCancel?: () => void;
}

export default function TwoFactorVerification({ 
  onVerificationSuccess, 
  onCancel 
}: TwoFactorVerificationProps) {
  const [totpCode, setTotpCode] = useState('');
  const [backupCode, setBackupCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('totp');

  const verifyTOTP = async () => {
    if (!totpCode) return;
    
    setLoading(true);
    setError('');
    
    try {
      const { data, error } = await supabase.functions.invoke('totp-manager', {
        body: { 
          action: 'verify_totp',
          token: totpCode
        }
      });

      if (error) throw error;
      
      if (data.success) {
        onVerificationSuccess();
      } else {
        setError('Invalid verification code. Please try again.');
      }
    } catch (err: any) {
      setError(err.message || 'Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const verifyBackupCode = async () => {
    if (!backupCode) return;
    
    setLoading(true);
    setError('');
    
    try {
      const { data, error } = await supabase.functions.invoke('totp-manager', {
        body: { 
          action: 'verify_backup_code',
          code: backupCode
        }
      });

      if (error) throw error;
      
      if (data.success) {
        onVerificationSuccess();
      } else {
        setError('Invalid backup code. Please try again.');
      }
    } catch (err: any) {
      setError(err.message || 'Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent, action: () => void) => {
    if (e.key === 'Enter') {
      action();
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
          <Shield className="w-6 h-6 text-primary" />
        </div>
        <CardTitle>Two-Factor Authentication</CardTitle>
        <CardDescription>
          Please verify your identity to continue
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="totp" className="flex items-center gap-2">
              <Smartphone className="w-4 h-4" />
              Authenticator
            </TabsTrigger>
            <TabsTrigger value="backup" className="flex items-center gap-2">
              <Key className="w-4 h-4" />
              Backup Code
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="totp" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="totp">Enter verification code</Label>
              <Input
                id="totp"
                value={totpCode}
                onChange={(e) => setTotpCode(e.target.value)}
                placeholder="000000"
                maxLength={6}
                className="text-center text-lg font-mono"
                onKeyPress={(e) => handleKeyPress(e, verifyTOTP)}
                autoFocus
              />
              <p className="text-sm text-muted-foreground">
                Enter the 6-digit code from your authenticator app
              </p>
            </div>
            
            <Button 
              onClick={verifyTOTP}
              disabled={loading || !totpCode || totpCode.length !== 6}
              className="w-full"
            >
              {loading ? 'Verifying...' : 'Verify Code'}
            </Button>
          </TabsContent>
          
          <TabsContent value="backup" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="backup">Enter backup code</Label>
              <Input
                id="backup"
                value={backupCode}
                onChange={(e) => setBackupCode(e.target.value.toUpperCase())}
                placeholder="XXXXXXXX"
                maxLength={8}
                className="text-center text-lg font-mono"
                onKeyPress={(e) => handleKeyPress(e, verifyBackupCode)}
              />
              <p className="text-sm text-muted-foreground">
                Enter one of your backup recovery codes
              </p>
            </div>
            
            <Button 
              onClick={verifyBackupCode}
              disabled={loading || !backupCode || backupCode.length !== 8}
              className="w-full"
            >
              {loading ? 'Verifying...' : 'Use Backup Code'}
            </Button>
          </TabsContent>
        </Tabs>

        {error && (
          <Alert variant="destructive" className="mt-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {onCancel && (
          <div className="mt-4 pt-4 border-t">
            <Button 
              onClick={onCancel}
              variant="ghost"
              className="w-full"
              disabled={loading}
            >
              Cancel
            </Button>
          </div>
        )}

        <div className="mt-4 text-center">
          <p className="text-sm text-muted-foreground">
            Having trouble? Use a backup code or contact support.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}