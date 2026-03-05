import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';
import { CheckCircle2, XCircle, Loader2, AlertTriangle, RefreshCw } from 'lucide-react';

export default function AIConnectionDiagnostics() {
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState<any>(null);

  const runDiagnostics = async () => {
    setTesting(true);
    const diagnostics: any = {
      supabaseConnection: { status: 'pending', message: '' },
      edgeFunction: { status: 'pending', message: '' },
      openaiKey: { status: 'pending', message: '' },
      aiResponse: { status: 'pending', message: '' }
    };

    // Test 1: Supabase Connection
    try {
      const { data, error } = await supabase.from('profiles').select('count').limit(1);
      if (error) throw error;
      diagnostics.supabaseConnection = { 
        status: 'success', 
        message: 'Connected to Supabase successfully' 
      };
    } catch (error: any) {
      diagnostics.supabaseConnection = { 
        status: 'error', 
        message: `Supabase error: ${error.message}` 
      };
    }

    // Test 2: Edge Function Exists
    try {
      const { data, error } = await supabase.functions.invoke('repair-diagnostic', {
        body: { question: 'test connection' }
      });
      
      if (error) {
        diagnostics.edgeFunction = { 
          status: 'error', 
          message: `Edge function error: ${error.message}` 
        };
      } else {
        diagnostics.edgeFunction = { 
          status: 'success', 
          message: 'Edge function is deployed and accessible' 
        };
        
        // Test 3: OpenAI Key
        if (data?.error?.includes('OpenAI API key')) {
          diagnostics.openaiKey = { 
            status: 'error', 
            message: 'OpenAI API key not configured in Supabase secrets' 
          };
        } else {
          diagnostics.openaiKey = { 
            status: 'success', 
            message: 'OpenAI API key is configured' 
          };
        }
        
        // Test 4: AI Response
        if (data?.success && data?.answer) {
          diagnostics.aiResponse = { 
            status: 'success', 
            message: `AI responded: "${data.answer.substring(0, 50)}..."` 
          };
        } else if (data?.error) {
          diagnostics.aiResponse = { 
            status: 'error', 
            message: `AI error: ${data.error}` 
          };
        }
      }
    } catch (error: any) {
      diagnostics.edgeFunction = { 
        status: 'error', 
        message: `Connection failed: ${error.message}` 
      };
    }

    setResults(diagnostics);
    setTesting(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case 'error': return <XCircle className="w-5 h-5 text-red-500" />;
      case 'warning': return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      default: return <Loader2 className="w-5 h-5 animate-spin text-gray-400" />;
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold">AI Connection Diagnostics</h3>
          <p className="text-sm text-gray-600">Test your AI assistant connection</p>
        </div>
        <Button onClick={runDiagnostics} disabled={testing}>
          {testing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <RefreshCw className="w-4 h-4 mr-2" />}
          Run Tests
        </Button>
      </div>

      {results && (
        <div className="space-y-4">
          {Object.entries(results).map(([key, value]: [string, any]) => (
            <div key={key} className="flex items-start gap-3 p-4 border rounded-lg">
              {getStatusIcon(value.status)}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                  <Badge variant={value.status === 'success' ? 'default' : 'destructive'}>
                    {value.status}
                  </Badge>
                </div>
                <p className="text-sm text-gray-600">{value.message}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {!results && (
        <div className="text-center py-8 text-gray-500">
          Click "Run Tests" to diagnose AI connection issues
        </div>
      )}
    </Card>
  );
}
