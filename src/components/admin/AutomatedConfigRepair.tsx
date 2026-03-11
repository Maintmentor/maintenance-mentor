import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle, XCircle, AlertTriangle, RefreshCw, Key } from 'lucide-react';
import { envRepairService } from '@/services/envRepairService';
import { toast } from 'sonner';

export function AutomatedConfigRepair() {
  const [apiKey, setApiKey] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [configStatus, setConfigStatus] = useState<any>(null);
  const [validationResult, setValidationResult] = useState<any>(null);
  const [showKeyInput, setShowKeyInput] = useState(false);

  useEffect(() => {
    checkConfiguration();
  }, []);

  const checkConfiguration = async () => {
    setIsChecking(true);
    try {
      const status = await envRepairService.checkOpenAIKey();
      setConfigStatus(status);
      envRepairService.saveConfigStatus(status);
      
      if (!status.hasOpenAIKey || !status.keyValid) {
        setShowKeyInput(true);
      }
    } catch (error: any) {
      toast.error('Failed to check configuration');
    } finally {
      setIsChecking(false);
    }
  };

  const validateAndSetKey = async () => {
    if (!apiKey.trim()) {
      toast.error('Please enter an API key');
      return;
    }

    setIsValidating(true);
    setValidationResult(null);

    try {
      const result = await envRepairService.validateOpenAIKey(apiKey);
      setValidationResult(result);

      if (result.valid) {
        toast.success('API key validated successfully!');
        toast.info('Please set this key in Supabase Dashboard > Settings > Edge Functions > Secrets');
        setShowKeyInput(false);
        setTimeout(() => checkConfiguration(), 2000);
      } else {
        toast.error(result.error || 'API key validation failed');
      }
    } catch (error: any) {
      toast.error('Validation failed: ' + error.message);
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Key className="h-5 w-5" />
          Automated Configuration Repair
        </CardTitle>
        <CardDescription>
          Detect and repair missing API keys and configuration issues
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status Overview */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">OpenAI API Key Status</span>
            {configStatus && (
              <Badge variant={configStatus.keyValid ? 'default' : 'destructive'}>
                {configStatus.keyValid ? (
                  <><CheckCircle className="h-3 w-3 mr-1" /> Valid</>
                ) : (
                  <><XCircle className="h-3 w-3 mr-1" /> Missing/Invalid</>
                )}
              </Badge>
            )}
          </div>
          
          <Button
            onClick={checkConfiguration}
            disabled={isChecking}
            variant="outline"
            size="sm"
            className="w-full"
          >
            {isChecking ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Checking...</>
            ) : (
              <><RefreshCw className="h-4 w-4 mr-2" /> Check Configuration</>
            )}
          </Button>
        </div>

        {/* Error Alert */}
        {configStatus?.error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{configStatus.error}</AlertDescription>
          </Alert>
        )}

        {/* API Key Input Section */}
        {showKeyInput && (
          <div className="space-y-3 p-4 border rounded-lg bg-muted/50">
            <div className="space-y-2">
              <label className="text-sm font-medium">Enter OpenAI API Key</label>
              <Input
                type="password"
                placeholder="sk-..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Your API key starts with "sk-" and can be found at platform.openai.com
              </p>
            </div>

            <Button
              onClick={validateAndSetKey}
              disabled={isValidating || !apiKey.trim()}
              className="w-full"
            >
              {isValidating ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Validating...</>
              ) : (
                <>Validate & Get Setup Instructions</>
              )}
            </Button>
          </div>
        )}

        {/* Validation Result */}
        {validationResult && (
          <Alert variant={validationResult.valid ? 'default' : 'destructive'}>
            {validationResult.valid ? (
              <CheckCircle className="h-4 w-4" />
            ) : (
              <XCircle className="h-4 w-4" />
            )}
            <AlertDescription>
              {validationResult.message || validationResult.error}
            </AlertDescription>
          </Alert>
        )}

        {/* Manual Setup Instructions */}
        {validationResult?.valid && (
          <div className="space-y-2 p-4 border rounded-lg bg-blue-50 dark:bg-blue-950">
            <h4 className="font-semibold text-sm">Setup Instructions:</h4>
            <ol className="text-sm space-y-1 list-decimal list-inside">
              <li>Go to Supabase Dashboard</li>
              <li>Navigate to Settings → Edge Functions</li>
              <li>Click on "Secrets" tab</li>
              <li>Add secret: OPENAI_API_KEY</li>
              <li>Paste your validated API key</li>
              <li>Save and redeploy edge functions</li>
            </ol>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
