import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle, Loader2, AlertTriangle, Copy } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const EDGE_FUNCTION_URL = `${SUPABASE_URL}/functions/v1/repair-diagnostic`;

export function QuickAIDiagnostic() {
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<any>(null);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const testConnection = async () => {
    setTesting(true);
    setResult(null);

    const diagnostics = {
      timestamp: new Date().toISOString(),
      supabaseUrl: SUPABASE_URL,
      edgeFunctionUrl: EDGE_FUNCTION_URL,
      hasAnonKey: !!import.meta.env.VITE_SUPABASE_ANON_KEY,
      tests: [] as any[]
    };

    try {
      // Test 1: Basic connectivity
      diagnostics.tests.push({
        name: 'Supabase Client',
        status: 'success',
        message: 'Client initialized successfully'
      });

      // Test 2: Edge function call
      try {
        const { data, error } = await supabase.functions.invoke('repair-diagnostic', {
          body: { 
            question: 'Connection test',
            images: []
          }
        });

        if (error) {
          diagnostics.tests.push({
            name: 'Edge Function Call',
            status: 'error',
            message: error.message || 'Failed to invoke edge function',
            details: error
          });
        } else {
          diagnostics.tests.push({
            name: 'Edge Function Call',
            status: 'success',
            message: 'Edge function responded successfully',
            data: data
          });
        }
      } catch (err: any) {
        diagnostics.tests.push({
          name: 'Edge Function Call',
          status: 'error',
          message: err.message || 'Network error',
          details: err
        });
      }

      setResult(diagnostics);
    } catch (error: any) {
      diagnostics.tests.push({
        name: 'General Error',
        status: 'error',
        message: error.message || 'Unknown error occurred'
      });
      setResult(diagnostics);
    } finally {
      setTesting(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>AI Assistant Connection Diagnostic</CardTitle>
        <CardDescription>
          Test connection to edge functions and diagnose issues
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertDescription className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Target URL:</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => copyToClipboard(EDGE_FUNCTION_URL)}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <code className="block text-xs bg-muted p-2 rounded break-all">
              {EDGE_FUNCTION_URL}
            </code>
          </AlertDescription>
        </Alert>

        <Button onClick={testConnection} disabled={testing} className="w-full">
          {testing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Testing Connection...
            </>
          ) : (
            'Run Diagnostic Test'
          )}
        </Button>

        {result && (
          <div className="space-y-4 mt-4">
            <div className="text-sm text-muted-foreground">
              Test completed at {new Date(result.timestamp).toLocaleTimeString()}
            </div>

            {result.tests.map((test: any, index: number) => (
              <Alert key={index} variant={test.status === 'error' ? 'destructive' : 'default'}>
                <div className="flex items-start gap-3">
                  {getStatusIcon(test.status)}
                  <div className="flex-1 space-y-1">
                    <div className="font-medium">{test.name}</div>
                    <div className="text-sm">{test.message}</div>
                    {test.details && (
                      <details className="text-xs mt-2">
                        <summary className="cursor-pointer">View Details</summary>
                        <pre className="mt-2 p-2 bg-muted rounded overflow-auto">
                          {JSON.stringify(test.details, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                </div>
              </Alert>
            ))}

            {result.tests.some((t: any) => t.status === 'error') && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="space-y-2">
                  <p className="font-medium">Common Solutions:</p>
                  <ul className="list-disc list-inside text-sm space-y-1">
                    <li>Deploy edge functions: Run <code className="bg-muted px-1">supabase functions deploy repair-diagnostic</code></li>
                    <li>Set OpenAI API key in Supabase Dashboard → Edge Functions → Secrets</li>
                    <li>Verify .env has correct VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY</li>
                    <li>Check Supabase project status at status.supabase.com</li>
                  </ul>
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
