import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Rocket, CheckCircle, XCircle, Loader2, RefreshCw, AlertTriangle } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface DeploymentLog {
  timestamp: string;
  level: 'info' | 'success' | 'warning' | 'error';
  message: string;
}

export function OneClickDeployment() {
  const [isDeploying, setIsDeploying] = useState(false);
  const [deploymentStatus, setDeploymentStatus] = useState<'idle' | 'checking' | 'deploying' | 'success' | 'error'>('idle');
  const [logs, setLogs] = useState<DeploymentLog[]>([]);
  const [retryCount, setRetryCount] = useState(0);
  const [functionUrl, setFunctionUrl] = useState('');

  const addLog = (level: DeploymentLog['level'], message: string) => {
    setLogs(prev => [...prev, {
      timestamp: new Date().toLocaleTimeString(),
      level,
      message
    }]);
  };

  const deployWithRetry = async (attempt: number = 1): Promise<boolean> => {
    const maxRetries = 3;
    addLog('info', `Deployment attempt ${attempt}/${maxRetries}...`);

    try {
      const { data, error } = await supabase.functions.invoke('edge-function-deployment-manager', {
        body: {
          action: 'deploy_function',
          functionName: 'repair-diagnostic'
        }
      });

      if (error) throw error;

      if (data.success) {
        addLog('success', 'Deployment successful!');
        return true;
      } else {
        throw new Error(data.error || 'Deployment failed');
      }
    } catch (error: any) {
      addLog('error', `Attempt ${attempt} failed: ${error.message}`);
      
      if (attempt < maxRetries) {
        addLog('warning', `Retrying in 5 seconds...`);
        await new Promise(resolve => setTimeout(resolve, 5000));
        return deployWithRetry(attempt + 1);
      }
      
      return false;
    }
  };

  const handleDeploy = async () => {
    setIsDeploying(true);
    setDeploymentStatus('checking');
    setLogs([]);
    setRetryCount(0);

    try {
      // Step 1: Check current status
      addLog('info', '🔍 Checking deployment status...');
      const { data: statusData } = await supabase.functions.invoke('edge-function-deployment-manager', {
        body: { action: 'check_status', functionName: 'repair-diagnostic' }
      });

      if (statusData?.deployed) {
        addLog('warning', '⚠️  Function already deployed. Will redeploy...');
      } else {
        addLog('info', '📦 Function not deployed. Starting deployment...');
      }

      // Step 2: Verify secrets
      addLog('info', '🔑 Verifying OPENAI_API_KEY...');
      setDeploymentStatus('checking');
      
      const { data: secretsData } = await supabase.functions.invoke('edge-function-deployment-manager', {
        body: { action: 'verify_secrets' }
      });

      if (!secretsData?.secrets?.OPENAI_API_KEY) {
        addLog('error', '❌ OPENAI_API_KEY not found in secrets');
        setDeploymentStatus('error');
        setIsDeploying(false);
        return;
      }
      
      addLog('success', '✓ OPENAI_API_KEY verified');

      // Step 3: Deploy with retry logic
      setDeploymentStatus('deploying');
      addLog('info', '🚀 Starting deployment...');
      
      const deployed = await deployWithRetry(1);

      if (deployed) {
        // Step 4: Test the function
        addLog('info', '🧪 Testing deployed function...');
        const testUrl = 'https://kudlclzjfihbphehhiii.supabase.co/functions/v1/repair-diagnostic';
        setFunctionUrl(testUrl);

        const { data: testData, error: testError } = await supabase.functions.invoke('repair-diagnostic', {
          body: { issue: 'test', category: 'test' }
        });

        if (testError) {
          addLog('warning', '⚠️  Function deployed but test failed. May need warm-up.');
        } else {
          addLog('success', '✓ Function is responding correctly');
        }

        setDeploymentStatus('success');
        addLog('success', '🎉 Deployment complete!');
      } else {
        setDeploymentStatus('error');
        addLog('error', '❌ Deployment failed after all retries');
      }
    } catch (error: any) {
      addLog('error', `Deployment error: ${error.message}`);
      setDeploymentStatus('error');
    } finally {
      setIsDeploying(false);
    }
  };

  const getLogIcon = (level: DeploymentLog['level']) => {
    switch (level) {
      case 'success': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      default: return <div className="h-4 w-4 rounded-full bg-blue-500" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Rocket className="h-5 w-5" />
          One-Click Deployment
        </CardTitle>
        <CardDescription>
          Deploy repair-diagnostic function with automatic verification and retry logic
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {deploymentStatus === 'idle' && (
          <Alert>
            <AlertDescription>
              This will check if the repair-diagnostic function is deployed, verify secrets, and deploy/redeploy if needed.
            </AlertDescription>
          </Alert>
        )}

        {deploymentStatus === 'success' && functionUrl && (
          <Alert className="bg-green-50 border-green-200">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              <div className="font-semibold">Deployment successful!</div>
              <div className="text-sm mt-1">Function URL: {functionUrl}</div>
            </AlertDescription>
          </Alert>
        )}

        {deploymentStatus === 'error' && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription>
              Deployment failed. Check logs below for details.
            </AlertDescription>
          </Alert>
        )}

        <div className="flex gap-2">
          <Button
            onClick={handleDeploy}
            disabled={isDeploying}
            className="flex-1"
          >
            {isDeploying ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deploying...
              </>
            ) : (
              <>
                <Rocket className="mr-2 h-4 w-4" />
                Deploy Now
              </>
            )}
          </Button>
          
          {deploymentStatus === 'error' && (
            <Button
              onClick={handleDeploy}
              variant="outline"
              disabled={isDeploying}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Retry
            </Button>
          )}
        </div>

        {logs.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-sm">Deployment Logs</h4>
              <Badge variant={
                deploymentStatus === 'success' ? 'default' :
                deploymentStatus === 'error' ? 'destructive' :
                'secondary'
              }>
                {deploymentStatus}
              </Badge>
            </div>
            
            <ScrollArea className="h-64 border rounded-lg p-4 bg-slate-50">
              <div className="space-y-2 font-mono text-xs">
                {logs.map((log, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    {getLogIcon(log.level)}
                    <span className="text-slate-500">[{log.timestamp}]</span>
                    <span className={
                      log.level === 'error' ? 'text-red-600' :
                      log.level === 'success' ? 'text-green-600' :
                      log.level === 'warning' ? 'text-yellow-600' :
                      'text-slate-700'
                    }>
                      {log.message}
                    </span>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
