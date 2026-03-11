import React from 'react';
import { Building, Home, Filter, Droplets } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface WaterSystemService {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  systemType: 'Residential' | 'Commercial' | 'High-Rise';
  urgency: 'Low' | 'Medium' | 'High';
}

const waterSystemServices: WaterSystemService[] = [
  {
    id: 'pressure-system',
    title: 'Pressure System Maintenance',
    description: 'Check pressure tanks, pumps, and pressure switches',
    icon: Droplets,
    systemType: 'High-Rise',
    urgency: 'Medium'
  },
  {
    id: 'filtration',
    title: 'Water Filtration Service',
    description: 'Replace filters, clean sediment tanks, test water quality',
    icon: Filter,
    systemType: 'Residential',
    urgency: 'Low'
  },
  {
    id: 'commercial-systems',
    title: 'Commercial Water Systems',
    description: 'Large-scale water treatment, boiler systems, cooling towers',
    icon: Building,
    systemType: 'Commercial',
    urgency: 'High'
  },
  {
    id: 'domestic-plumbing',
    title: 'Domestic Water Systems',
    description: 'Water heaters, supply lines, backflow prevention',
    icon: Home,
    systemType: 'Residential',
    urgency: 'Medium'
  }
];

interface WaterSystemCardProps {
  onServiceSelect: (service: WaterSystemService) => void;
}

const WaterSystemCard: React.FC<WaterSystemCardProps> = ({ onServiceSelect }) => {
  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'Low': return 'text-green-600 bg-green-100';
      case 'Medium': return 'text-yellow-600 bg-yellow-100';
      case 'High': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getSystemTypeColor = (systemType: string) => {
    switch (systemType) {
      case 'Residential': return 'text-blue-600 bg-blue-100';
      case 'Commercial': return 'text-purple-600 bg-purple-100';
      case 'High-Rise': return 'text-orange-600 bg-orange-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {waterSystemServices.map((service) => {
        const IconComponent = service.icon;
        return (
          <Card key={service.id} className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-cyan-100 rounded-lg">
                  <IconComponent className="w-5 h-5 text-cyan-600" />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-lg">{service.title}</CardTitle>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-xs px-2 py-1 rounded-full ${getSystemTypeColor(service.systemType)}`}>
                      {service.systemType}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded-full ${getUrgencyColor(service.urgency)}`}>
                      {service.urgency} Priority
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
                Schedule Service
              </Button>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default WaterSystemCard;