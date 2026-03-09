import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { repairHistoryService } from '@/services/databaseService';
import { Loader2, Wrench, Calendar, DollarSign, Edit, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function RepairHistoryList() {
  const [repairs, setRepairs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadRepairs();
    
    // Subscribe to real-time changes
    const subscription = repairHistoryService.subscribeToChanges((payload) => {
      if (payload.eventType === 'INSERT') {
        setRepairs(prev => [payload.new, ...prev]);
      } else if (payload.eventType === 'UPDATE') {
        setRepairs(prev => prev.map(r => r.id === payload.new.id ? payload.new : r));
      } else if (payload.eventType === 'DELETE') {
        setRepairs(prev => prev.filter(r => r.id !== payload.old.id));
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const loadRepairs = async () => {
    try {
      const data = await repairHistoryService.getAll();
      setRepairs(data || []);
    } catch (error) {
      toast({
        title: "Error loading repairs",
        description: "Failed to fetch repair history from database",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await repairHistoryService.delete(id);
      toast({
        title: "Repair deleted",
        description: "The repair record has been removed"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete repair record",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Repair History</h2>
        <Badge variant="outline" className="px-3 py-1">
          {repairs.length} Total Repairs
        </Badge>
      </div>

      {repairs.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Wrench className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No repair history yet</p>
            <p className="text-sm text-gray-400 mt-2">
              Repairs will appear here once added to the database
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {repairs.map((repair) => (
            <Card key={repair.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{repair.title || 'Repair Service'}</CardTitle>
                  <div className="flex gap-2">
                    <Button size="sm" variant="ghost">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="ghost"
                      onClick={() => handleDelete(repair.id)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div className="flex items-center text-gray-600">
                    <Calendar className="h-4 w-4 mr-2" />
                    {new Date(repair.created_at).toLocaleDateString()}
                  </div>
                  <div className="flex items-center text-gray-600">
                    <DollarSign className="h-4 w-4 mr-2" />
                    ${repair.cost || '0.00'}
                  </div>
                  <Badge variant={
                    repair.status === 'completed' ? 'default' :
                    repair.status === 'in_progress' ? 'secondary' : 'outline'
                  }>
                    {repair.status || 'pending'}
                  </Badge>
                </div>
                {repair.description && (
                  <p className="mt-3 text-gray-600">{repair.description}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}