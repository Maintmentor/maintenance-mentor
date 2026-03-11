import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Shield, Smartphone, Key, Download, AlertTriangle, CheckCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface TwoFactorSetupProps {
  onSetupComplete?: () => void;
}

export default function TwoFactorSetup({ onSetupComplete }: TwoFactorSetupProps) {
  const [status, setStatus] = useState({
    isEnabled: false,
    isMandatory: false,
    backupCodesCount: 0,
    lastUsedAt: null,
    recoveryCodesGeneratedAt: null
  });
  const [setupData, setSetupData] = useState<{
    secret: string;
    qrCode: string;
    manualEntryKey: string;
  } | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showBackupCodes, setShowBackupCodes] = useState(false);

  useEffect(() => {
    loadStatus();
  }, []);

  const loadStatus = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('totp-manager', {
        body: { action: 'get_2fa_status' }
      });

      if (error) throw error;
      setStatus(data);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const startSetup = async () => {
    setLoading(true);
    setError('');
    
    try {
      const { data, error } = await supabase.functions.invoke('totp-manager', {
        body: { action: 'setup_totp' }
      });

      if (error) throw error;
      setSetupData(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const verifySetup = async () => {
    if (!verificationCode || !setupData) return;
    
    setLoading(true);
    setError('');
    
    try {
      const { data, error } = await supabase.functions.invoke('totp-manager', {
        body: { 
          action: 'verify_setup',
          token: verificationCode
        }
      });

      if (error) throw error;
      
      setBackupCodes(data.backupCodes);
      setShowBackupCodes(true);
      setSuccess('2FA has been successfully enabled!');
      setSetupData(null);
      setVerificationCode('');
      await loadStatus();
      onSetupComplete?.();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const generateNewBackupCodes = async () => {
    setLoading(true);
    setError('');
    
    try {
      const { data, error } = await supabase.functions.invoke('totp-manager', {
        body: { action: 'generate_backup_codes' }
      });

      if (error) throw error;
      
      setBackupCodes(data.backupCodes);
      setShowBackupCodes(true);
      setSuccess('New backup codes generated successfully!');
      await loadStatus();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const disable2FA = async () => {
    setLoading(true);
    setError('');
    
    try {
      const { data, error } = await supabase.functions.invoke('totp-manager', {
        body: { action: 'disable_2fa' }
      });

      if (error) throw error;
      
      setSuccess('2FA has been disabled successfully!');
      await loadStatus();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const downloadBackupCodes = () => {
    const content = backupCodes.join('\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'backup-codes.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Two-Factor Authentication
          </CardTitle>
          <CardDescription>
            Add an extra layer of security to your account with TOTP-based 2FA
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span>Status:</span>
              <Badge variant={status.isEnabled ? 'default' : 'secondary'}>
                {status.isEnabled ? 'Enabled' : 'Disabled'}
              </Badge>
              {status.isMandatory && (
                <Badge variant="destructive">Mandatory</Badge>
              )}
            </div>
            {status.isEnabled && (
              <span className="text-sm text-muted-foreground">
                Backup codes: {status.backupCodesCount}
              </span>
            )}
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}

          {!status.isEnabled ? (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Enable 2FA to secure your account with time-based one-time passwords (TOTP).
              </p>
              <Button onClick={startSetup} disabled={loading}>
                <Smartphone className="w-4 h-4 mr-2" />
                Enable 2FA
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button 
                  onClick={generateNewBackupCodes}
                  disabled={loading}
                  variant="outline"
                >
                  <Key className="w-4 h-4 mr-2" />
                  Generate New Backup Codes
                </Button>
                
                {!status.isMandatory && (
                  <Button 
                    onClick={disable2FA}
                    disabled={loading}
                    variant="destructive"
                  >
                    Disable 2FA
                  </Button>
                )}
              </div>
              
              {status.lastUsedAt && (
                <p className="text-sm text-muted-foreground">
                  Last used: {new Date(status.lastUsedAt).toLocaleString()}
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {setupData && (
        <Card>
          <CardHeader>
            <CardTitle>Setup Authenticator App</CardTitle>
            <CardDescription>
              Scan the QR code or enter the secret key manually in your authenticator app
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="qr" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="qr">QR Code</TabsTrigger>
                <TabsTrigger value="manual">Manual Entry</TabsTrigger>
              </TabsList>
              
              <TabsContent value="qr" className="space-y-4">
                <div className="flex justify-center">
                  <img 
                    src={setupData.qrCode} 
                    alt="2FA QR Code"
                    className="border rounded-lg"
                  />
                </div>
                <p className="text-sm text-muted-foreground text-center">
                  Scan this QR code with your authenticator app
                </p>
              </TabsContent>
              
              <TabsContent value="manual" className="space-y-4">
                <div className="space-y-2">
                  <Label>Secret Key</Label>
                  <div className="flex gap-2">
                    <Input 
                      value={setupData.manualEntryKey} 
                      readOnly 
                      className="font-mono"
                    />
                    <Button
                      onClick={() => navigator.clipboard.writeText(setupData.manualEntryKey)}
                      variant="outline"
                    >
                      Copy
                    </Button>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  Enter this key manually in your authenticator app
                </p>
              </TabsContent>
            </Tabs>

            <div className="space-y-4 mt-6">
              <div className="space-y-2">
                <Label htmlFor="verification">Verification Code</Label>
                <Input
                  id="verification"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  placeholder="Enter 6-digit code"
                  maxLength={6}
                />
              </div>
              <Button 
                onClick={verifySetup}
                disabled={loading || !verificationCode}
                className="w-full"
              >
                Verify and Enable 2FA
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Dialog open={showBackupCodes} onOpenChange={setShowBackupCodes}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Backup Recovery Codes</DialogTitle>
            <DialogDescription>
              Save these codes in a secure location. Each code can only be used once.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2 p-4 bg-muted rounded-lg font-mono text-sm">
              {backupCodes.map((code, index) => (
                <div key={index} className="p-2 bg-background rounded border">
                  {code}
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Button onClick={downloadBackupCodes} className="flex-1">
                <Download className="w-4 h-4 mr-2" />
                Download Codes
              </Button>
              <Button 
                onClick={() => setShowBackupCodes(false)}
                variant="outline"
                className="flex-1"
              >
                I've Saved Them
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}