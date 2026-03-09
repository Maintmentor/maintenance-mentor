import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Wifi, WifiOff } from 'lucide-react';

interface OfflineAnalysisIndicatorProps {
  isOffline: boolean;
  analysisMode: 'ai' | 'fallback';
}

const OfflineAnalysisIndicator: React.FC<OfflineAnalysisIndicatorProps> = ({ 
  isOffline, 
  analysisMode 
}) => {
  if (analysisMode === 'ai' && !isOffline) {
    return (
      <Alert className="bg-green-50 border-green-200">
        <Wifi className="h-4 w-4 text-green-600" />
        <AlertDescription className="text-green-700">
          Using AI-powered analysis with OpenAI Vision API
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Alert className="bg-blue-50 border-blue-200">
      <WifiOff className="h-4 w-4 text-blue-600" />
      <AlertDescription className="text-blue-700">
        {isOffline 
          ? "You're offline. Using local pattern-based analysis."
          : "OpenAI API unavailable. Using fallback analysis based on common repair patterns."
        }
      </AlertDescription>
    </Alert>
  );
};

export default OfflineAnalysisIndicator;