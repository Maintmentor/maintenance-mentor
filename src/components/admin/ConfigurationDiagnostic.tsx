import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';
import { CheckCircle2, XCircle, AlertCircle, Loader2, RefreshCw, Terminal } from 'lucide-react';
import { toast } from 'sonner';

interface DiagnosticResult {
  name: string;
  status: 'success' | 'error' | 'warning' | 'pending';
  message: string;
  details?: string;
}

export default function ConfigurationDiagnostic() {
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<DiagnosticResult[]>([]);

  const runDiagnostics = async () => {
    setRunning(true);
    const diagnostics: DiagnosticResult[] = [];

    // 1. Check Supabase URL
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    diagnostics.push({
      name: 'Supabase URL',
      status: supabaseUrl ? 'success' : 'error',
      message: supabaseUrl ? `Connected to ${supabaseUrl}` : 'Missing VITE_SUPABASE_URL',
      details: supabaseUrl
    });
    setResults([...diagnostics]);

    // 2. Check Supabase Anon Key
    const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    diagnostics.push({
      name: 'Supabase Anon Key',
      status: anonKey ? 'success' : 'error',
      message: anonKey ? 'Anon key configured' : 'Missing VITE_SUPABASE_ANON_KEY',
      details: anonKey ? `${anonKey.substring(0, 20)}...` : undefined
    });
    setResults([...diagnostics]);

    // 3. Test Edge Function Availability
    try {
      const testResponse = await fetch(`${supabaseUrl}/functions/v1/repair-diagnostic`, {
        method: 'OPTIONS'
      });
      
      diagnostics.push({
        name: 'Edge Function Deployed',
        status: testResponse.ok ? 'success' : 'error',
        message: testResponse.ok 
          ? 'repair-diagnostic function is deployed' 
          : `Function not responding (${testResponse.status})`,
        details: `Status: ${testResponse.status} ${testResponse.statusText}`
      });
    } catch (error: any) {
      diagnostics.push({
        name: 'Edge Function Deployed',
        status: 'error',
        message: 'Cannot reach edge function',
        details: error.message
      });
    }
    setResults([...diagnostics]);

    // 4. Test OpenAI API Key (via edge function)
    try {
      const { data, error } = await supabase.functions.invoke('repair-diagnostic', {
        body: { question: 'test' }
      });

      if (error) {
        if (error.message?.includes('OpenAI API key')) {
          diagnostics.push({
            name: 'OpenAI API Key',
            status: 'error',
            message: 'OpenAI API key not set in Supabase secrets',
            details: 'Set OPENAI_API_KEY in Supabase Dashboard > Edge Functions > Secrets'
          });
        } else {
          diagnostics.push({
            name: 'OpenAI API Key',
            status: 'warning',
            message: 'Edge function error',
            details: error.message
          });
        }
      } else if (data?.error?.includes('OpenAI API key')) {
        diagnostics.push({
          name: 'OpenAI API Key',
          status: 'error',
          message: 'OpenAI API key not configured',
          details: data.error
        });
      } else {
        diagnostics.push({
          name: 'OpenAI API Key',
          status: 'success',
          message: 'OpenAI API key is configured',
          details: 'Successfully connected to OpenAI'
        });
      }
    } catch (error: any) {
      diagnostics.push({
        name: 'OpenAI API Key',
        status: 'error',
        message: 'Failed to test API key',
        details: error.message
      });
    }
    setResults([...diagnostics]);

    // 5. Test Network Latency
    const start = Date.now();
    try {
      await fetch(`${supabaseUrl}/functions/v1/health-check`, { method: 'OPTIONS' });
      const latency = Date.now() - start;
      diagnostics.push({
        name: 'Network Latency',
        status: latency < 1000 ? 'success' : latency < 3000 ? 'warning' : 'error',
        message: `${latency}ms response time`,
        details: latency < 1000 ? 'Excellent' : latency < 3000 ? 'Acceptable' : 'Slow connection'
      });
    } catch (error) {
      diagnostics.push({
        name: 'Network Latency',
        status: 'error',
        message: 'Network test failed',
        details: 'Cannot reach Supabase'
      });
    }
    setResults([...diagnostics]);

    setRunning(false);

    const hasErrors = diagnostics.some(d => d.status === 'error');
    if (hasErrors) {
      toast.error('Configuration issues detected');
    } else {
      toast.success('All checks passed!');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle2 className="w-5 h-5 text-green-600" />;
      case 'error': return <XCircle className="w-5 h-5 text-red-600" />;
      case 'warning': return <AlertCircle className="w-5 h-5 text-yellow-600" />;
      default: return <Loader2 className="w-5 h-5 animate-spin text-gray-400" />;
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Terminal className="w-6 h-6 text-blue-600" />
          <h2 className="text-xl font-bold">Configuration Diagnostics</h2>
        </div>
        <Button onClick={runDiagnostics} disabled={running}>
          {running ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <RefreshCw className="w-4 h-4 mr-2" />}
          {running ? 'Running...' : 'Run Diagnostics'}
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
                    <h3 className="font-semibold">{result.name}</h3>
                    <Badge variant={result.status === 'success' ? 'default' : result.status === 'error' ? 'destructive' : 'secondary'}>
                      {result.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600">{result.message}</p>
                  {result.details && (
                    <p className="text-xs text-gray-500 mt-2 font-mono bg-gray-50 p-2 rounded">
                      {result.details}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {results.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <Terminal className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>Click "Run Diagnostics" to check your configuration</p>
        </div>
      )}
    </Card>
  );
}
