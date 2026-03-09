import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { AlertCircle, CheckCircle, Clock, Download, Upload, Shield, Database, Calendar, Settings } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';

interface Backup {
  id: string;
  backup_name: string;
  backup_type: string;
  status: string;
  file_size: number;
  created_at: string;
  completed_at: string;
  verification_status: string;
  tables_included: string[];
}

interface RestoreLog {
  id: string;
  backup_id: string;
  restore_type: string;
  status: string;
  started_at: string;
  completed_at: string;
  records_restored: number;
  backup_metadata: {
    backup_name: string;
    backup_type: string;
  };
}

export function BackupDashboard() {
  const [backups, setBackups] = useState<Backup[]>([]);
  const [restoreLogs, setRestoreLogs] = useState<RestoreLog[]>([]);
  const [isCreatingBackup, setIsCreatingBackup] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [selectedTables, setSelectedTables] = useState<string[]>([]);
  const { toast } = useToast();

  const availableTables = [
    'profiles', 'conversations', 'messages', 'repair_history',
    'parts_tracking', 'maintenance_reminders', 'notifications'
  ];

  useEffect(() => {
    loadBackups();
    loadRestoreLogs();
  }, []);

  const loadBackups = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('backup-manager', {
        body: { action: 'list_backups' }
      });

      if (error) throw error;
      if (data.success) {
        setBackups(data.backups || []);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load backups",
        variant: "destructive"
      });
    }
  };

  const loadRestoreLogs = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('backup-restore-service', {
        body: { action: 'list_restores' }
      });

      if (error) throw error;
      if (data.success) {
        setRestoreLogs(data.restores || []);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load restore logs",
        variant: "destructive"
      });
    }
  };

  const createBackup = async (backupType: string) => {
    setIsCreatingBackup(true);
    try {
      const { data, error } = await supabase.functions.invoke('backup-manager', {
        body: {
          action: 'create_backup',
          backupName: `${backupType}_backup_${Date.now()}`,
          backupType,
          tables: selectedTables.length > 0 ? selectedTables : availableTables
        }
      });

      if (error) throw error;
      if (data.success) {
        toast({
          title: "Success",
          description: "Backup created successfully"
        });
        loadBackups();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create backup",
        variant: "destructive"
      });
    } finally {
      setIsCreatingBackup(false);
    }
  };

  const verifyBackup = async (backupId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('backup-manager', {
        body: {
          action: 'verify_backup',
          backupId
        }
      });

      if (error) throw error;
      if (data.success) {
        toast({
          title: "Verification Complete",
          description: data.verification.passed ? "Backup verified successfully" : "Backup verification failed"
        });
        loadBackups();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to verify backup",
        variant: "destructive"
      });
    }
  };

  const restoreBackup = async (backupId: string, restoreType: string = 'full') => {
    setIsRestoring(true);
    try {
      const { data, error } = await supabase.functions.invoke('backup-restore-service', {
        body: {
          action: 'restore_backup',
          backupId,
          restoreType,
          tables: selectedTables.length > 0 ? selectedTables : undefined
        }
      });

      if (error) throw error;
      if (data.success) {
        toast({
          title: "Success",
          description: "Backup restored successfully"
        });
        loadRestoreLogs();
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to restore backup",
        variant: "destructive"
      });
    } finally {
      setIsRestoring(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      completed: { variant: 'default' as const, icon: CheckCircle, color: 'text-green-600' },
      in_progress: { variant: 'secondary' as const, icon: Clock, color: 'text-blue-600' },
      failed: { variant: 'destructive' as const, icon: AlertCircle, color: 'text-red-600' },
      pending: { variant: 'outline' as const, icon: Clock, color: 'text-yellow-600' }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className={`h-3 w-3 ${config.color}`} />
        {status}
      </Badge>
    );
  };

  const formatFileSize = (bytes: number) => {
    if (!bytes) return 'N/A';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Backup & Recovery</h1>
          <p className="text-muted-foreground">Manage application backups and restore operations</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => createBackup('full')} disabled={isCreatingBackup}>
            <Database className="h-4 w-4 mr-2" />
            {isCreatingBackup ? 'Creating...' : 'Full Backup'}
          </Button>
          <Button variant="outline" onClick={() => createBackup('incremental')} disabled={isCreatingBackup}>
            <Upload className="h-4 w-4 mr-2" />
            Incremental
          </Button>
        </div>
      </div>

      <Tabs defaultValue="backups" className="space-y-4">
        <TabsList>
          <TabsTrigger value="backups">Backups</TabsTrigger>
          <TabsTrigger value="restore">Restore</TabsTrigger>
          <TabsTrigger value="schedules">Schedules</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="backups" className="space-y-4">
          <div className="grid gap-4">
            {backups.map((backup) => (
              <Card key={backup.id}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div>
                    <CardTitle className="text-base">{backup.backup_name}</CardTitle>
                    <CardDescription>
                      {backup.backup_type} backup • {formatFileSize(backup.file_size)} • {backup.tables_included?.length || 0} tables
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(backup.status)}
                    {backup.verification_status === 'verified' && (
                      <Badge variant="outline" className="text-green-600">
                        <Shield className="h-3 w-3 mr-1" />
                        Verified
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                      Created: {new Date(backup.created_at).toLocaleString()}
                      {backup.completed_at && (
                        <span className="ml-4">
                          Completed: {new Date(backup.completed_at).toLocaleString()}
                        </span>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {backup.status === 'completed' && backup.verification_status !== 'verified' && (
                        <Button variant="outline" size="sm" onClick={() => verifyBackup(backup.id)}>
                          <Shield className="h-4 w-4 mr-1" />
                          Verify
                        </Button>
                      )}
                      {backup.status === 'completed' && (
                        <Button variant="outline" size="sm" onClick={() => restoreBackup(backup.id)} disabled={isRestoring}>
                          <Download className="h-4 w-4 mr-1" />
                          {isRestoring ? 'Restoring...' : 'Restore'}
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="restore" className="space-y-4">
          <div className="grid gap-4">
            {restoreLogs.map((restore) => (
              <Card key={restore.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base">
                        {restore.backup_metadata?.backup_name || 'Unknown Backup'}
                      </CardTitle>
                      <CardDescription>
                        {restore.restore_type} restore • {restore.records_restored} records restored
                      </CardDescription>
                    </div>
                    {getStatusBadge(restore.status)}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-sm text-muted-foreground">
                    Started: {new Date(restore.started_at).toLocaleString()}
                    {restore.completed_at && (
                      <span className="ml-4">
                        Completed: {new Date(restore.completed_at).toLocaleString()}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="schedules" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Backup Schedules</CardTitle>
              <CardDescription>Configure automated backup schedules</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Daily Full Backup</h4>
                    <p className="text-sm text-muted-foreground">Every day at 2:00 AM</p>
                  </div>
                  <Badge variant="default">Active</Badge>
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h4 className="font-medium">Weekly Archive</h4>
                    <p className="text-sm text-muted-foreground">Every Sunday at 1:00 AM</p>
                  </div>
                  <Badge variant="secondary">Inactive</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Backup Settings</CardTitle>
              <CardDescription>Configure backup preferences and retention policies</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Table Selection</h4>
                <div className="grid grid-cols-2 gap-2">
                  {availableTables.map((table) => (
                    <label key={table} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={selectedTables.includes(table)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedTables([...selectedTables, table]);
                          } else {
                            setSelectedTables(selectedTables.filter(t => t !== table));
                          }
                        }}
                        className="rounded"
                      />
                      <span className="text-sm">{table}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h4 className="font-medium">Retention Period</h4>
                  <p className="text-sm text-muted-foreground">Keep backups for 30 days</p>
                </div>
                <Button variant="outline" size="sm">
                  <Settings className="h-4 w-4 mr-1" />
                  Configure
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}