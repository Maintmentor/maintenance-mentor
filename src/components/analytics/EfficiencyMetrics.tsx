import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Clock, CheckCircle, Target, Star } from 'lucide-react';

interface EfficiencyMetricsProps {
  metrics: {
    averageRepairTime: number;
    completionRate: number;
    onTimeDelivery: number;
    customerSatisfaction: number;
  };
}

export default function EfficiencyMetrics({ metrics }: EfficiencyMetricsProps) {
  const getStatusColor = (value: number, threshold: number = 80) => {
    if (value >= threshold) return 'bg-green-500';
    if (value >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Efficiency Metrics</CardTitle>
        <CardDescription>Key performance indicators for maintenance operations</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-blue-500" />
                <span className="text-sm font-medium">Avg Repair Time</span>
              </div>
              <div className="text-2xl font-bold">{metrics.averageRepairTime}h</div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 text-yellow-500" />
                <span className="text-sm font-medium">Satisfaction</span>
              </div>
              <div className="text-2xl font-bold">{metrics.customerSatisfaction}/5</div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm font-medium">Completion Rate</span>
                </div>
                <Badge variant="secondary">{metrics.completionRate}%</Badge>
              </div>
              <Progress 
                value={metrics.completionRate} 
                className={`h-2 ${getStatusColor(metrics.completionRate)}`}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-purple-500" />
                  <span className="text-sm font-medium">On-Time Delivery</span>
                </div>
                <Badge variant="secondary">{metrics.onTimeDelivery}%</Badge>
              </div>
              <Progress 
                value={metrics.onTimeDelivery} 
                className={`h-2 ${getStatusColor(metrics.onTimeDelivery)}`}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}