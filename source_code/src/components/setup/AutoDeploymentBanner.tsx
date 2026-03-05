import { useState, useEffect } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, XCircle, Loader2, Rocket, X, AlertTriangle } from 'lucide-react';
import { edgeFunctionDeploymentService } from '@/services/edgeFunctionDeploymentService';
import { toast } from 'sonner';

const SUPABASE_URL = 'https://kudlclzjfihbphehhiii.supabase.co';


export function AutoDeploymentBanner() {
  const [visible, setVisible] = useState(false);
  const [checking, setChecking] = useState(true);
  const [deploying, setDeploying] = useState(false);
  const [missingCount, setMissingCount] = useState(0);
  const [progress, setProgress] = useState(0);
  const [dismissed, setDismissed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkOnStartup();
  }, []);

  const checkOnStartup = async () => {
    try {
      const result = await edgeFunctionDeploymentService.checkDeploymentStatus();
      
      if (result.missingCount > 0) {
        setMissingCount(result.missingCount);
        setVisible(true);
      }
    } catch (error: any) {
      console.error('Failed to check deployment status:', error);
      setError(error?.message || 'Connection failed');
      setVisible(true);
    } finally {
      setChecking(false);
    }
  };

  const handleAutoDeploy = async () => {
    try {
      setDeploying(true);
      setProgress(10);
      setError(null);

      const result = await edgeFunctionDeploymentService.autoDeployMissing();
      
      setProgress(50);
      await new Promise(resolve => setTimeout(resolve, 1000));
      setProgress(80);
      await new Promise(resolve => setTimeout(resolve, 500));
      setProgress(100);

      if (result.totalDeployed > 0) {
        toast.success(`Successfully deployed ${result.totalDeployed} functions!`);
      }
      
      if (result.totalSkipped > 0) {
        toast.warning(`Skipped ${result.totalSkipped} functions due to missing secrets`);
      }

      setTimeout(() => {
        setVisible(false);
      }, 2000);
    } catch (error: any) {
      const errorMsg = error?.message || 'Failed to deploy functions';
      setError(errorMsg);
      toast.error(errorMsg);
      console.error('Deployment error:', error);
    } finally {
      setDeploying(false);
    }
  };

  if (!visible || dismissed || checking) return null;

  return (
    <div className="fixed top-4 right-4 z-50 max-w-md">
      <Alert className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              {error ? (
                <AlertTriangle className="h-4 w-4 text-red-600" />
              ) : (
                <Rocket className="h-4 w-4 text-yellow-600" />
              )}
              <AlertTitle className="text-yellow-900 dark:text-yellow-100">
                {error ? 'Edge Function Connection Error' : 'Edge Functions Need Deployment'}
              </AlertTitle>
            </div>
            
            <AlertDescription className="mt-2 text-yellow-800 dark:text-yellow-200 space-y-2">
              {error ? (
                <>
                  <p className="text-red-700 dark:text-red-300 font-medium">{error}</p>
                  <p className="text-xs">Target: {SUPABASE_URL}/functions/v1/</p>
                  <p className="text-xs mt-2">Possible causes:</p>
                  <ul className="text-xs list-disc list-inside space-y-1">
                    <li>Edge functions not deployed</li>
                    <li>Missing OpenAI API key in Supabase secrets</li>
                    <li>Invalid Supabase credentials</li>
                  </ul>
                </>
              ) : (
                <p>
                  {missingCount} edge function{missingCount > 1 ? 's' : ''} {missingCount > 1 ? 'are' : 'is'} not deployed.
                  Deploy now for full functionality.
                </p>
              )}
            </AlertDescription>

            {deploying && (
              <div className="mt-4 space-y-2">
                <div className="flex items-center gap-2 text-sm text-yellow-800 dark:text-yellow-200">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Deploying to {SUPABASE_URL}...
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            )}

            {!deploying && (
              <div className="mt-4 flex gap-2">
                <Button
                  size="sm"
                  onClick={handleAutoDeploy}
                  className="bg-yellow-600 hover:bg-yellow-700"
                >
                  <Rocket className="mr-2 h-4 w-4" />
                  {error ? 'Retry' : 'Deploy Now'}
                </Button>
                <Button size="sm" variant="outline" onClick={() => setDismissed(true)}>
                  Dismiss
                </Button>
              </div>
            )}
          </div>
          
          {!deploying && (
            <Button variant="ghost" size="sm" onClick={() => setDismissed(true)} className="h-6 w-6 p-0">
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </Alert>
    </div>
  );
}
