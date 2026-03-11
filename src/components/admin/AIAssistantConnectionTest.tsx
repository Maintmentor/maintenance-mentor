import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';
import { CheckCircle, XCircle, Loader2, AlertCircle, RefreshCw } from 'lucide-react';

interface TestResult {
  name: string;
  status: 'pending' | 'success' | 'error' | 'warning';
  message: string;
  details?: string;
}

export default function AIAssistantConnectionTest() {
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState<TestResult[]>([]);

  const runTests = async () => {
    setTesting(true);
    const testResults: TestResult[] = [];

    // Test 1: Supabase Connection
    try {
      const { data, error } = await supabase.from('profiles').select('count').limit(1);
      testResults.push({
        name: 'Supabase Connection',
        status: error ? 'error' : 'success',
        message: error ? 'Failed to connect' : 'Connected successfully',
        details: error?.message
      });
    } catch (e: any) {
      testResults.push({
        name: 'Supabase Connection',
        status: 'error',
        message: 'Connection failed',
        details: e.message
      });
    }

    // Test 2: Environment Variables
    const hasUrl = !!import.meta.env.VITE_SUPABASE_URL;
    const hasKey = !!import.meta.env.VITE_SUPABASE_ANON_KEY;
    testResults.push({
      name: 'Environment Variables',
      status: hasUrl && hasKey ? 'success' : 'error',
      message: hasUrl && hasKey ? 'All variables present' : 'Missing variables',
      details: `URL: ${hasUrl ? '✓' : '✗'}, Key: ${hasKey ? '✓' : '✗'}`
    });

    // Test 3: Edge Function Health
    try {
      const { data, error } = await supabase.functions.invoke('health-check');
      testResults.push({
        name: 'Edge Functions Health',
        status: error ? 'warning' : 'success',
        message: error ? 'Health check unavailable' : 'Functions operational',
        details: error?.message || JSON.stringify(data)
      });
    } catch (e: any) {
      testResults.push({
        name: 'Edge Functions Health',
        status: 'warning',
        message: 'Health check failed',
        details: e.message
      });
    }

    // Test 4: Repair Diagnostic Function
    try {
      const { data, error } = await supabase.functions.invoke('repair-diagnostic', {
        body: { question: 'test connection', userId: 'test' }
      });
      
      testResults.push({
        name: 'Repair Diagnostic Function',
        status: error ? 'error' : data?.success ? 'success' : 'warning',
        message: error ? 'Function error' : data?.success ? 'Working correctly' : 'Function returned error',
        details: error?.message || data?.error || JSON.stringify(data)
      });
    } catch (e: any) {
      testResults.push({
        name: 'Repair Diagnostic Function',
        status: 'error',
        message: 'Failed to invoke',
        details: e.message
      });
    }

    setResults(testResults);
    setTesting(false);
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'success': return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'error': return <XCircle className="w-5 h-5 text-red-600" />;
      case 'warning': return <AlertCircle className="w-5 h-5 text-yellow-600" />;
      default: return <Loader2 className="w-5 h-5 animate-spin text-gray-400" />;
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold">AI Assistant Connection Test</h3>
          <p className="text-sm text-gray-600">Diagnose connection issues</p>
        </div>
        <Button onClick={runTests} disabled={testing}>
          {testing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <RefreshCw className="w-4 h-4 mr-2" />}
          Run Tests
        </Button>
      </div>

      {results.length > 0 && (
        <div className="space-y-3">
          {results.map((result, idx) => (
            <div key={idx} className="border rounded-lg p-4">
              <div className="flex items-start gap-3">
                {getStatusIcon(result.status)}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium">{result.name}</span>
                    <Badge variant={result.status === 'success' ? 'default' : result.status === 'error' ? 'destructive' : 'secondary'}>
                      {result.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600">{result.message}</p>
                  {result.details && (
                    <pre className="mt-2 text-xs bg-gray-50 p-2 rounded overflow-x-auto">{result.details}</pre>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
