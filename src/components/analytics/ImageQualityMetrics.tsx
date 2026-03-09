import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ThumbsUp, ThumbsDown, TrendingUp, AlertTriangle } from 'lucide-react';

interface MetricsProps {
  overallAccuracy: number;
  queryPerformance: any[];
  problematicParts: any[];
}

export function ImageQualityMetrics({ overallAccuracy, queryPerformance, problematicParts }: MetricsProps) {
  const topQueries = queryPerformance.slice(0, 5);
  const worstQueries = queryPerformance.slice(-5).reverse();

  return (
    <>
      {/* Overall Accuracy */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Overall Accuracy Rate
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-4xl font-bold text-green-600">
            {overallAccuracy.toFixed(1)}%
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            Percentage of positive feedback
          </p>
        </CardContent>
      </Card>

      {/* Top Performing Queries */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ThumbsUp className="w-5 h-5 text-green-600" />
            Top Performing Queries
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {topQueries.map((query, idx) => (
              <div key={idx} className="flex justify-between items-center">
                <span className="text-sm truncate flex-1">{query.search_query}</span>
                <Badge variant="outline" className="ml-2">
                  {query.accuracy_rate.toFixed(0)}%
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Worst Performing Queries */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ThumbsDown className="w-5 h-5 text-red-600" />
            Worst Performing Queries
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {worstQueries.map((query, idx) => (
              <div key={idx} className="flex justify-between items-center">
                <span className="text-sm truncate flex-1">{query.search_query}</span>
                <Badge variant="destructive" className="ml-2">
                  {query.accuracy_rate.toFixed(0)}%
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </>
  );
}
