import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';
import { Activity, Download, RefreshCw } from 'lucide-react';

interface ActivityLog {
  id: string;
  user_id: string;
  action: string;
  resource: string;
  details: any;
  created_at: string;
  profiles?: {
    email: string;
    full_name: string;
  };
}

export const SystemActivityMonitor: React.FC = () => {
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [filterAction, setFilterAction] = useState('all');
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchActivities();
  }, []);

  const fetchActivities = async () => {
    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select(`
          *,
          profiles:user_id (
            email,
            full_name
          )
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setActivities(data || []);
    } catch (error) {
      console.error('Error fetching activities:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch activity logs',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    const headers = ['Timestamp', 'User', 'Action', 'Resource', 'Details'];
    const rows = filteredActivities.map(a => [
      new Date(a.created_at).toLocaleString(),
      a.profiles?.email || 'Unknown',
      a.action,
      a.resource,
      JSON.stringify(a.details)
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `activity-logs-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const filteredActivities = filterAction === 'all' 
    ? activities 
    : activities.filter(a => a.action === filterAction);

  const actionTypes = Array.from(new Set(activities.map(a => a.action)));

  if (loading) return <div className="flex justify-center p-8">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex gap-4">
          <Select value={filterAction} onValueChange={setFilterAction}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filter by action" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Actions</SelectItem>
              {actionTypes.map(action => (
                <SelectItem key={action} value={action}>{action}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={fetchActivities}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
        <Button onClick={exportToCSV}>
          <Download className="w-4 h-4 mr-2" />
          Export CSV
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Activities</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activities.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {activities.filter(a => {
                const today = new Date().toDateString();
                return new Date(a.created_at).toDateString() === today;
              }).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unique Users</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(activities.map(a => a.user_id)).size}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Action Types</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{actionTypes.length}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Activity ({filteredActivities.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Resource</TableHead>
                <TableHead>Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredActivities.slice(0, 50).map((activity) => (
                <TableRow key={activity.id}>
                  <TableCell className="text-sm">
                    {new Date(activity.created_at).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div className="font-medium">{activity.profiles?.full_name || 'Unknown'}</div>
                      <div className="text-muted-foreground">{activity.profiles?.email}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge>{activity.action}</Badge>
                  </TableCell>
                  <TableCell>{activity.resource}</TableCell>
                  <TableCell className="max-w-xs truncate text-sm text-muted-foreground">
                    {JSON.stringify(activity.details)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};
