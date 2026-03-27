import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, CheckCircle, XCircle, RotateCcw, Key, Rocket, Shield } from 'lucide-react';
import { edgeFunctionDeploymentService, DeploymentRecord, ValidationResult } from '@/services/edgeFunctionDeploymentService';
import { Progress } from '@/components/ui/progress';
import APIKeyValidationPanel from './APIKeyValidationPanel';
import ValidationHistoryViewer from './ValidationHistoryViewer';


export default function EdgeFunctionDeploymentManager() {
  const [apiKey, setApiKey] = useState('');
  const [secretName, setSecretName] = useState('OPENAI_API_KEY');
  const [isValidating, setIsValidating] = useState(false);
  const [isDeploying, setIsDeploying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('');
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
  const [deploymentHistory, setDeploymentHistory] = useState<DeploymentRecord[]>([]);
  const [secrets, setSecrets] = useState<any[]>([]);

  useEffect(() => {
    loadDeploymentHistory();
    loadSecrets();
  }, []);

  const loadDeploymentHistory = async () => {
    const history = await edgeFunctionDeploymentService.getDeploymentHistory(10);
    setDeploymentHistory(history);
  };

  const loadSecrets = async () => {
    const result = await edgeFunctionDeploymentService.listSecrets();
    if (result.success && result.secrets) {
      setSecrets(result.secrets);
    }
  };

  const handleSetSecret = async () => {
    if (!apiKey.trim()) {
      setResult({ success: false, message: 'Please enter an API key' });
      return;
    }

    setIsDeploying(true);
    setProgress(0);
    setResult(null);

    try {
      // Step 1: Validate API key format
      setCurrentStep('Validating API key format...');
      setProgress(20);
      
      if (!apiKey.startsWith('sk-')) {
        throw new Error('Invalid OpenAI API key format');
      }

      // Step 2: Set secret in Supabase
      setCurrentStep('Setting secret in Supabase...');
      setProgress(40);

      const deploymentId = await edgeFunctionDeploymentService.createDeploymentRecord(
        'repair-diagnostic',
        'auto',
        { secretName, secretValue: '***' },
        { secretName, secretValue: '***' }
      );

      const setResult = await edgeFunctionDeploymentService.setSecret(secretName, apiKey);
      
      if (!setResult.success) {
        if (deploymentId) {
          await edgeFunctionDeploymentService.updateDeploymentStatus(deploymentId, 'failed', setResult.error);
        }
        throw new Error(setResult.error || 'Failed to set secret');
      }

      // Step 3: Redeploy edge functions
      setCurrentStep('Redeploying edge functions...');
      setProgress(70);

      const redeployResult = await edgeFunctionDeploymentService.redeployFunction('repair-diagnostic');
      
      if (!redeployResult.success) {
        if (deploymentId) {
          await edgeFunctionDeploymentService.updateDeploymentStatus(deploymentId, 'failed', redeployResult.error);
        }
        throw new Error(redeployResult.error || 'Failed to redeploy functions');
      }

      // Step 4: Complete
      setCurrentStep('Deployment complete!');
      setProgress(100);

      if (deploymentId) {
        await edgeFunctionDeploymentService.updateDeploymentStatus(deploymentId, 'completed');
      }

      setResult({ 
        success: true, 
        message: 'API key set and edge functions redeployed successfully!' 
      });

      // Reload data
      await loadDeploymentHistory();
      await loadSecrets();
      
      // Clear form
      setApiKey('');
    } catch (error: any) {
      setResult({ success: false, message: error.message });
    } finally {
      setIsDeploying(false);
      setProgress(0);
      setCurrentStep('');
    }
  };

  const handleRollback = async (deploymentId: string) => {
    if (!confirm('Are you sure you want to rollback this deployment?')) return;

    setIsValidating(true);
    const result = await edgeFunctionDeploymentService.rollbackDeployment(deploymentId);
    setIsValidating(false);

    if (result.success) {
      setResult({ success: true, message: 'Deployment rolled back successfully' });
      await loadDeploymentHistory();
    } else {
      setResult({ success: false, message: result.error || 'Rollback failed' });
    }
  };

  return (
    <div className="space-y-6">
      <APIKeyValidationPanel />


      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Rocket className="h-5 w-5" />
            Automated Configuration & Deployment
          </CardTitle>
          <CardDescription>
            Set API keys and automatically redeploy edge functions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="secretName">Secret Name</Label>
            <Input
              id="secretName"
              value={secretName}
              onChange={(e) => setSecretName(e.target.value)}
              placeholder="OPENAI_API_KEY"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="apiKey">API Key Value</Label>
            <Input
              id="apiKey"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-..."
              disabled={isDeploying}
            />
          </div>

          {isDeploying && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>{currentStep}</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} />
            </div>
          )}

          {result && (
            <Alert variant={result.success ? 'default' : 'destructive'}>
              {result.success ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
              <AlertDescription>{result.message}</AlertDescription>
            </Alert>
          )}

          <Button onClick={handleSetSecret} disabled={isDeploying} className="w-full">
            {isDeploying ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deploying...
              </>
            ) : (
              <>
                <Key className="mr-2 h-4 w-4" />
                Set Secret & Deploy
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Deployment History</CardTitle>
          <CardDescription>Recent configuration changes and deployments</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {deploymentHistory.map((deployment) => (
              <div key={deployment.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{deployment.function_name}</span>
                    <Badge variant={
                      deployment.status === 'completed' ? 'default' :
                      deployment.status === 'failed' ? 'destructive' : 'secondary'
                    }>
                      {deployment.status}
                    </Badge>
                    <Badge variant="outline">{deployment.deployment_type}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {new Date(deployment.created_at).toLocaleString()}
                  </p>
                  {deployment.error_message && (
                    <p className="text-sm text-destructive mt-1">{deployment.error_message}</p>
                  )}
                </div>
                {deployment.previous_config && deployment.status === 'completed' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRollback(deployment.id)}
                    disabled={isValidating}
                  >
                    <RotateCcw className="h-4 w-4 mr-1" />
                    Rollback
                  </Button>
                )}
              </div>
            ))}
            {deploymentHistory.length === 0 && (
              <p className="text-center text-muted-foreground py-4">No deployment history</p>
            )}
          </div>
        </CardContent>
      </Card>

      <ValidationHistoryViewer />
    </div>
  );
}
