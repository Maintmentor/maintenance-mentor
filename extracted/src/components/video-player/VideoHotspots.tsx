import React, { useState } from 'react';
import { Target, Wrench, Settings, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Hotspot {
  id: string;
  timestamp: number;
  x: number; // percentage from left
  y: number; // percentage from top
  title: string;
  description: string;
  toolName?: string;
  toolImage?: string;
  type: 'tool' | 'part' | 'technique' | 'warning';
}

interface VideoHotspotsProps {
  currentTime: number;
  videoId: string;
  isVisible: boolean;
}

export const VideoHotspots: React.FC<VideoHotspotsProps> = ({ 
  currentTime, 
  videoId, 
  isVisible 
}) => {
  const [selectedHotspot, setSelectedHotspot] = useState<Hotspot | null>(null);
  
  // Sample hotspots data
  const hotspots: Hotspot[] = [
    {
      id: '1',
      timestamp: 45,
      x: 35,
      y: 40,
      title: 'Brake Cable Tension Tool',
      description: 'This specialized tool helps maintain proper cable tension during brake adjustments.',
      toolName: 'Cable Tension Gauge',
      type: 'tool'
    },
    {
      id: '2',
      timestamp: 120,
      x: 60,
      y: 30,
      title: 'Brake Pad Alignment',
      description: 'Notice how the brake pad aligns perfectly with the rim surface.',
      type: 'technique'
    },
    {
      id: '3',
      timestamp: 180,
      x: 25,
      y: 55,
      title: 'Safety Warning',
      description: 'Always check that the brake cable is properly secured before testing.',
      type: 'warning'
    },
    {
      id: '4',
      timestamp: 240,
      x: 70,
      y: 45,
      title: 'Brake Lever',
      description: 'The brake lever should have 2-3cm of travel before engaging.',
      type: 'part'
    }
  ];

  const getHotspotIcon = (type: string) => {
    switch (type) {
      case 'tool': return <Wrench className="w-3 h-3" />;
      case 'part': return <Settings className="w-3 h-3" />;
      case 'technique': return <Target className="w-3 h-3" />;
      case 'warning': return <Info className="w-3 h-3" />;
      default: return <Target className="w-3 h-3" />;
    }
  };

  const getHotspotColor = (type: string) => {
    switch (type) {
      case 'tool': return 'bg-blue-500 hover:bg-blue-600';
      case 'part': return 'bg-green-500 hover:bg-green-600';
      case 'technique': return 'bg-purple-500 hover:bg-purple-600';
      case 'warning': return 'bg-red-500 hover:bg-red-600';
      default: return 'bg-gray-500 hover:bg-gray-600';
    }
  };

  // Filter hotspots that should be visible at current time (±2 seconds)
  const visibleHotspots = hotspots.filter(hotspot => 
    Math.abs(hotspot.timestamp - currentTime) <= 2
  );

  if (!isVisible) return null;

  return (
    <div className="absolute inset-0 pointer-events-none">
      {/* Hotspot Markers */}
      {visibleHotspots.map((hotspot) => (
        <div
          key={hotspot.id}
          className="absolute pointer-events-auto"
          style={{
            left: `${hotspot.x}%`,
            top: `${hotspot.y}%`,
            transform: 'translate(-50%, -50%)'
          }}
        >
          <Button
            size="sm"
            className={`w-8 h-8 rounded-full p-0 text-white shadow-lg animate-pulse ${getHotspotColor(hotspot.type)}`}
            onClick={() => setSelectedHotspot(hotspot)}
          >
            {getHotspotIcon(hotspot.type)}
          </Button>
          
          {/* Ripple effect */}
          <div className={`absolute inset-0 rounded-full animate-ping ${getHotspotColor(hotspot.type)} opacity-20`} />
        </div>
      ))}

      {/* Hotspot Details Modal */}
      {selectedHotspot && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center pointer-events-auto">
          <Card className="w-80 max-w-sm mx-4">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                {getHotspotIcon(selectedHotspot.type)}
                {selectedHotspot.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600">
                {selectedHotspot.description}
              </p>
              
              {selectedHotspot.toolName && (
                <div className="bg-gray-50 p-3 rounded-lg">
                  <h4 className="font-medium text-sm mb-1">Tool Information</h4>
                  <p className="text-sm text-gray-600">{selectedHotspot.toolName}</p>
                </div>
              )}

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedHotspot(null)}
                >
                  Close
                </Button>
                <Button size="sm">
                  Learn More
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Hotspot Legend */}
      {visibleHotspots.length > 0 && (
        <div className="absolute top-4 left-4 bg-black bg-opacity-75 text-white p-3 rounded-lg pointer-events-auto">
          <h4 className="text-sm font-medium mb-2">Interactive Elements</h4>
          <div className="space-y-1 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full" />
              <span>Tools</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full" />
              <span>Parts</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-purple-500 rounded-full" />
              <span>Techniques</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-full" />
              <span>Warnings</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};