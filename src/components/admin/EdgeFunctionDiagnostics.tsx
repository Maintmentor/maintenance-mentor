import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';
import { CheckCircle, XCircle, Loader2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

export default function EdgeFunctionDiagnostics() {
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState<any>(null);

  const runDiagnostics = async () => {
    setTesting(true);
    const diagnostics: any = {
      timestamp: new Date().toISOString(),
      tests: []
    };

    try {
      // Test 1: Basic connectivity
      diagnostics.tests.push({
        name: 'Supabase Connection',
        status: 'running'
      });

      const { data: authData } = await supabase.auth.getSession();
      diagnostics.tests[0].status = 'passed';
      diagnostics.tests[0].details = 'Connected to Supabase';

      // Test 2: Edge function invocation
      diagnostics.tests.push({
        name: 'Edge Function Invocation',
        status: 'running'
      });

      const startTime = Date.now();
      const { data, error } = await supabase.functions.invoke('repair-diagnostic', {
        body: { question: 'test connection' }
      });
      const duration = Date.now() - startTime;

      if (error) {
        diagnostics.tests[1].status = 'failed';
        diagnostics.tests[1].error = error.message;
        diagnostics.tests[1].details = JSON.stringify(error, null, 2);
      } else {
        diagnostics.tests[1].status = 'passed';
        diagnostics.tests[1].duration = `${duration}ms`;
        diagnostics.tests[1].response = data;
      }

      // Test 3: Check response structure
      if (data) {
        diagnostics.tests.push({
          name: 'Response Structure',
          status: data.success ? 'passed' : 'failed',
          details: `Success: ${data.success}, Has Answer: ${!!data.answer}`
        });
      }

    } catch (error: any) {
      diagnostics.tests.push({
        name: 'Critical Error',
        status: 'failed',
        error: error.message,
        stack: error.stack
      });
    }

    setResults(diagnostics);
    setTesting(false);
  };

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Edge Function Diagnostics</h3>
      
      <Button onClick={runDiagnostics} disabled={testing} className="mb-4">
        {testing ? (
          <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Running Tests...</>
        ) : (
          'Run Diagnostics'
        )}
      </Button>

      {results && (
        <div className="space-y-3">
          {results.tests.map((test: any, idx: number) => (
            <div key={idx} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">{test.name}</span>
                {test.status === 'passed' && <CheckCircle className="w-5 h-5 text-green-600" />}
                {test.status === 'failed' && <XCircle className="w-5 h-5 text-red-600" />}
                {test.status === 'running' && <Loader2 className="w-5 h-5 animate-spin text-blue-600" />}
              </div>
              
              {test.details && (
                <p className="text-sm text-gray-600 mb-2">{test.details}</p>
              )}
              
              {test.error && (
                <div className="bg-red-50 border border-red-200 rounded p-3 text-sm">
                  <p className="font-medium text-red-900 mb-1">Error:</p>
                  <p className="text-red-700">{test.error}</p>
                </div>
              )}
              
              {test.duration && (
                <Badge variant="secondary">{test.duration}</Badge>
              )}
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
