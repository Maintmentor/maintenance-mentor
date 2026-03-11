import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { translationRetrainingService, ABTest, ModelVersion } from '@/services/translationRetrainingService';
import { Play, StopCircle, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export function ABTestingDashboard() {
  const [tests, setTests] = useState<ABTest[]>([]);
  const [versions, setVersions] = useState<ModelVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTest, setNewTest] = useState({
    experimentName: '',
    modelAVersion: '',
    modelBVersion: '',
    trafficSplit: 0.5
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [versionsData] = await Promise.all([
        translationRetrainingService.getModelVersions()
      ]);
      setVersions(versionsData);
    } catch (error) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTest = async () => {
    try {
      await translationRetrainingService.createABTest({
        experimentName: newTest.experimentName,
        modelAVersion: newTest.modelAVersion,
        modelBVersion: newTest.modelBVersion,
        trafficSplit: newTest.trafficSplit
      });
      toast.success('A/B test created successfully');
      loadData();
      setNewTest({
        experimentName: '',
        modelAVersion: '',
        modelBVersion: '',
        trafficSplit: 0.5
      });
    } catch (error) {
      toast.error('Failed to create A/B test');
    }
  };

  const handleCompleteTest = async (testId: string) => {
    try {
      const results = await translationRetrainingService.completeABTest(testId);
      toast.success(`Test completed. Winner: ${results.winner_version}`);
      loadData();
    } catch (error) {
      toast.error('Failed to complete test');
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>A/B Testing Dashboard</CardTitle>
            <Dialog>
              <DialogTrigger asChild>
                <Button>
                  <Play className="w-4 h-4 mr-2" />
                  Create A/B Test
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New A/B Test</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Experiment Name</Label>
                    <Input
                      value={newTest.experimentName}
                      onChange={(e) => setNewTest({...newTest, experimentName: e.target.value})}
                      placeholder="e.g., Spanish Translation Improvement"
                    />
                  </div>
                  <div>
                    <Label>Model A (Control)</Label>
                    <Select
                      value={newTest.modelAVersion}
                      onValueChange={(value) => setNewTest({...newTest, modelAVersion: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select model" />
                      </SelectTrigger>
                      <SelectContent>
                        {versions.map((v) => (
                          <SelectItem key={v.id} value={v.id}>
                            {v.version_number} ({v.status})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Model B (Variant)</Label>
                    <Select
                      value={newTest.modelBVersion}
                      onValueChange={(value) => setNewTest({...newTest, modelBVersion: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select model" />
                      </SelectTrigger>
                      <SelectContent>
                        {versions.map((v) => (
                          <SelectItem key={v.id} value={v.id}>
                            {v.version_number} ({v.status})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Traffic Split (Model A)</Label>
                    <Input
                      type="number"
                      min="0"
                      max="1"
                      step="0.1"
                      value={newTest.trafficSplit}
                      onChange={(e) => setNewTest({...newTest, trafficSplit: parseFloat(e.target.value)})}
                    />
                    <p className="text-sm text-muted-foreground mt-1">
                      {(newTest.trafficSplit * 100).toFixed(0)}% Model A / {((1 - newTest.trafficSplit) * 100).toFixed(0)}% Model B
                    </p>
                  </div>
                  <Button onClick={handleCreateTest} className="w-full">
                    Create Test
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {tests.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No A/B tests running. Create one to compare model performance.
              </p>
            ) : (
              tests.map((test) => (
                <div key={test.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold">{test.experiment_name}</h3>
                      <Badge variant={test.status === 'running' ? 'default' : 'secondary'}>
                        {test.status}
                      </Badge>
                    </div>
                    {test.status === 'running' && (
                      <Button size="sm" variant="outline" onClick={() => handleCompleteTest(test.id)}>
                        <StopCircle className="w-4 h-4 mr-1" />
                        Complete Test
                      </Button>
                    )}
                  </div>
                  <div className="text-sm space-y-2">
                    <p>Traffic Split: {(test.traffic_split * 100).toFixed(0)}% / {((1 - test.traffic_split) * 100).toFixed(0)}%</p>
                    <p>Started: {new Date(test.start_date).toLocaleDateString()}</p>
                    {test.winner_version && (
                      <p className="flex items-center text-green-600">
                        <TrendingUp className="w-4 h-4 mr-1" />
                        Winner: Model {test.winner_version}
                      </p>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
