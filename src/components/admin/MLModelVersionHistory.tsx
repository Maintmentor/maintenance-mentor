import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { translationRetrainingService, ModelVersion } from '@/services/translationRetrainingService';
import { CheckCircle2, XCircle, Clock, TrendingUp, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';

export function MLModelVersionHistory() {
  const [versions, setVersions] = useState<ModelVersion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadVersions();
  }, []);

  const loadVersions = async () => {
    try {
      const data = await translationRetrainingService.getModelVersions();
      setVersions(data);
    } catch (error) {
      toast.error('Failed to load model versions');
    } finally {
      setLoading(false);
    }
  };

  const handleActivate = async (versionId: string) => {
    try {
      await translationRetrainingService.activateModel(versionId);
      toast.success('Model activated successfully');
      loadVersions();
    } catch (error) {
      toast.error('Failed to activate model');
    }
  };

  const handleRollback = async (versionId: string) => {
    try {
      await translationRetrainingService.rollbackModel(versionId);
      toast.success('Rolled back to previous version');
      loadVersions();
    } catch (error) {
      toast.error('Failed to rollback model');
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: any = {
      active: 'default',
      testing: 'secondary',
      training: 'outline',
      deprecated: 'destructive',
      rolled_back: 'destructive'
    };
    return <Badge variant={variants[status] || 'outline'}>{status}</Badge>;
  };

  if (loading) {
    return <div className="text-center py-8">Loading model versions...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Model Version History</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {versions.map((version) => (
            <div key={version.id} className="border rounded-lg p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold">{version.version_number}</h3>
                    {getStatusBadge(version.status)}
                    {version.is_active && (
                      <Badge variant="default" className="bg-green-500">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        Active
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{version.model_type}</p>
                </div>
                <div className="flex gap-2">
                  {!version.is_active && version.status === 'testing' && (
                    <Button size="sm" onClick={() => handleActivate(version.id)}>
                      Activate
                    </Button>
                  )}
                  {!version.is_active && version.status === 'active' && (
                    <Button size="sm" variant="outline" onClick={() => handleRollback(version.id)}>
                      <RotateCcw className="w-4 h-4 mr-1" />
                      Rollback
                    </Button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Training Feedback</p>
                  <p className="font-medium">{version.training_feedback_count}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Accuracy Improvement</p>
                  <p className="font-medium flex items-center">
                    {version.accuracy_improvement ? (
                      <>
                        <TrendingUp className="w-4 h-4 mr-1 text-green-500" />
                        +{version.accuracy_improvement}%
                      </>
                    ) : (
                      'N/A'
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Trained At</p>
                  <p className="font-medium">
                    {new Date(version.trained_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
