import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';
import { PlayCircle, StopCircle, Trophy } from 'lucide-react';

export default function BatchABTestingPanel() {
  const [tests, setTests] = useState<any[]>([]);
  const [newTest, setNewTest] = useState({
    name: '',
    strategyA: { batchSize: 10, flushInterval: 5000 },
    strategyB: { batchSize: 20, flushInterval: 10000 }
  });

  const fetchTests = async () => {
    const { data } = await supabase
      .from('batch_ab_tests')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (data) setTests(data);
  };

  const createTest = async () => {
    const { error } = await supabase
      .from('batch_ab_tests')
      .insert({
        test_name: newTest.name,
        strategy_a: newTest.strategyA,
        strategy_b: newTest.strategyB,
        start_date: new Date().toISOString(),
        status: 'active'
      });

    if (!error) {
      fetchTests();
      setNewTest({
        name: '',
        strategyA: { batchSize: 10, flushInterval: 5000 },
        strategyB: { batchSize: 20, flushInterval: 10000 }
      });
    }
  };

  const stopTest = async (testId: string) => {
    const { error } = await supabase
      .from('batch_ab_tests')
      .update({ status: 'completed', end_date: new Date().toISOString() })
      .eq('id', testId);

    if (!error) fetchTests();
  };

  useEffect(() => {
    fetchTests();
  }, []);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Create New A/B Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Test Name</Label>
            <Input
              value={newTest.name}
              onChange={(e) => setNewTest({ ...newTest, name: e.target.value })}
              placeholder="e.g., Large vs Small Batches"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Strategy A - Batch Size</Label>
              <Input
                type="number"
                value={newTest.strategyA.batchSize}
                onChange={(e) => setNewTest({
                  ...newTest,
                  strategyA: { ...newTest.strategyA, batchSize: parseInt(e.target.value) }
                })}
              />
            </div>
            <div className="space-y-2">
              <Label>Strategy A - Flush Interval (ms)</Label>
              <Input
                type="number"
                value={newTest.strategyA.flushInterval}
                onChange={(e) => setNewTest({
                  ...newTest,
                  strategyA: { ...newTest.strategyA, flushInterval: parseInt(e.target.value) }
                })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Strategy B - Batch Size</Label>
              <Input
                type="number"
                value={newTest.strategyB.batchSize}
                onChange={(e) => setNewTest({
                  ...newTest,
                  strategyB: { ...newTest.strategyB, batchSize: parseInt(e.target.value) }
                })}
              />
            </div>
            <div className="space-y-2">
              <Label>Strategy B - Flush Interval (ms)</Label>
              <Input
                type="number"
                value={newTest.strategyB.flushInterval}
                onChange={(e) => setNewTest({
                  ...newTest,
                  strategyB: { ...newTest.strategyB, flushInterval: parseInt(e.target.value) }
                })}
              />
            </div>
          </div>

          <Button onClick={createTest} disabled={!newTest.name}>
            <PlayCircle className="mr-2 h-4 w-4" />
            Start A/B Test
          </Button>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {tests.map((test) => (
          <Card key={test.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{test.test_name}</CardTitle>
                <Badge variant={test.status === 'active' ? 'default' : 'secondary'}>
                  {test.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="p-4 border rounded">
                  <h4 className="font-semibold mb-2">Strategy A</h4>
                  <p>Batch: {test.strategy_a.batchSize}</p>
                  <p>Interval: {test.strategy_a.flushInterval}ms</p>
                </div>
                <div className="p-4 border rounded">
                  <h4 className="font-semibold mb-2">Strategy B</h4>
                  <p>Batch: {test.strategy_b.batchSize}</p>
                  <p>Interval: {test.strategy_b.flushInterval}ms</p>
                </div>
              </div>
              {test.status === 'active' && (
                <Button onClick={() => stopTest(test.id)} variant="outline">
                  <StopCircle className="mr-2 h-4 w-4" />
                  Stop Test
                </Button>
              )}
              {test.winner && (
                <div className="flex items-center gap-2 mt-2">
                  <Trophy className="h-4 w-4 text-yellow-500" />
                  <span>Winner: Strategy {test.winner}</span>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
