import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { auditService, AuditLogEntry, SuspiciousActivity } from '@/services/auditService';
import { Shield, AlertTriangle, Activity, FileText, Search, Download } from 'lucide-react';

export const AuditDashboard: React.FC = () => {
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [suspiciousActivities, setSuspiciousActivities] = useState<SuspiciousActivity[]>([]);
  const [stats, setStats] = useState({
    totalActivities: 0,
    failedAttempts: 0,
    suspiciousActivities: 0,
    criticalEvents: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [timeRange, setTimeRange] = useState('7d');

  useEffect(() => {
    loadAuditData();
  }, [timeRange, severityFilter]);

  const loadAuditData = async () => {
    try {
      setLoading(true);
      const [logs, suspicious, statistics] = await Promise.all([
        auditService.getAuditLogs({
          severity: severityFilter === 'all' ? undefined : severityFilter,
          limit: 100
        }),
        auditService.getSuspiciousActivities(),
        auditService.getActivityStats(timeRange)
      ]);

      setAuditLogs(logs);
      setSuspiciousActivities(suspicious);
      setStats(statistics);
    } catch (error) {
      console.error('Failed to load audit data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateReport = async () => {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - 30);

      await auditService.generateComplianceReport(
        'comprehensive',
        startDate.toISOString(),
        endDate.toISOString()
      );

      alert('Compliance report generated successfully!');
      loadAuditData();
    } catch (error) {
      console.error('Failed to generate report:', error);
      alert('Failed to generate report');
    }
  };

  const handleResolveSuspicious = async (id: string) => {
    try {
      await auditService.updateSuspiciousActivity(id, { status: 'resolved' });
      loadAuditData();
    } catch (error) {
      console.error('Failed to resolve suspicious activity:', error);
    }
  };

  const filteredLogs = auditLogs.filter(log => 
    searchTerm === '' || 
    log.actionType.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.resourceType.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'bg-green-100 text-green-800';
      case 'failure': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading audit data...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Audit Dashboard</h1>
        <Button onClick={handleGenerateReport} className="flex items-center gap-2">
          <FileText className="h-4 w-4" />
          Generate Report
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Activities</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalActivities}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed Attempts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.failedAttempts}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Suspicious Activities</CardTitle>
            <Shield className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.suspiciousActivities}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical Events</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.criticalEvents}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              <Input
                placeholder="Search activities..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-64"
              />
            </div>
            
            <Select value={severityFilter} onValueChange={setSeverityFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Severities</SelectItem>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
              </SelectContent>
            </Select>

            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Time Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1d">Last 24 Hours</SelectItem>
                <SelectItem value="7d">Last 7 Days</SelectItem>
                <SelectItem value="30d">Last 30 Days</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="audit-logs" className="space-y-4">
        <TabsList>
          <TabsTrigger value="audit-logs">Audit Logs</TabsTrigger>
          <TabsTrigger value="suspicious">Suspicious Activities</TabsTrigger>
        </TabsList>

        <TabsContent value="audit-logs">
          <Card>
            <CardHeader>
              <CardTitle>Activity Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredLogs.map((log) => (
                  <div key={log.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className={getSeverityColor(log.severity || 'low')}>
                          {log.severity}
                        </Badge>
                        <Badge className={getStatusColor(log.status || 'success')}>
                          {log.status}
                        </Badge>
                        <span className="text-sm text-gray-500">
                          {new Date(log.timestamp || '').toLocaleString()}
                        </span>
                      </div>
                      <div className="font-medium">{log.actionType}</div>
                      <div className="text-sm text-gray-600">
                        Resource: {log.resourceType} {log.resourceId && `(${log.resourceId})`}
                      </div>
                      {log.details && Object.keys(log.details).length > 0 && (
                        <div className="text-xs text-gray-500 mt-1">
                          {JSON.stringify(log.details)}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="suspicious">
          <Card>
            <CardHeader>
              <CardTitle>Suspicious Activities</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {suspiciousActivities.map((activity) => (
                  <Alert key={activity.id} className="border-orange-200">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant={activity.riskLevel === 'critical' ? 'destructive' : 'secondary'}>
                              {activity.riskLevel} risk
                            </Badge>
                            <Badge variant="outline">{activity.status}</Badge>
                          </div>
                          <div className="font-medium">{activity.description}</div>
                          <div className="text-sm text-gray-600 mt-1">
                            Pattern: {activity.activityPattern}
                          </div>
                          <div className="text-xs text-gray-500">
                            {new Date(activity.createdAt).toLocaleString()}
                          </div>
                        </div>
                        {activity.status === 'open' && (
                          <Button
                            size="sm"
                            onClick={() => handleResolveSuspicious(activity.id)}
                            className="ml-4"
                          >
                            Resolve
                          </Button>
                        )}
                      </div>
                    </AlertDescription>
                  </Alert>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};