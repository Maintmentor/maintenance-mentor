import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ExternalLink, FileSpreadsheet, RefreshCw, CheckCircle, XCircle } from 'lucide-react';
import { googleSheetsService, UserSheet } from '@/services/googleSheetsService';
import { useToast } from '@/hooks/use-toast';
import { GoogleSheetsBatchMonitor } from './GoogleSheetsBatchMonitor';
import BatchMLOptimizationDashboard from './BatchMLOptimizationDashboard';
import BatchABTestingPanel from './BatchABTestingPanel';

export default function GoogleSheetsManager() {
  const [sheets, setSheets] = useState<UserSheet[]>([]);
  const [loading, setLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<boolean | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadSheets();
    testConnection();
  }, []);

  const loadSheets = async () => {
    setLoading(true);
    try {
      const data = await googleSheetsService.getAllSheets();
      setSheets(data);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load sheets',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const testConnection = async () => {
    const status = await googleSheetsService.testConnection();
    setConnectionStatus(status);
  };

  const exportAllSheets = () => {
    const csv = [
      ['User Email', 'Sheet Name', 'Query Count', 'Last Updated', 'Sheet URL'].join(','),
      ...sheets.map(sheet => [
        sheet.sheetName,
        sheet.sheetName,
        sheet.queryCount,
        new Date(sheet.lastUpdated).toLocaleString(),
        sheet.spreadsheetUrl
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `google-sheets-export-${Date.now()}.csv`;
    a.click();
  };

  return (
    <Tabs defaultValue="sheets" className="space-y-6">
      <TabsList>
        <TabsTrigger value="sheets">Sheets Management</TabsTrigger>
        <TabsTrigger value="batch">Batch Monitor</TabsTrigger>
        <TabsTrigger value="ml">ML Optimization</TabsTrigger>
        <TabsTrigger value="ab">A/B Testing</TabsTrigger>
      </TabsList>

      <TabsContent value="sheets" className="space-y-6">

      

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Google Sheets Integration</CardTitle>
              <CardDescription>Manage subscriber repair query logs</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {connectionStatus !== null && (
                <Badge variant={connectionStatus ? 'default' : 'destructive'}>
                  {connectionStatus ? (
                    <>
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Connected
                    </>
                  ) : (
                    <>
                      <XCircle className="w-3 h-3 mr-1" />
                      Disconnected
                    </>
                  )}
                </Badge>
              )}
              <Button onClick={testConnection} variant="outline" size="sm">
                <RefreshCw className="w-4 h-4 mr-2" />
                Test Connection
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 mb-6">
            <Button onClick={loadSheets} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Button onClick={exportAllSheets} disabled={sheets.length === 0}>
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              Export All
            </Button>
          </div>

          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading sheets...</div>
          ) : sheets.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No sheets created yet. Sheets are created automatically when users make queries.
            </div>
          ) : (
            <div className="space-y-4">
              {sheets.map((sheet) => (
                <Card key={sheet.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold">{sheet.sheetName}</h3>
                        <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
                          <span>{sheet.queryCount} queries</span>
                          <span>Last updated: {new Date(sheet.lastUpdated).toLocaleString()}</span>
                          <span>Created: {new Date(sheet.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <Button
                        onClick={() => window.open(sheet.spreadsheetUrl, '_blank')}
                        variant="outline"
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Open Sheet
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>

      </Card>
      </TabsContent>

      <TabsContent value="batch">
        <GoogleSheetsBatchMonitor />
      </TabsContent>

      <TabsContent value="ml">
        <BatchMLOptimizationDashboard />
      </TabsContent>

      <TabsContent value="ab">
        <BatchABTestingPanel />
      </TabsContent>
    </Tabs>
  );
}
