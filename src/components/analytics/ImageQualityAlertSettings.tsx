import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { alertGoalService, AlertPerformanceGoal } from '@/services/alertGoalService';
import { Target, Save, TrendingUp, AlertTriangle, Activity } from 'lucide-react';

export function ImageQualityAlertSettings() {
  const { toast } = useToast();
  const [goals, setGoals] = useState<AlertPerformanceGoal[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [responseTimeGoal, setResponseTimeGoal] = useState('300');
  const [falsePositiveGoal, setFalsePositiveGoal] = useState('5');
  const [uptimeGoal, setUptimeGoal] = useState('99.5');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    loadGoals();
  }, []);

  const loadGoals = async () => {
    try {
      const data = await alertGoalService.getActiveGoals();
      setGoals(data);

      data.forEach(goal => {
        if (goal.goal_type === 'response_time') {
          setResponseTimeGoal(goal.target_value.toString());
        } else if (goal.goal_type === 'false_positive_rate') {
          setFalsePositiveGoal(goal.target_value.toString());
        } else if (goal.goal_type === 'uptime_percentage') {
          setUptimeGoal(goal.target_value.toString());
        }
      });
    } catch (error) {
      console.error('Error loading goals:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveGoals = async () => {
    setSaving(true);
    try {
      await alertGoalService.setGoal('response_time', parseFloat(responseTimeGoal), notes);
      await alertGoalService.setGoal('false_positive_rate', parseFloat(falsePositiveGoal), notes);
      await alertGoalService.setGoal('uptime_percentage', parseFloat(uptimeGoal), notes);

      toast({
        title: 'Goals Updated',
        description: 'Alert performance goals have been saved successfully.',
      });

      loadGoals();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save goals. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading settings...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Alert Performance Goals
          </CardTitle>
          <CardDescription>
            Set target performance metrics for the alert system. Visual indicators will show when metrics exceed goals.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="responseTime" className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Target Response Time (seconds)
              </Label>
              <Input
                id="responseTime"
                type="number"
                step="0.1"
                value={responseTimeGoal}
                onChange={(e) => setResponseTimeGoal(e.target.value)}
                placeholder="300"
              />
              <p className="text-sm text-muted-foreground">
                Maximum acceptable time to acknowledge alerts
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="falsePositive" className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Acceptable False Positive Rate (%)
              </Label>
              <Input
                id="falsePositive"
                type="number"
                step="0.1"
                value={falsePositiveGoal}
                onChange={(e) => setFalsePositiveGoal(e.target.value)}
                placeholder="5"
              />
              <p className="text-sm text-muted-foreground">
                Maximum percentage of false alerts
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="uptime" className="flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Minimum Uptime Percentage (%)
              </Label>
              <Input
                id="uptime"
                type="number"
                step="0.1"
                value={uptimeGoal}
                onChange={(e) => setUptimeGoal(e.target.value)}
                placeholder="99.5"
              />
              <p className="text-sm text-muted-foreground">
                Minimum system availability target
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any notes about these goals..."
                rows={3}
              />
            </div>
          </div>

          <Button onClick={handleSaveGoals} disabled={saving} className="w-full">
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : 'Save Goals'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
