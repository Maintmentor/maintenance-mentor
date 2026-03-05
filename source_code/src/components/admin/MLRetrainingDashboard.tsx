import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { translationRetrainingService, RetrainingJob } from '@/services/translationRetrainingService';
import { Play, Clock, CheckCircle2, XCircle, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

export function MLRetrainingDashboard() {
  const [jobs, setJobs] = useState<RetrainingJob[]>([]);
  const [loading, setLoading] = useState(false);
  const [retraining, setRetraining] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    loadJobs();
    const interval = setInterval(loadJobs, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadJobs = async () => {
    try {
      const data = await translationRetrainingService.getRetrainingJobs();
      setJobs(data);
    } catch (error) {
      console.error('Failed to load jobs:', error);
    }
  };

  const handleTriggerRetraining = async () => {
    setRetraining(true);
    try {
      const result = await translationRetrainingService.triggerRetraining(user?.id);
      toast.success(`Retraining started: ${result.job_id}`);
      loadJobs();
    } catch (error) {
      toast.error('Failed to start retraining');
    } finally {
      setRetraining(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'running':
        return <Clock className="w-4 h-4 text-blue-500 animate-spin" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: any = {
      completed: 'default',
      running: 'secondary',
      failed: 'destructive',
      pending: 'outline'
    };
    return <Badge variant={variants[status] || 'outline'}>{status}</Badge>;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>ML Model Retraining</CardTitle>
            <Button onClick={handleTriggerRetraining} disabled={retraining}>
              <Play className="w-4 h-4 mr-2" />
              {retraining ? 'Starting...' : 'Trigger Retraining'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 mb-6">
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">
                  {jobs.filter(j => j.status === 'completed').length}
                </div>
                <p className="text-sm text-muted-foreground">Completed Jobs</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">
                  {jobs.reduce((sum, j) => sum + (j.feedback_processed || 0), 0)}
                </div>
                <p className="text-sm text-muted-foreground">Total Feedback Processed</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">
                  {jobs.filter(j => j.status === 'running').length}
                </div>
                <p className="text-sm text-muted-foreground">Active Jobs</p>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-3">
            <h3 className="font-semibold">Recent Retraining Jobs</h3>
            {jobs.slice(0, 10).map((job) => (
              <div key={job.id} className="border rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(job.status)}
                    <span className="font-medium">{job.job_type} Job</span>
                    {getStatusBadge(job.status)}
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {new Date(job.started_at).toLocaleString()}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-4 text-sm mt-3">
                  <div>
                    <p className="text-muted-foreground">Feedback Processed</p>
                    <p className="font-medium">{job.feedback_processed}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Corrections Applied</p>
                    <p className="font-medium">{job.corrections_applied}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Duration</p>
                    <p className="font-medium">
                      {job.training_duration_seconds 
                        ? `${job.training_duration_seconds}s`
                        : 'In progress...'}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
