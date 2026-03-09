import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, Users, DollarSign, Clock, CheckCircle, XCircle } from 'lucide-react';

interface TrialMetricsCardsProps {
  metrics: {
    totalTrials: number;
    activeTrials: number;
    expiredTrials: number;
    convertedTrials: number;
    conversionRate: number;
    averageDaysToConversion: number;
    totalRevenue: number;
    cancelledTrials: number;
  };
}

export function TrialMetricsCards({ metrics }: TrialMetricsCardsProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Trials</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{metrics.totalTrials}</div>
          <p className="text-xs text-muted-foreground">
            {metrics.activeTrials} active, {metrics.expiredTrials} expired
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{metrics.conversionRate.toFixed(1)}%</div>
          <p className="text-xs text-muted-foreground">
            {metrics.convertedTrials} conversions
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">${metrics.totalRevenue.toFixed(2)}</div>
          <p className="text-xs text-muted-foreground">
            From trial conversions
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Avg. Time to Convert</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{metrics.averageDaysToConversion.toFixed(1)} days</div>
          <p className="text-xs text-muted-foreground">
            Average conversion time
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
