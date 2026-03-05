import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { envRepairService } from '@/services/envRepairService';

import { Download, Upload, RotateCcw, Save, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';

export function EnvBackupManager() {
  const [backups, setBackups] = useState<any[]>([]);
  const [repairStatus, setRepairStatus] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadBackups();
  }, []);

  const loadBackups = () => {
    // Backup functionality not implemented in envRepairService
    setBackups([]);
  };

  const handleCreateBackup = async () => {
    setRepairStatus({ success: false, message: 'Backup functionality not available' });
  };

  const handleAutoRepair = async () => {
    setRepairStatus({ success: false, message: 'Auto-repair functionality not available' });
  };

  const handleRestore = async (backupId: string) => {
    setRepairStatus({ success: false, message: 'Restore functionality not available' });
  };

  const handleRollback = async () => {
    setRepairStatus({ success: false, message: 'Rollback functionality not available' });
  };


  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Environment Variable Backup & Repair</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button onClick={handleCreateBackup} disabled={loading}>
              <Save className="w-4 h-4 mr-2" />
              Create Backup
            </Button>
            <Button onClick={handleAutoRepair} disabled={loading} variant="outline">
              <AlertTriangle className="w-4 h-4 mr-2" />
              Auto Repair
            </Button>
            <Button onClick={handleRollback} disabled={loading} variant="outline">
              <RotateCcw className="w-4 h-4 mr-2" />
              Rollback
            </Button>
          </div>

          {repairStatus && (
            <Alert variant={repairStatus.success ? 'default' : 'destructive'}>
              <AlertDescription>
                {repairStatus.success ? (
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    <span>
                      Repair successful! Repaired keys: {repairStatus.repairedKeys?.join(', ') || 'None'}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <XCircle className="w-4 h-4" />
                    <span>Repair failed: {repairStatus.error || repairStatus.message}</span>
                  </div>
                )}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Available Backups ({backups.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {backups.length === 0 ? (
              <p className="text-muted-foreground">No backups available</p>
            ) : (
              backups.map((backup) => (
                <div
                  key={backup.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">
                        {new Date(backup.timestamp).toLocaleString()}
                      </span>
                      <Badge variant={backup.isValid ? 'default' : 'destructive'}>
                        {backup.isValid ? 'Valid' : 'Invalid'}
                      </Badge>
                      <Badge variant="outline">{backup.source}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Keys: {Object.keys(backup.config).join(', ')}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleRestore(backup.id)}
                    disabled={loading || !backup.isValid}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Restore
                  </Button>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}