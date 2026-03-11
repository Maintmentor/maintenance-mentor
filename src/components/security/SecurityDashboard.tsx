import React, { useState, useEffect } from 'react';
import { Shield, ShieldCheck, ShieldAlert, RefreshCw, Globe, Lock } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';

interface SecurityCheck {
  domain: string;
  isValid: boolean;
  status: number;
  statusText: string;
  headers: {
    'strict-transport-security'?: string;
    'content-security-policy'?: string;
    'x-frame-options'?: string;
    'x-content-type-options'?: string;
  };
  checkedAt: string;
}

export const SecurityDashboard: React.FC = () => {
  const [securityCheck, setSecurityCheck] = useState<SecurityCheck | null>(null);
  const [loading, setLoading] = useState(false);
  const [customDomain, setCustomDomain] = useState('');

  const checkSSLCertificate = async (domain?: string) => {
    setLoading(true);
    try {
      const targetDomain = domain || window.location.hostname;
      
      const { data, error } = await supabase.functions.invoke('ssl-certificate-checker', {
        body: { domain: targetDomain }
      });

      if (error) throw error;
      setSecurityCheck(data);
    } catch (error) {
      console.error('SSL check failed:', error);
      setSecurityCheck({
        domain: domain || window.location.hostname,
        isValid: false,
        status: 0,
        statusText: 'Check Failed',
        headers: {},
        checkedAt: new Date().toISOString()
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkSSLCertificate();
  }, []);

  const getSecurityScore = () => {
    if (!securityCheck) return 0;
    
    let score = 0;
    if (securityCheck.isValid) score += 25;
    if (securityCheck.headers['strict-transport-security']) score += 25;
    if (securityCheck.headers['content-security-policy']) score += 25;
    if (securityCheck.headers['x-frame-options']) score += 25;
    
    return score;
  };

  const getScoreColor = (score: number) => {
    if (score >= 75) return 'text-green-600';
    if (score >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            SSL Certificate & Security Status
          </CardTitle>
          <CardDescription>
            Monitor your domain's SSL certificate and security headers
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <input
              type="text"
              placeholder="Enter domain to check (optional)"
              value={customDomain}
              onChange={(e) => setCustomDomain(e.target.value)}
              className="flex-1 px-3 py-2 border rounded-md"
            />
            <Button 
              onClick={() => checkSSLCertificate(customDomain || undefined)}
              disabled={loading}
            >
              {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Check SSL'}
            </Button>
          </div>

          {securityCheck && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4" />
                  <span className="font-medium">{securityCheck.domain}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`font-bold ${getScoreColor(getSecurityScore())}`}>
                    {getSecurityScore()}/100
                  </span>
                  {securityCheck.isValid ? (
                    <ShieldCheck className="w-5 h-5 text-green-600" />
                  ) : (
                    <ShieldAlert className="w-5 h-5 text-red-600" />
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="font-medium flex items-center gap-2">
                    <Lock className="w-4 h-4" />
                    SSL Certificate
                  </h4>
                  <Badge variant={securityCheck.isValid ? 'default' : 'destructive'}>
                    {securityCheck.isValid ? 'Valid' : 'Invalid'}
                  </Badge>
                  <p className="text-sm text-muted-foreground">
                    Status: {securityCheck.status} {securityCheck.statusText}
                  </p>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">Security Headers</h4>
                  <div className="space-y-1">
                    {Object.entries({
                      'HSTS': securityCheck.headers['strict-transport-security'],
                      'CSP': securityCheck.headers['content-security-policy'],
                      'X-Frame-Options': securityCheck.headers['x-frame-options'],
                      'X-Content-Type-Options': securityCheck.headers['x-content-type-options']
                    }).map(([name, value]) => (
                      <div key={name} className="flex items-center gap-2">
                        <Badge variant={value ? 'default' : 'secondary'} className="text-xs">
                          {name}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {value ? '✓' : '✗'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <p className="text-xs text-muted-foreground">
                Last checked: {new Date(securityCheck.checkedAt).toLocaleString()}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};