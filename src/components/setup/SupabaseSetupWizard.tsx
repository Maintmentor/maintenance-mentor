import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, XCircle, AlertCircle, ExternalLink } from 'lucide-react';
import { EnvValidator } from '@/utils/envValidator';

export default function SupabaseSetupWizard() {
  const [supabaseUrl, setSupabaseUrl] = useState('');
  const [supabaseKey, setSupabaseKey] = useState('');
  const [openaiKey, setOpenaiKey] = useState('');
  const [urlValidation, setUrlValidation] = useState<{ valid: boolean; error?: string }>({ valid: true });
  const [keyValidation, setKeyValidation] = useState<{ valid: boolean; error?: string }>({ valid: true });
  const [openaiValidation, setOpenaiValidation] = useState<{ valid: boolean; error?: string }>({ valid: true });
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  useEffect(() => {
    if (supabaseUrl) {
      setUrlValidation(EnvValidator.validateSupabaseUrl(supabaseUrl));
    }
  }, [supabaseUrl]);

  useEffect(() => {
    if (supabaseKey) {
      setKeyValidation(EnvValidator.validateSupabaseAnonKey(supabaseKey));
    }
  }, [supabaseKey]);

  useEffect(() => {
    if (openaiKey) {
      setOpenaiValidation(EnvValidator.validateOpenAIKey(openaiKey));
    }
  }, [openaiKey]);

  const testConnection = async () => {
    setTesting(true);
    setTestResult(null);
    
    try {
      const response = await fetch(`${supabaseUrl}/rest/v1/`, {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`
        }
      });
      
      if (response.ok || response.status === 404) {
        setTestResult({ success: true, message: 'Connection successful!' });
      } else {
        setTestResult({ success: false, message: `Connection failed: ${response.statusText}` });
      }
    } catch (error: any) {
      setTestResult({ success: false, message: `Error: ${error.message}` });
    } finally {
      setTesting(false);
    }
  };

  const generateEnvFile = () => {
    const content = `VITE_SUPABASE_URL=${supabaseUrl}
VITE_SUPABASE_ANON_KEY=${supabaseKey}
VITE_OPENAI_API_KEY=${openaiKey}`;
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = '.env';
    a.click();
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Supabase Setup Wizard</CardTitle>
        <CardDescription>Configure your Supabase credentials with real-time validation</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label>Supabase URL</Label>
          <Input
            placeholder="https://your-project.supabase.co"
            value={supabaseUrl}
            onChange={(e) => setSupabaseUrl(e.target.value)}
          />
          {supabaseUrl && !urlValidation.valid && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>{urlValidation.error}</AlertDescription>
            </Alert>
          )}
          {supabaseUrl && urlValidation.valid && (
            <Alert>
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription>Valid URL format</AlertDescription>
            </Alert>
          )}
        </div>

        <div className="space-y-2">
          <Label>Supabase Anon Key</Label>
          <Input
            placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
            value={supabaseKey}
            onChange={(e) => setSupabaseKey(e.target.value)}
            type="password"
          />
          {supabaseKey && !keyValidation.valid && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>{keyValidation.error}</AlertDescription>
            </Alert>
          )}
          {supabaseKey && keyValidation.valid && (
            <Alert>
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription>Valid JWT format</AlertDescription>
            </Alert>
          )}
        </div>

        <div className="space-y-2">
          <Label>OpenAI API Key (Optional)</Label>
          <Input
            placeholder="sk-..."
            value={openaiKey}
            onChange={(e) => setOpenaiKey(e.target.value)}
            type="password"
          />
          {openaiKey && !openaiValidation.valid && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>{openaiValidation.error}</AlertDescription>
            </Alert>
          )}
        </div>

        {testResult && (
          <Alert variant={testResult.success ? "default" : "destructive"}>
            {testResult.success ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
            <AlertDescription>{testResult.message}</AlertDescription>
          </Alert>
        )}

        <div className="flex gap-3">
          <Button
            onClick={testConnection}
            disabled={!urlValidation.valid || !keyValidation.valid || testing}
          >
            {testing ? 'Testing...' : 'Test Connection'}
          </Button>
          <Button
            onClick={generateEnvFile}
            disabled={!urlValidation.valid || !keyValidation.valid}
            variant="outline"
          >
            Download .env File
          </Button>
        </div>

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Find your credentials at{' '}
            <a href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer" className="underline inline-flex items-center gap-1">
              Supabase Dashboard <ExternalLink className="h-3 w-3" />
            </a>
            {' '}→ Settings → API
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}
