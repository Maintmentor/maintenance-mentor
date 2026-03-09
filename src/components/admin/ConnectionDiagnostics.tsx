import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/lib/supabase';
import { CheckCircle2, XCircle, Loader2, AlertTriangle } from 'lucide-react';

interface DiagnosticResult {
  name: string;
  status: 'success' | 'error' | 'warning' | 'testing';
  message: string;
  details?: string;
}

export default function ConnectionDiagnostics() {
  const [results, setResults] = useState<DiagnosticResult[]>([]);
  const [testing, setTesting] = useState(false);

  const runDiagnostics = async () => {
    setTesting(true);
    const diagnostics: DiagnosticResult[] = [];

    // Test 1: Environment Variables
    diagnostics.push({
      name: 'Environment Variables',
      status: 'testing',
      message: 'Checking configuration...'
    });
    setResults([...diagnostics]);

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    if (supabaseUrl && supabaseKey) {
      diagnostics[0] = {
        name: 'Environment Variables',
        status: 'success',
        message: 'All required variables present',
        details: `URL: ${supabaseUrl.substring(0, 30)}...`
      };
    } else {
      diagnostics[0] = {
        name: 'Environment Variables',
        status: 'error',
        message: 'Missing required environment variables',
        details: `URL: ${supabaseUrl ? '✓' : '✗'}, Key: ${supabaseKey ? '✓' : '✗'}`
      };
    }
    setResults([...diagnostics]);

    // Test 2: Database Connection
    diagnostics.push({
      name: 'Database Connection',
      status: 'testing',
      message: 'Testing database...'
    });
    setResults([...diagnostics]);

    try {
      const { data, error } = await supabase.from('slack_webhook_config').select('count').limit(1);
      if (error) throw error;
      diagnostics[1] = {
        name: 'Database Connection',
        status: 'success',
        message: 'Database connected successfully'
      };
    } catch (error: any) {
      diagnostics[1] = {
        name: 'Database Connection',
        status: 'error',
        message: 'Database connection failed',
        details: error.message
      };
    }
    setResults([...diagnostics]);

    // Test 3: Edge Functions
    diagnostics.push({
      name: 'Edge Functions',
      status: 'testing',
      message: 'Testing edge functions...'
    });
    setResults([...diagnostics]);

    try {
      const { error } = await supabase.functions.invoke('slack-alert-sender', {
        body: {
          keyName: 'TEST',
          alertType: 'info',
          healthScore: 100,
          errorMessage: 'Diagnostic test',
          lastValidated: new Date().toISOString()
        }
      });

      if (error) throw error;
      diagnostics[2] = {
        name: 'Edge Functions',
        status: 'warning',
        message: 'Edge function accessible',
        details: 'No webhooks configured (expected for test)'
      };
    } catch (error: any) {
      diagnostics[2] = {
        name: 'Edge Functions',
        status: 'error',
        message: 'Edge function failed',
        details: error.message
      };
    }
    setResults([...diagnostics]);

    // Test 4: Authentication
    diagnostics.push({
      name: 'Authentication',
      status: 'testing',
      message: 'Checking auth status...'
    });
    setResults([...diagnostics]);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        diagnostics[3] = {
          name: 'Authentication',
          status: 'success',
          message: 'User authenticated',
          details: `User ID: ${user.id.substring(0, 8)}...`
        };
      } else {
        diagnostics[3] = {
          name: 'Authentication',
          status: 'warning',
          message: 'No user logged in'
        };
      }
    } catch (error: any) {
      diagnostics[3] = {
        name: 'Authentication',
        status: 'error',
        message: 'Auth check failed',
        details: error.message
      };
    }
    setResults([...diagnostics]);

    setTesting(false);
  };

  const getStatusIcon = (status: DiagnosticResult['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'testing':
        return <Loader2 className="h-5 w-5 animate-spin text-blue-500" />;
    }
  };

  const getStatusBadge = (status: DiagnosticResult['status']) => {
    const variants = {
      success: 'default',
      error: 'destructive',
      warning: 'secondary',
      testing: 'outline'
    };
    return <Badge variant={variants[status] as any}>{status}</Badge>;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Connection Diagnostics</CardTitle>
        <CardDescription>
          Test all system connections and identify issues
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button onClick={runDiagnostics} disabled={testing}>
          {testing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Running Tests...
            </>
          ) : (
            'Run Diagnostics'
          )}
        </Button>

        {results.length > 0 && (
          <div className="space-y-3">
            {results.map((result, index) => (
              <Alert key={index}>
                <div className="flex items-start gap-3">
                  {getStatusIcon(result.status)}
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h4 className="font-semibold">{result.name}</h4>
                      {getStatusBadge(result.status)}
                    </div>
                    <AlertDescription>
                      {result.message}
                      {result.details && (
                        <div className="mt-1 text-xs text-muted-foreground">
                          {result.details}
                        </div>
                      )}
                    </AlertDescription>
                  </div>
                </div>
              </Alert>
            ))}
          </div>
        )}

        {results.length > 0 && !testing && (
          <Alert>
            <AlertDescription>
              <strong>Next Steps:</strong>
              <ul className="mt-2 space-y-1 text-sm">
                {results.some(r => r.status === 'error') && (
                  <li>• Review CONNECTION_TROUBLESHOOTING.md for detailed solutions</li>
                )}
                {results.some(r => r.name === 'Edge Functions' && r.status === 'error') && (
                  <li>• Deploy edge functions: supabase functions deploy</li>
                )}
                {results.some(r => r.name === 'Database Connection' && r.status === 'error') && (
                  <li>• Run migrations: supabase db push</li>
                )}
                {results.some(r => r.name === 'Environment Variables' && r.status === 'error') && (
                  <li>• Update .env file with Supabase credentials</li>
                )}
              </ul>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
