import React, { useState, useEffect } from 'react';
import { Shield, ShieldCheck, ShieldAlert } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { securityService } from '@/utils/securityService';

interface SSLStatusProps {
  domain?: string;
  showDetails?: boolean;
}

export const SSLStatus: React.FC<SSLStatusProps> = ({ 
  domain = window.location.hostname, 
  showDetails = false 
}) => {
  const [sslStatus, setSSLStatus] = useState<'checking' | 'valid' | 'invalid'>('checking');
  const [isSecure, setIsSecure] = useState(false);

  useEffect(() => {
    checkSSLStatus();
  }, [domain]);

  const checkSSLStatus = async () => {
    setIsSecure(window.location.protocol === 'https:');
    
    if (domain && domain !== 'localhost' && domain !== '127.0.0.1') {
      try {
        const isValid = await securityService.checkSSLCertificate(domain);
        setSSLStatus(isValid ? 'valid' : 'invalid');
      } catch {
        setSSLStatus('invalid');
      }
    } else {
      setSSLStatus('valid'); // Local development
    }
  };

  const getStatusIcon = () => {
    if (sslStatus === 'checking') return <Shield className="w-4 h-4" />;
    if (sslStatus === 'valid' && isSecure) return <ShieldCheck className="w-4 h-4 text-green-600" />;
    return <ShieldAlert className="w-4 h-4 text-red-600" />;
  };

  const getStatusText = () => {
    if (sslStatus === 'checking') return 'Checking...';
    if (sslStatus === 'valid' && isSecure) return 'Secure';
    return 'Not Secure';
  };

  const getStatusColor = () => {
    if (sslStatus === 'checking') return 'secondary';
    if (sslStatus === 'valid' && isSecure) return 'default';
    return 'destructive';
  };

  if (!showDetails && sslStatus === 'valid' && isSecure) {
    return null; // Don't show anything if secure and not showing details
  }

  return (
    <div className="flex items-center gap-2">
      {getStatusIcon()}
      <Badge variant={getStatusColor() as any} className="text-xs">
        {getStatusText()}
      </Badge>
      {showDetails && (
        <span className="text-xs text-muted-foreground">
          {isSecure ? 'HTTPS' : 'HTTP'} • {domain}
        </span>
      )}
    </div>
  );
};