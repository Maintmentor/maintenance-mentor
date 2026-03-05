import { useState, useEffect } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Settings, X, CheckCircle, RefreshCw } from 'lucide-react';
import { EnvValidator } from '@/utils/envValidator';
import { envRepairService } from '@/services/envRepairService';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import SupabaseSetupWizard from './SupabaseSetupWizard';

export default function EnvValidationBanner() {
  const [validationResult, setValidationResult] = useState(EnvValidator.validateEnv());
  const [dismissed, setDismissed] = useState(false);
  const [showWizard, setShowWizard] = useState(false);
  const [autoRepairInProgress, setAutoRepairInProgress] = useState(false);
  const [repairMessage, setRepairMessage] = useState<string | null>(null);

  useEffect(() => {
    // Check for specific corruption patterns
    const checkForCorruption = () => {
      const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
      if (anonKey.includes('sb_publishable') || anonKey.includes('PLEASE_REPLACE')) {
        setRepairMessage('🚨 CRITICAL: Invalid API key detected! Stripe key found in JWT signature.');
        const hasSeenWizard = localStorage.getItem('env-wizard-seen');
        if (!hasSeenWizard) {
          setShowWizard(true);
          localStorage.setItem('env-wizard-seen', 'true');
        }
        return true;
      }
      return false;
    };

    // Attempt auto-repair on mount if validation fails
    const attemptAutoRepair = async () => {
      // First check for known corruption patterns
      if (checkForCorruption()) {
        return;
      }

      if (!validationResult.isValid && validationResult.errors.length > 0) {
        setAutoRepairInProgress(true);
        setRepairMessage('Manual configuration required.');
        // Show wizard if validation failed
        const hasSeenWizard = localStorage.getItem('env-wizard-seen');
        if (!hasSeenWizard) {
          setShowWizard(true);
          localStorage.setItem('env-wizard-seen', 'true');
        }
        setAutoRepairInProgress(false);
      }

    };

    attemptAutoRepair();
  }, []);



  if (dismissed || (validationResult.isValid && validationResult.warnings.length === 0)) {
    return null;
  }

  return (
    <>
      <Alert variant={validationResult.isValid ? "default" : "destructive"} className="rounded-none border-x-0">
        {autoRepairInProgress ? (
          <RefreshCw className="h-4 w-4 animate-spin" />
        ) : repairMessage?.includes('✓') ? (
          <CheckCircle className="h-4 w-4" />
        ) : (
          <AlertTriangle className="h-4 w-4" />
        )}
        <AlertTitle className="flex items-center justify-between">
          <span>
            {autoRepairInProgress 
              ? 'Attempting Auto-Repair...' 
              : repairMessage 
              ? repairMessage 
              : `Environment Configuration ${validationResult.isValid ? 'Warning' : 'Error'}`}
          </span>
          <div className="flex gap-2">
            {!autoRepairInProgress && (
              <>
                <Button size="sm" variant="outline" onClick={() => setShowWizard(true)}>
                  <Settings className="h-4 w-4 mr-2" />
                  Fix Now
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setDismissed(true)}>
                  <X className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        </AlertTitle>
        {!repairMessage && (
          <AlertDescription>
            {validationResult.errors.length > 0 && (
              <ul className="list-disc list-inside space-y-1">
                {validationResult.errors.map((error, i) => (
                  <li key={i}>{error}</li>
                ))}
              </ul>
            )}
            {validationResult.warnings.length > 0 && (
              <ul className="list-disc list-inside space-y-1 text-yellow-600">
                {validationResult.warnings.map((warning, i) => (
                  <li key={i}>{warning}</li>
                ))}
              </ul>
            )}
          </AlertDescription>
        )}
      </Alert>


      <Dialog open={showWizard} onOpenChange={setShowWizard}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Environment Setup Required</DialogTitle>
            <DialogDescription>
              Configure your API credentials to enable all features
            </DialogDescription>
          </DialogHeader>
          <SupabaseSetupWizard />
        </DialogContent>
      </Dialog>
    </>
  );
}
