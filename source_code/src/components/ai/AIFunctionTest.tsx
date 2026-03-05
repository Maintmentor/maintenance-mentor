import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function AIFunctionTest() {
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const testFunction = async () => {
    setTesting(true);
    setError(null);
    setResult(null);

    try {
      console.log('Testing repair-diagnostic function...');
      
      const { data, error: functionError } = await supabase.functions.invoke('repair-diagnostic', {
        body: {
          message: 'Test message: My water heater is making a popping noise',
          images: null,
          conversationHistory: []
        }
      });

      console.log('Test response:', { data, functionError });

      if (functionError) {
        throw new Error(`Function error: ${functionError.message}`);
      }

      if (!data) {
        throw new Error('No response from function');
      }

      setResult(data);
    } catch (err: any) {
      console.error('Test error:', err);
      setError(err.message || 'Unknown error');
    } finally {
      setTesting(false);
    }
  };

  return (
    <Card className="p-6 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">AI Function Diagnostic Test</h2>
      
      <div className="space-y-4">
        <p className="text-sm text-gray-600">
          This test will verify if the repair-diagnostic edge function is working correctly.
        </p>

        <Button onClick={testFunction} disabled={testing} className="w-full">
          {testing ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Testing...
            </>
          ) : (
            'Run Diagnostic Test'
          )}
        </Button>

        {error && (
          <Alert className="border-red-200 bg-red-50">
            <XCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              <strong>Error:</strong> {error}
              <div className="mt-2 text-xs">
                <p>Possible causes:</p>
                <ul className="list-disc ml-4 mt-1">
                  <li>OpenAI API key not configured</li>
                  <li>Edge function not deployed</li>
                  <li>API key invalid or out of credits</li>
                  <li>Network connectivity issue</li>
                </ul>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {result && (
          <div className="space-y-3">
            {result.content ? (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  <strong>✓ Success!</strong> AI function is working correctly.
                </AlertDescription>
              </Alert>
            ) : (
              <Alert className="border-yellow-200 bg-yellow-50">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <AlertDescription className="text-yellow-800">
                  <strong>Warning:</strong> Function responded but no content received.
                </AlertDescription>
              </Alert>
            )}

            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Response Details:</h3>
              <pre className="text-xs overflow-auto max-h-96 whitespace-pre-wrap">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
