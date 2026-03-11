import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/lib/supabase';
import { CheckCircle2, XCircle, Loader2, RefreshCw, ExternalLink, Copy } from 'lucide-react';
import { toast } from 'sonner';

export default function AIConnectionStatus() {
  const [status, setStatus] = useState<'checking' | 'connected' | 'error' | 'unchecked'>('unchecked');
  const [errorMessage, setErrorMessage] = useState('');
  const [checking, setChecking] = useState(false);

  const checkConnection = async () => {
    setChecking(true);
    setStatus('checking');
    
    try {
      const { data, error } = await supabase.functions.invoke('repair-diagnostic', {
        body: { question: 'connection test' }
      });

      if (error) {
        setStatus('error');
        setErrorMessage(error.message);
      } else if (data?.error) {
        setStatus('error');
        setErrorMessage(data.error);
      } else if (data?.success) {
        setStatus('connected');
        setErrorMessage('');
      } else {
        setStatus('error');
        setErrorMessage('Unexpected response from AI service');
      }
    } catch (error: any) {
      setStatus('error');
      setErrorMessage(error.message || 'Connection failed');
    } finally {
      setChecking(false);
    }
  };

  useEffect(() => {
    checkConnection();
  }, []);

  const copyCommand = (cmd: string) => {
    navigator.clipboard.writeText(cmd);
    toast.success('Copied to clipboard');
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h3 className="text-lg font-semibold">AI Connection Status</h3>
          {status === 'checking' && <Loader2 className="w-5 h-5 animate-spin text-blue-500" />}
          {status === 'connected' && <CheckCircle2 className="w-5 h-5 text-green-500" />}
          {status === 'error' && <XCircle className="w-5 h-5 text-red-500" />}
        </div>
        <Button onClick={checkConnection} disabled={checking} size="sm" variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          Recheck
        </Button>
      </div>

      {status === 'connected' && (
        <Alert className="bg-green-50 border-green-200">
          <CheckCircle2 className="w-4 h-4 text-green-600" />
          <AlertDescription className="text-green-800">
            AI assistant is connected and working properly
          </AlertDescription>
        </Alert>
      )}

      {status === 'error' && (
        <div className="space-y-4">
          <Alert variant="destructive">
            <XCircle className="w-4 h-4" />
            <AlertDescription>
              <strong>Connection Error:</strong> {errorMessage}
            </AlertDescription>
          </Alert>

          <div className="bg-gray-50 p-4 rounded-lg space-y-3">
            <h4 className="font-semibold text-sm">Quick Fix:</h4>
            
            {errorMessage.includes('OpenAI') && (
              <div className="space-y-2">
                <p className="text-sm text-gray-700">Add OpenAI API key to Supabase:</p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => window.open('https://app.supabase.com/project/kudlclzjfihbphehhiii/settings/functions', '_blank')}
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Open Supabase Settings
                </Button>
              </div>
            )}

            {errorMessage.includes('not found') && (
              <div className="space-y-2">
                <p className="text-sm text-gray-700">Deploy edge function:</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-white px-3 py-2 rounded text-xs">
                    npx supabase functions deploy repair-diagnostic
                  </code>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copyCommand('npx supabase functions deploy repair-diagnostic')}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}

            <Button
              size="sm"
              onClick={() => window.open('/test-ai-connection.html', '_blank')}
              className="w-full"
            >
              Run Detailed Diagnostics
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
