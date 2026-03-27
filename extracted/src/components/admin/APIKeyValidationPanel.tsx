import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, CheckCircle, XCircle, Shield, Clock } from 'lucide-react';
import { edgeFunctionDeploymentService, ValidationResult } from '@/services/edgeFunctionDeploymentService';

export default function APIKeyValidationPanel() {
  const [keyName, setKeyName] = useState('');
  const [keyType, setKeyType] = useState('openai');
  const [apiKey, setApiKey] = useState('');
  const [projectUrl, setProjectUrl] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);

  const handleValidate = async () => {
    if (!apiKey.trim()) {
      setValidationResult({
        valid: false,
        status: 'failed',
        error: 'Please enter an API key',
        responseTimeMs: 0
      });
      return;
    }

    setIsValidating(true);
    setValidationResult(null);

    const result = await edgeFunctionDeploymentService.validateApiKey(
      keyName || keyType,
      keyType,
      apiKey,
      projectUrl
    );

    setValidationResult(result);
    setIsValidating(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          API Key Validation
        </CardTitle>
        <CardDescription>
          Test API keys before saving them to ensure they work correctly
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="keyType">Key Type</Label>
            <Select value={keyType} onValueChange={setKeyType}>
              <SelectTrigger id="keyType">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="openai">OpenAI</SelectItem>
                <SelectItem value="stripe">Stripe</SelectItem>
                <SelectItem value="supabase_anon">Supabase Anon</SelectItem>
                <SelectItem value="supabase_service">Supabase Service</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="keyName">Key Name (Optional)</Label>
            <Input
              id="keyName"
              value={keyName}
              onChange={(e) => setKeyName(e.target.value)}
              placeholder="My API Key"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="apiKey">API Key</Label>
          <Input
            id="apiKey"
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="Enter API key to validate"
            disabled={isValidating}
          />
        </div>

        {(keyType === 'supabase_anon' || keyType === 'supabase_service') && (
          <div className="space-y-2">
            <Label htmlFor="projectUrl">Project URL</Label>
            <Input
              id="projectUrl"
              value={projectUrl}
              onChange={(e) => setProjectUrl(e.target.value)}
              placeholder="https://your-project.supabase.co"
              disabled={isValidating}
            />
          </div>
        )}

        {validationResult && (
          <Alert variant={validationResult.valid ? 'default' : 'destructive'}>
            <div className="flex items-start gap-3">
              {validationResult.valid ? (
                <CheckCircle className="h-5 w-5 mt-0.5" />
              ) : (
                <XCircle className="h-5 w-5 mt-0.5" />
              )}
              <div className="flex-1 space-y-2">
                <AlertDescription className="font-medium">
                  {validationResult.valid ? 'Validation Successful' : 'Validation Failed'}
                </AlertDescription>
                {validationResult.error && (
                  <AlertDescription className="text-sm">
                    {validationResult.error}
                  </AlertDescription>
                )}
                <div className="flex items-center gap-4 text-sm">
                  <Badge variant={validationResult.status === 'success' ? 'default' : 'destructive'}>
                    {validationResult.status}
                  </Badge>
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {validationResult.responseTimeMs}ms
                  </span>
                </div>
                {validationResult.details && (
                  <pre className="text-xs bg-muted p-2 rounded mt-2 overflow-auto">
                    {JSON.stringify(validationResult.details, null, 2)}
                  </pre>
                )}
              </div>
            </div>
          </Alert>
        )}

        <Button onClick={handleValidate} disabled={isValidating} className="w-full">
          {isValidating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Validating...
            </>
          ) : (
            <>
              <Shield className="mr-2 h-4 w-4" />
              Validate API Key
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
