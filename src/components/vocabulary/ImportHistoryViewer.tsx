import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { documentImportService, DocumentImport } from '@/services/documentImportService';
import { FileText, CheckCircle, XCircle, Clock, RefreshCw } from 'lucide-react';

export const ImportHistoryViewer: React.FC = () => {
  const [imports, setImports] = useState<DocumentImport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadImports();
  }, []);

  const loadImports = async () => {
    try {
      const data = await documentImportService.getImportHistory();
      setImports(data);
    } catch (error) {
      console.error('Failed to load import history:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'processing':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'processing':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return <div className="flex justify-center p-8">Loading import history...</div>;
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Import History
        </CardTitle>
        <Button variant="outline" size="sm" onClick={loadImports}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </CardHeader>
      <CardContent>
        {imports.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            No document imports yet
          </p>
        ) : (
          <div className="space-y-4">
            {imports.map((importRecord) => (
              <div
                key={importRecord.id}
                className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium flex items-center gap-2">
                    {getStatusIcon(importRecord.status)}
                    {importRecord.filename}
                  </h4>
                  <Badge className={getStatusColor(importRecord.status)}>
                    {importRecord.status}
                  </Badge>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-muted-foreground">
                  <div>
                    <span className="font-medium">Equipment:</span>
                    <br />
                    {importRecord.equipment_type}
                  </div>
                  <div>
                    <span className="font-medium">Domain:</span>
                    <br />
                    {importRecord.domain}
                  </div>
                  <div>
                    <span className="font-medium">Terms Extracted:</span>
                    <br />
                    {importRecord.terms_extracted || 0}
                  </div>
                  <div>
                    <span className="font-medium">Date:</span>
                    <br />
                    {new Date(importRecord.created_at).toLocaleDateString()}
                  </div>
                </div>

                {importRecord.error_message && (
                  <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                    <strong>Error:</strong> {importRecord.error_message}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};