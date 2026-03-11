import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Wifi, WifiOff, Download } from 'lucide-react';
import { useServiceWorker } from '@/hooks/useServiceWorker';

const OfflineIndicator: React.FC = () => {
  const { isOnline } = useServiceWorker();

  return (
    <div className="fixed bottom-20 left-4 right-4 z-40 md:left-auto md:right-4 md:max-w-xs">
      {!isOnline && (
        <Alert className="border-orange-200 bg-orange-50 shadow-lg">
          <WifiOff className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <div>
              <div className="font-medium">You're offline</div>
              <div className="text-sm text-gray-600">
                Using cached content
              </div>
            </div>
            <Badge variant="secondary" className="ml-2">
              <Download className="mr-1 h-3 w-3" />
              Cached
            </Badge>
          </AlertDescription>
        </Alert>
      )}
      
      {isOnline && (
        <div className="fixed top-4 right-4 z-50">
          <Badge variant="outline" className="bg-green-50 border-green-200">
            <Wifi className="mr-1 h-3 w-3 text-green-600" />
            Online
          </Badge>
        </div>
      )}
    </div>
  );
};

export default OfflineIndicator;