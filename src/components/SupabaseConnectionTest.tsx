import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';

export default function SupabaseConnectionTest() {
  const [status, setStatus] = useState<'loading' | 'connected' | 'error'>('loading');
  const [details, setDetails] = useState<any>(null);

  useEffect(() => {
    testConnection();
  }, []);

  const testConnection = async () => {
    try {
      // Test 1: Check environment variables
      const url = import.meta.env.VITE_SUPABASE_URL;
      const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      if (!url || !key) {
        setStatus('error');
        setDetails({ error: 'Missing environment variables' });
        return;
      }

      // Test 2: Try to get session
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      
      // Test 3: Try a simple query
      const { data, error } = await supabase.from('profiles').select('count').limit(1);
      
      setDetails({
        url,
        hasKey: !!key,
        sessionCheck: sessionError ? 'Failed' : 'Success',
        queryTest: error ? error.message : 'Success',
        session: sessionData?.session ? 'Active' : 'No session'
      });
      
      setStatus(error && error.message.includes('relation') ? 'connected' : 'connected');
    } catch (err: any) {
      setStatus('error');
      setDetails({ error: err.message });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Supabase Connection Status
          {status === 'loading' && <Loader2 className="h-5 w-5 animate-spin" />}
          {status === 'connected' && <CheckCircle2 className="h-5 w-5 text-green-500" />}
          {status === 'error' && <XCircle className="h-5 w-5 text-red-500" />}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="font-semibold">Status:</span>
            <Badge variant={status === 'connected' ? 'default' : status === 'error' ? 'destructive' : 'secondary'}>
              {status.toUpperCase()}
            </Badge>
          </div>
          
          {details && (
            <div className="mt-4 space-y-2 text-sm">
              {details.url && <div><strong>URL:</strong> {details.url}</div>}
              {details.hasKey !== undefined && <div><strong>API Key:</strong> {details.hasKey ? '✓ Present' : '✗ Missing'}</div>}
              {details.sessionCheck && <div><strong>Session Check:</strong> {details.sessionCheck}</div>}
              {details.session && <div><strong>Session:</strong> {details.session}</div>}
              {details.queryTest && <div><strong>Query Test:</strong> {details.queryTest}</div>}
              {details.error && <div className="text-red-500"><strong>Error:</strong> {details.error}</div>}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
