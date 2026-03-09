import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { alertGoalService, GoalHistory } from '@/services/alertGoalService';
import { CheckCircle, XCircle, Clock, AlertTriangle, Activity } from 'lucide-react';

export function GoalHistoryWidget() {
  const [history, setHistory] = useState<GoalHistory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const data = await alertGoalService.getGoalHistory(30);
      setHistory(data);
    } catch (error) {
      console.error('Error loading goal history:', error);
    } finally {
      setLoading(false);
    }
  };

  const getGoalIcon = (goalType: string) => {
    switch (goalType) {
      case 'response_time':
        return <Clock className="h-4 w-4" />;
      case 'false_positive_rate':
        return <AlertTriangle className="h-4 w-4" />;
      case 'uptime_percentage':
        return <Activity className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const formatGoalType = (type: string) => {
    return type.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  if (loading) {
    return <div className="text-center py-4">Loading history...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Goal Performance History (Last 30 Days)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {history.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No goal history available yet
            </p>
          ) : (
            history.slice(0, 10).map((item) => (
              <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  {getGoalIcon(item.goal_type)}
                  <div>
                    <div className="font-medium text-sm">{formatGoalType(item.goal_type)}</div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(item.period_start).toLocaleDateString()} - {new Date(item.period_end).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-sm font-medium">
                      {item.actual_value.toFixed(1)} / {item.target_value.toFixed(1)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Actual / Target
                    </div>
                  </div>
                  <Badge variant={item.met_goal ? 'default' : 'destructive'}>
                    {item.met_goal ? (
                      <><CheckCircle className="h-3 w-3 mr-1" /> Met</>
                    ) : (
                      <><XCircle className="h-3 w-3 mr-1" /> Missed</>
                    )}
                  </Badge>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
