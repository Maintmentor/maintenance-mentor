import React, { useState, useEffect } from 'react';
import { Bell, Mail, Smartphone, MessageSquare, TrendingUp, Filter, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface DeliveryRecord {
  id: string;
  delivery_method: string;
  status: string;
  delivered_at: string;
  error_message?: string;
  notifications: {
    title: string;
    type: string;
    created_at: string;
  };
}

export function NotificationDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [deliveries, setDeliveries] = useState<DeliveryRecord[]>([]);
  const [stats, setStats] = useState({ total: 0, delivered: 0, failed: 0, pending: 0 });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [methodFilter, setMethodFilter] = useState('all');

  useEffect(() => {
    if (user) {
      loadDeliveries();
      loadStats();
    }
  }, [user, statusFilter, methodFilter]);

  const loadDeliveries = async () => {
    try {
      let query = supabase
        .from('notification_deliveries')
        .select(`
          *,
          notifications (
            title,
            type,
            created_at
          )
        `)
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }
      if (methodFilter !== 'all') {
        query = query.eq('delivery_method', methodFilter);
      }

      const { data, error } = await query;
      if (error) throw error;

      setDeliveries(data || []);
    } catch (error) {
      console.error('Failed to load deliveries:', error);
      toast({
        title: "Error",
        description: "Failed to load notification history",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const { data, error } = await supabase
        .from('notification_deliveries')
        .select('status')
        .eq('user_id', user?.id);

      if (error) throw error;

      const stats = data?.reduce((acc, item) => {
        acc.total++;
        acc[item.status] = (acc[item.status] || 0) + 1;
        return acc;
      }, { total: 0, delivered: 0, failed: 0, pending: 0 }) || { total: 0, delivered: 0, failed: 0, pending: 0 };

      setStats(stats);
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'sent': return 'bg-blue-100 text-blue-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getMethodIcon = (method: string) => {
    switch (method) {
      case 'email': return <Mail className="w-4 h-4" />;
      case 'push': return <Smartphone className="w-4 h-4" />;
      case 'sms': return <MessageSquare className="w-4 h-4" />;
      default: return <Bell className="w-4 h-4" />;
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Notification Dashboard</h1>
        <p className="text-gray-600">Monitor notification delivery and performance</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Bell className="w-8 h-8 text-blue-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Sent</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <TrendingUp className="w-8 h-8 text-green-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Delivered</p>
                <p className="text-2xl font-bold text-gray-900">{stats.delivered}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <MessageSquare className="w-8 h-8 text-yellow-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Mail className="w-8 h-8 text-red-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Failed</p>
                <p className="text-2xl font-bold text-gray-900">{stats.failed}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Notification History</CardTitle>
            <div className="flex items-center gap-4">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="sent">Sent</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>

              <Select value={methodFilter} onValueChange={setMethodFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Methods</SelectItem>
                  <SelectItem value="in_app">In-App</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="push">Push</SelectItem>
                  <SelectItem value="sms">SMS</SelectItem>
                </SelectContent>
              </Select>

              <Button onClick={loadDeliveries} variant="outline" size="sm">
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Status</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Title</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Sent</TableHead>
                <TableHead>Delivered</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">Loading...</TableCell>
                </TableRow>
              ) : deliveries.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No notifications found
                  </TableCell>
                </TableRow>
              ) : (
                deliveries.map((delivery) => (
                  <TableRow key={delivery.id}>
                    <TableCell>
                      <Badge className={getStatusColor(delivery.status)}>
                        {delivery.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getMethodIcon(delivery.delivery_method)}
                        <span className="capitalize">{delivery.delivery_method}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      {delivery.notifications?.title}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {delivery.notifications?.type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {new Date(delivery.notifications?.created_at).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      {delivery.delivered_at ? new Date(delivery.delivered_at).toLocaleString() : '-'}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}