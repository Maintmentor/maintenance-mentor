import React from 'react';
import { Waves, Thermometer, TestTube, Brush } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface PoolService {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  estimatedTime: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
}

const poolServices: PoolService[] = [
  {
    id: 'chemical-balance',
    title: 'Chemical Balancing',
    description: 'Test and adjust pH, chlorine, alkalinity, and calcium hardness levels',
    icon: TestTube,
    estimatedTime: '30 min',
    difficulty: 'Easy'
  },
  {
    id: 'cleaning',
    title: 'Pool Cleaning',
    description: 'Vacuum pool floor, brush walls, empty skimmer baskets',
    icon: Brush,
    estimatedTime: '45 min',
    difficulty: 'Easy'
  },
  {
    id: 'equipment-check',
    title: 'Equipment Inspection',
    description: 'Check pump, filter, heater, and automation systems',
    icon: Waves,
    estimatedTime: '20 min',
    difficulty: 'Medium'
  },
  {
    id: 'temperature',
    title: 'Temperature Control',
    description: 'Adjust heater settings and check thermal efficiency',
    icon: Thermometer,
    estimatedTime: '15 min',
    difficulty: 'Easy'
  }
];

interface PoolMaintenanceCardProps {
  onServiceSelect: (service: PoolService) => void;
}

const PoolMaintenanceCard: React.FC<PoolMaintenanceCardProps> = ({ onServiceSelect }) => {
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy': return 'text-green-600 bg-green-100';
      case 'Medium': return 'text-yellow-600 bg-yellow-100';
      case 'Hard': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {poolServices.map((service) => {
        const IconComponent = service.icon;
        return (
          <Card key={service.id} className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <IconComponent className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-lg">{service.title}</CardTitle>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-sm text-gray-500">{service.estimatedTime}</span>
                    <span className={`text-xs px-2 py-1 rounded-full ${getDifficultyColor(service.difficulty)}`}>
                      {service.difficulty}
                    </span>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <CardDescription className="mb-4">{service.description}</CardDescription>
              <Button 
                onClick={() => onServiceSelect(service)}
                className="w-full"
                variant="outline"
              >
                Start Service
              </Button>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default PoolMaintenanceCard;