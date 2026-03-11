import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { History, Clock, CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import { edgeFunctionDeploymentService, ValidationHistoryRecord } from '@/services/edgeFunctionDeploymentService';

export default function ValidationHistoryViewer() {
  const [history, setHistory] = useState<ValidationHistoryRecord[]>([]);
  const [filterKeyName, setFilterKeyName] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    setIsLoading(true);
    const data = await edgeFunctionDeploymentService.getValidationHistory(
      filterKeyName || undefined,
      20
    );
    setHistory(data);
    setIsLoading(false);
  };

  const handleFilter = () => {
    loadHistory();
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'invalid_format':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      default:
        return null;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5" />
          Validation History
        </CardTitle>
        <CardDescription>
          View past API key validation attempts and results
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder="Filter by key name..."
            value={filterKeyName}
            onChange={(e) => setFilterKeyName(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleFilter()}
          />
          <Button onClick={handleFilter} variant="outline">
            Filter
          </Button>
        </div>

        <div className="space-y-3">
          {isLoading ? (
            <p className="text-center text-muted-foreground py-4">Loading...</p>
          ) : history.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">No validation history</p>
          ) : (
            history.map((record) => (
              <div key={record.id} className="p-3 border rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(record.validation_status)}
                    <span className="font-medium">{record.key_name}</span>
                    <Badge variant="outline">{record.key_type}</Badge>
                  </div>
                  <Badge variant={
                    record.validation_status === 'success' ? 'default' :
                    record.validation_status === 'failed' ? 'destructive' : 'secondary'
                  }>
                    {record.validation_status}
                  </Badge>
                </div>
                
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {record.response_time_ms}ms
                  </span>
                  <span>{new Date(record.validated_at).toLocaleString()}</span>
                </div>

                {record.error_message && (
                  <p className="text-sm text-destructive">{record.error_message}</p>
                )}

                {record.validation_details && (
                  <details className="text-xs">
                    <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                      View details
                    </summary>
                    <pre className="mt-2 bg-muted p-2 rounded overflow-auto">
                      {JSON.stringify(record.validation_details, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
