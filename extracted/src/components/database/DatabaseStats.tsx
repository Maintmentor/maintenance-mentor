import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { repairHistoryService, serviceRequestService } from '@/services/databaseService';
import { Activity, TrendingUp, Users, DollarSign } from 'lucide-react';

export function DatabaseStats() {
  const [stats, setStats] = useState({
    totalRepairs: 0,
    activeRequests: 0,
    completedToday: 0,
    totalRevenue: 0
  });

  useEffect(() => {
    loadStats();

    // Subscribe to real-time changes
    const repairSub = repairHistoryService.subscribeToChanges(() => loadStats());
    const requestSub = serviceRequestService.subscribeToStatusUpdates(() => loadStats());

    return () => {
      repairSub.unsubscribe();
      requestSub.unsubscribe();
    };
  }, []);

  const loadStats = async () => {
    try {
      const [repairs, requests] = await Promise.all([
        repairHistoryService.getAll(),
        serviceRequestService.getAll()
      ]);

      const today = new Date().toDateString();
      const completedToday = repairs?.filter(r => 
        r.status === 'completed' && 
        new Date(r.completion_date || r.updated_at).toDateString() === today
      ).length || 0;

      const totalRevenue = repairs?.reduce((sum, r) => sum + (parseFloat(r.cost) || 0), 0) || 0;

      setStats({
        totalRepairs: repairs?.length || 0,
        activeRequests: requests?.filter(r => r.status === 'in_progress').length || 0,
        completedToday,
        totalRevenue
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Repairs</CardTitle>
          <Activity className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalRepairs}</div>
          <p className="text-xs text-muted-foreground">All time repairs tracked</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Requests</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-600">{stats.activeRequests}</div>
          <p className="text-xs text-muted-foreground">Currently in progress</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Completed Today</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">{stats.completedToday}</div>
          <p className="text-xs text-muted-foreground">Successfully resolved</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">${stats.totalRevenue.toFixed(2)}</div>
          <p className="text-xs text-muted-foreground">From completed repairs</p>
        </CardContent>
      </Card>
    </div>
  );
}