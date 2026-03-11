import React, { useState } from 'react';
import { Calendar, Clock, CheckCircle, AlertTriangle, Droplets, Thermometer } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface PoolReading {
  id: string;
  parameter: string;
  value: number;
  unit: string;
  status: 'good' | 'warning' | 'critical';
  lastUpdated: string;
}

const poolReadings: PoolReading[] = [
  { id: '1', parameter: 'pH Level', value: 7.2, unit: '', status: 'good', lastUpdated: '2 hours ago' },
  { id: '2', parameter: 'Chlorine', value: 1.8, unit: 'ppm', status: 'warning', lastUpdated: '2 hours ago' },
  { id: '3', parameter: 'Temperature', value: 78, unit: '°F', status: 'good', lastUpdated: '1 hour ago' },
  { id: '4', parameter: 'Alkalinity', value: 95, unit: 'ppm', status: 'good', lastUpdated: '2 hours ago' }
];

const PoolServiceDashboard: React.FC = () => {
  const [selectedReading, setSelectedReading] = useState<PoolReading | null>(null);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good': return 'text-green-600 bg-green-100';
      case 'warning': return 'text-yellow-600 bg-yellow-100';
      case 'critical': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'good': return <CheckCircle className="w-4 h-4" />;
      case 'warning': return <AlertTriangle className="w-4 h-4" />;
      case 'critical': return <AlertTriangle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Pool Status Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {poolReadings.map((reading) => (
          <Card key={reading.id} className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => setSelectedReading(reading)}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">{reading.parameter}</CardTitle>
                <Badge className={`${getStatusColor(reading.status)} border-0`}>
                  {getStatusIcon(reading.status)}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {reading.value}{reading.unit}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Updated {reading.lastUpdated}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Service Schedule */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Upcoming Services
          </CardTitle>
          <CardDescription>
            Scheduled maintenance and service appointments
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
              <div>
                <h4 className="font-medium">Weekly Chemical Balance</h4>
                <p className="text-sm text-gray-600">Test and adjust chemical levels</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium">Tomorrow, 10:00 AM</p>
                <Button size="sm" variant="outline">Reschedule</Button>
              </div>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
              <div>
                <h4 className="font-medium">Filter Cleaning</h4>
                <p className="text-sm text-gray-600">Clean and backwash pool filter</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium">Friday, 2:00 PM</p>
                <Button size="sm" variant="outline">Reschedule</Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Equipment Status */}
      <Card>
        <CardHeader>
          <CardTitle>Equipment Status</CardTitle>
          <CardDescription>
            Current status of pool equipment and systems
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Pool Pump</span>
                <Badge className="bg-green-100 text-green-800">Running</Badge>
              </div>
              <Progress value={85} className="h-2" />
              <p className="text-xs text-gray-500">85% efficiency</p>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Heater</span>
                <Badge className="bg-yellow-100 text-yellow-800">Standby</Badge>
              </div>
              <Progress value={0} className="h-2" />
              <p className="text-xs text-gray-500">Target: 78°F</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PoolServiceDashboard;