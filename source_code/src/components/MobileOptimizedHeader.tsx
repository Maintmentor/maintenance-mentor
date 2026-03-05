import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Menu, Bell, Camera, Wifi, WifiOff } from 'lucide-react';
import { useServiceWorker } from '@/hooks/useServiceWorker';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

interface MobileOptimizedHeaderProps {
  onCameraClick?: () => void;
  onNotificationClick?: () => void;
}

const MobileOptimizedHeader: React.FC<MobileOptimizedHeaderProps> = ({
  onCameraClick,
  onNotificationClick
}) => {
  const { isOnline, updateAvailable, updateApp } = useServiceWorker();

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200">
      <div className="flex items-center justify-between px-4 py-3">
        {/* Logo and Status */}
        <div className="flex items-center gap-3">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="sm" className="p-2">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-80">
              <div className="space-y-4 py-4">
                <div className="px-3 py-2">
                  <h2 className="mb-2 px-4 text-lg font-semibold">Menu</h2>
                  <div className="space-y-1">
                    <Button variant="ghost" className="w-full justify-start">
                      Dashboard
                    </Button>
                    <Button variant="ghost" className="w-full justify-start">
                      Repair History
                    </Button>
                    <Button variant="ghost" className="w-full justify-start">
                      Maintenance
                    </Button>
                    <Button variant="ghost" className="w-full justify-start">
                      Parts Tracker
                    </Button>
                    <Button variant="ghost" className="w-full justify-start">
                      Analytics
                    </Button>
                  </div>
                </div>
              </div>
            </SheetContent>
          </Sheet>
          
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold text-blue-600">Maintenance Mentor</h1>
            {!isOnline && (
              <Badge variant="secondary" className="text-xs">
                <WifiOff className="mr-1 h-3 w-3" />
                Offline
              </Badge>
            )}
            {isOnline && (
              <Wifi className="h-4 w-4 text-green-500" />
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {updateAvailable && (
            <Button
              size="sm"
              variant="outline"
              onClick={updateApp}
              className="text-xs"
            >
              Update
            </Button>
          )}
          
          <Button
            variant="ghost"
            size="sm"
            onClick={onCameraClick}
            className="p-2"
          >
            <Camera className="h-5 w-5" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={onNotificationClick}
            className="p-2 relative"
          >
            <Bell className="h-5 w-5" />
            <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs">
              3
            </Badge>
          </Button>
        </div>
      </div>
    </header>
  );
};

export default MobileOptimizedHeader;