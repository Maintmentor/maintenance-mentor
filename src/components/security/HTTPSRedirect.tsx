import React, { useEffect, useState } from 'react';
import { AlertTriangle, Shield } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

export const HTTPSRedirect: React.FC = () => {
  const [showWarning, setShowWarning] = useState(false);

  useEffect(() => {
    // Check if we're on HTTP in production
    if (typeof window !== 'undefined' && 
        window.location.protocol === 'http:' && 
        window.location.hostname !== 'localhost' && 
        window.location.hostname !== '127.0.0.1') {
      setShowWarning(true);
    }
  }, []);

  const redirectToHTTPS = () => {
    if (typeof window !== 'undefined') {
      const httpsUrl = window.location.href.replace('http://', 'https://');
      window.location.replace(httpsUrl);
    }
  };

  if (!showWarning) return null;

  return (
    <Alert className="mb-4 border-orange-200 bg-orange-50">
      <AlertTriangle className="h-4 w-4 text-orange-600" />
      <AlertDescription className="flex items-center justify-between">
        <span className="text-orange-800">
          This site is not secure. For your safety, please switch to HTTPS.
        </span>
        <Button 
          onClick={redirectToHTTPS}
          size="sm"
          className="ml-4 bg-orange-600 hover:bg-orange-700"
        >
          <Shield className="w-4 h-4 mr-2" />
          Switch to HTTPS
        </Button>
      </AlertDescription>
    </Alert>
  );
};