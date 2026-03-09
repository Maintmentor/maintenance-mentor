import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, AlertTriangle, XCircle, Clock } from 'lucide-react';

interface DomainHealthCardProps {
  title: string;
  status: 'healthy' | 'warning' | 'critical' | 'checking';
  details?: string;
  responseTime?: number;
  lastChecked?: string;
}

export function DomainHealthCard({ 
  title, 
  status, 
  details, 
  responseTime,
  lastChecked 
}: DomainHealthCardProps) {
  const statusConfig = {
    healthy: {
      icon: CheckCircle2,
      color: 'text-green-500',
      bgColor: 'bg-green-50',
      badge: 'bg-green-100 text-green-800'
    },
    warning: {
      icon: AlertTriangle,
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-50',
      badge: 'bg-yellow-100 text-yellow-800'
    },
    critical: {
      icon: XCircle,
      color: 'text-red-500',
      bgColor: 'bg-red-50',
      badge: 'bg-red-100 text-red-800'
    },
    checking: {
      icon: Clock,
      color: 'text-blue-500',
      bgColor: 'bg-blue-50',
      badge: 'bg-blue-100 text-blue-800'
    }
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <Card className={`${config.bgColor} border-2`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{title}</CardTitle>
          <Icon className={`h-6 w-6 ${config.color}`} />
        </div>
      </CardHeader>
      <CardContent>
        <Badge className={config.badge}>{status.toUpperCase()}</Badge>
        {details && (
          <p className="text-sm text-gray-600 mt-2">{details}</p>
        )}
        {responseTime && (
          <p className="text-xs text-gray-500 mt-1">
            Response: {responseTime}ms
          </p>
        )}
        {lastChecked && (
          <p className="text-xs text-gray-400 mt-1">
            Last checked: {new Date(lastChecked).toLocaleTimeString()}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
