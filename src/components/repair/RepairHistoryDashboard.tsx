import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Plus, Calendar, DollarSign, Wrench } from 'lucide-react';
import { repairService, RepairHistory } from '@/services/repairService';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { format } from 'date-fns';

export function RepairHistoryDashboard() {
  const { user } = useAuth();
  const [repairs, setRepairs] = useState<RepairHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    inProgress: 0,
    pending: 0,
    totalCost: 0
  });

  useEffect(() => {
    if (!user) return;
    
    loadRepairHistory();
    
    // Subscribe to real-time updates
    const subscription = repairService.subscribeToRepairUpdates(
      user.id,
      (payload) => {
        console.log('Repair update:', payload);
        loadRepairHistory(); // Reload data on changes
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [user]);

  const loadRepairHistory = async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      const [data, statistics] = await Promise.all([
        repairService.getRepairHistory(user.id),
        repairService.getRepairStatistics(user.id)
      ]);
      
      setRepairs(data || []);
      setStats(statistics);
    } catch (error) {
      console.error('Error loading repair history:', error);
      toast.error('Failed to load repair history');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'in_progress': return 'bg-blue-500';
      case 'pending': return 'bg-yellow-500';
      case 'cancelled': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Repairs</CardTitle>
            <Wrench className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completed}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">In Progress</CardTitle>
            <Loader2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.inProgress}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.totalCost.toFixed(2)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Repair History List */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Repair History</CardTitle>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Repair
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {repairs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No repair history yet. Start by adding your first repair record.
            </div>
          ) : (
            <div className="space-y-4">
              {repairs.map((repair) => (
                <div key={repair.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <h3 className="font-semibold">{repair.appliance}</h3>
                      <p className="text-sm text-muted-foreground">{repair.issue}</p>
                      {repair.description && (
                        <p className="text-sm">{repair.description}</p>
                      )}
                      <div className="flex gap-2 mt-2">
                        <Badge className={getStatusColor(repair.status)}>
                          {repair.status.replace('_', ' ')}
                        </Badge>
                        {repair.cost && (
                          <Badge variant="outline">${repair.cost}</Badge>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(repair.repair_date), 'MMM d, yyyy')}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}