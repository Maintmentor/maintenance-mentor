import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { supabase } from '@/lib/supabase';
import {
  Key,
  AlertTriangle,
  X,
  CheckCircle2,
  ExternalLink,
  Copy,
  Terminal,
  ChevronDown,
  ChevronUp,
  Loader2,
  Shield,
  Zap,
  RefreshCw,
  ArrowRight,
  Clock,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';

type KeyState = 'checking' | 'missing' | 'configured' | 'error' | 'dismissed';

export default function APIKeyStatusBanner() {
  const [keyState, setKeyState] = useState<KeyState>('checking');
  const [showSetupDialog, setShowSetupDialog] = useState(false);
  const [showCLI, setShowCLI] = useState(false);
  const [isRechecking, setIsRechecking] = useState(false);
  const [errorDetail, setErrorDetail] = useState('');
  const [isPolling, setIsPolling] = useState(false);
  const [pollCount, setPollCount] = useState(0);
  const [verificationStep, setVerificationStep] = useState<'idle' | 'waiting' | 'success' | 'failed'>('idle');
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const keyStateRef = useRef(keyState);

  // Keep ref in sync
  useEffect(() => {
    keyStateRef.current = keyState;
  }, [keyState]);

  // Derive the project ref from the Supabase URL for direct dashboard link
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
  const projectRef = supabaseUrl.match(/https?:\/\/([^.]+)\./)?.[1] || '';
  const dashboardSecretsUrl = projectRef
    ? `https://supabase.com/dashboard/project/${projectRef}/settings/functions`
    : 'https://supabase.com/dashboard';

  const checkKeyStatus = useCallback(async (): Promise<boolean> => {
    try {
      // Make a lightweight probe to the repair-diagnostic function
      const { data, error } = await supabase.functions.invoke('repair-diagnostic', {
        body: { question: '__health_check__' }
      });

      if (error) {
        const errorMsg = error.message || '';
        const errorBody = typeof error.context?.body === 'string' ? error.context.body : '';
        const combinedError = `${errorMsg} ${errorBody}`.toLowerCase();

        if (
          combinedError.includes('api key not configured') ||
          combinedError.includes('openai_api_key') ||
          combinedError.includes('openai api key') ||
          combinedError.includes('no api key')
        ) {
          setKeyState('missing');
          setErrorDetail('OPENAI_API_KEY secret is not set in edge function secrets.');
          return false;
        }
      }

      if (data && !data.success) {
        const dataError = (data.error || '').toLowerCase();
        if (
          dataError.includes('api key not configured') ||
          dataError.includes('openai_api_key') ||
          dataError.includes('no api key')
        ) {
          setKeyState('missing');
          setErrorDetail('OPENAI_API_KEY secret is not set in edge function secrets.');
          return false;
        }
      }

      // If we got here without a key error, the key is configured
      setKeyState('configured');
      return true;
    } catch (err: any) {
      console.warn('API key status check failed:', err);
      setKeyState('error');
      return false;
    }
  }, []);

  // Initial check on mount
  useEffect(() => {
    const dismissed = sessionStorage.getItem('openai-key-banner-dismissed');
    if (dismissed === 'true') {
      setKeyState('dismissed');
      return;
    }

    const timer = setTimeout(async () => {
      await checkKeyStatus();
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  // Auto-open dialog on first detection of missing key (once per session)
  useEffect(() => {
    if (keyState === 'missing') {
      const autoOpened = sessionStorage.getItem('openai-key-dialog-auto-opened');
      if (!autoOpened) {
        sessionStorage.setItem('openai-key-dialog-auto-opened', 'true');
        // Small delay so the banner renders first
        setTimeout(() => setShowSetupDialog(true), 500);
      }
    }
  }, [keyState]);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, []);

  const startPolling = () => {
    setIsPolling(true);
    setVerificationStep('waiting');
    setPollCount(0);

    // Clear any existing interval
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
    }

    // Poll every 5 seconds for up to 2 minutes
    pollIntervalRef.current = setInterval(async () => {
      setPollCount(prev => {
        const next = prev + 1;
        if (next >= 24) {
          // Stop after 2 minutes (24 * 5s)
          if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
          setIsPolling(false);
          setVerificationStep('failed');
          toast.error('Verification timed out. Please check that the secret was saved correctly and try again.');
          return next;
        }
        return next;
      });

      const isConfigured = await checkKeyStatus();
      if (isConfigured) {
        if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
        setIsPolling(false);
        setVerificationStep('success');
        toast.success('OpenAI API key detected! The AI Repair Assistant is now active.', {
          duration: 6000,
        });
        // Auto-close dialog after success
        setTimeout(() => {
          setShowSetupDialog(false);
          setKeyState('configured');
        }, 3000);
      }
    }, 5000);
  };

  const stopPolling = () => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
    setIsPolling(false);
    setVerificationStep('idle');
  };

  const handleManualRecheck = async () => {
    setIsRechecking(true);
    const isConfigured = await checkKeyStatus();
    setIsRechecking(false);
    if (isConfigured) {
      setVerificationStep('success');
      toast.success('OpenAI API key is now configured! The AI assistant is ready.');
      setTimeout(() => setShowSetupDialog(false), 2000);
    } else {
      toast.error('Key still not detected. Make sure you saved the secret and wait a few seconds for propagation.');
    }
  };

  const handleDismiss = () => {
    sessionStorage.setItem('openai-key-banner-dismissed', 'true');
    stopPolling();
    setKeyState('dismissed');
  };

  const copyToClipboard = (text: string, label?: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast.success(label ? `${label} copied!` : 'Copied to clipboard!');
    });
  };

  // Don't render if key is configured, dismissed, still checking, or errored
  if (keyState !== 'missing') return null;

  return (
    <>
      {/* Prominent Banner */}
      <Alert className="rounded-none border-x-0 border-t-0 bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 border-amber-300 shadow-sm">
        <Key className="h-4 w-4 text-amber-600" />
        <AlertTitle className="flex items-center justify-between flex-wrap gap-2">
          <span className="flex items-center gap-2 text-amber-900">
            <span className="font-semibold">OpenAI API Key Required</span>
            <Badge variant="outline" className="border-amber-400 text-amber-700 text-xs animate-pulse">
              Action Needed
            </Badge>
          </span>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              className="bg-amber-600 hover:bg-amber-700 text-white shadow-sm"
              onClick={() => setShowSetupDialog(true)}
            >
              <Key className="h-3.5 w-3.5 mr-1.5" />
              Set Up Now
              <ArrowRight className="h-3.5 w-3.5 ml-1" />
            </Button>
            <Button size="sm" variant="ghost" onClick={handleDismiss} className="text-amber-700 hover:text-amber-900 h-8 w-8 p-0">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </AlertTitle>
        <AlertDescription className="text-amber-800 mt-1">
          Add your OpenAI API key (<code className="bg-amber-100 px-1.5 py-0.5 rounded text-xs font-mono">sk-...</code>) as an edge function secret named <code className="bg-amber-100 px-1.5 py-0.5 rounded text-xs font-mono">OPENAI_API_KEY</code> to enable real AI responses.
        </AlertDescription>
      </Alert>

      {/* Setup Dialog */}
      <Dialog open={showSetupDialog} onOpenChange={(open) => {
        setShowSetupDialog(open);
        if (!open) stopPolling();
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <div className="p-2 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-lg">
                <Key className="w-5 h-5 text-blue-600" />
              </div>
              Configure OpenAI API Key
            </DialogTitle>
            <DialogDescription>
              This is the single remaining step to enable real AI-powered repair diagnostics.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 mt-4">
            {/* Current Status Indicator */}
            {verificationStep === 'success' ? (
              <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                <div className="p-2 bg-green-100 rounded-full">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-green-800">Key Configured Successfully!</p>
                  <p className="text-xs text-green-600 mt-0.5">The AI Repair Assistant is now active and ready to respond.</p>
                </div>
                <Sparkles className="w-5 h-5 text-green-500 animate-pulse" />
              </div>
            ) : verificationStep === 'waiting' ? (
              <div className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <Loader2 className="w-5 h-5 text-blue-500 animate-spin flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-blue-800">Waiting for key to be detected...</p>
                  <p className="text-xs text-blue-600 mt-0.5">
                    Auto-checking every 5 seconds (attempt {pollCount}/24). Add the secret in the dashboard and it will be detected automatically.
                  </p>
                </div>
                <Button size="sm" variant="ghost" onClick={stopPolling} className="text-blue-600 hover:text-blue-800">
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ) : verificationStep === 'failed' ? (
              <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-amber-800">Verification timed out</p>
                  <p className="text-xs text-amber-600 mt-0.5">
                    The key was not detected after 2 minutes. Please verify the secret name is exactly <code className="bg-amber-100 px-1 rounded">OPENAI_API_KEY</code> and the value starts with <code className="bg-amber-100 px-1 rounded">sk-</code>.
                  </p>
                </div>
                <Button size="sm" variant="outline" onClick={startPolling} className="border-amber-300 text-amber-700">
                  <RefreshCw className="w-3.5 h-3.5 mr-1" />
                  Retry
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-red-800">Key Not Configured</p>
                  <p className="text-xs text-red-600 mt-0.5">{errorDetail}</p>
                </div>
              </div>
            )}

            {/* Step 1: Get API Key */}
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold shadow-sm">
                1
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 mb-1">Get an OpenAI API Key</h4>
                <p className="text-sm text-gray-600 mb-3">
                  Create a new API key from the OpenAI platform. Ensure your account has billing enabled and sufficient credits.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open('https://platform.openai.com/api-keys', '_blank')}
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Open OpenAI API Keys
                </Button>
                <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  The key should start with <code className="bg-gray-100 px-1 py-0.5 rounded">sk-</code> (e.g., sk-proj-abc123...)
                </p>
              </div>
            </div>

            <hr />

            {/* Step 2: Add to Edge Function Secrets */}
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold shadow-sm">
                2
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 mb-1">Add as Edge Function Secret</h4>
                <p className="text-sm text-gray-600 mb-3">
                  Choose one of the methods below to add the secret:
                </p>

                {/* Method A: Dashboard */}
                <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-lg mb-3">
                  <h5 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-green-600" />
                    Method A: Database Dashboard (Recommended)
                  </h5>
                  <ol className="text-sm text-gray-600 space-y-2.5 ml-6 list-decimal">
                    <li>Open your project dashboard</li>
                    <li>Go to <strong>Project Settings</strong> (gear icon in sidebar)</li>
                    <li>Click <strong>Edge Functions</strong> in the left menu</li>
                    <li>Scroll to <strong>Edge Function Secrets</strong></li>
                    <li>Click <strong>"Add new secret"</strong></li>
                    <li className="flex items-center gap-1 flex-wrap">
                      Name:
                      <code className="bg-green-100 px-2 py-0.5 rounded text-xs font-mono font-bold select-all ml-1">
                        OPENAI_API_KEY
                      </code>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 ml-0.5 inline-flex text-green-700 hover:text-green-900 hover:bg-green-100"
                        onClick={() => copyToClipboard('OPENAI_API_KEY', 'Secret name')}
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                    </li>
                    <li>
                      Value: Paste your OpenAI key (starts with <code className="bg-green-100 px-1 py-0.5 rounded text-xs font-mono">sk-</code>)
                    </li>
                    <li>Click <strong>"Save"</strong></li>
                  </ol>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      className="bg-green-600 hover:bg-green-700 text-white shadow-sm"
                      onClick={() => window.open(dashboardSecretsUrl, '_blank')}
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Open Dashboard Settings
                    </Button>
                  </div>
                </div>

                {/* Method B: CLI */}
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                  <button
                    className="w-full flex items-center justify-between text-left"
                    onClick={() => setShowCLI(!showCLI)}
                  >
                    <h5 className="font-medium text-gray-900 flex items-center gap-2">
                      <Terminal className="w-4 h-4 text-gray-600" />
                      Method B: CLI
                    </h5>
                    {showCLI ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                  {showCLI && (
                    <div className="mt-3 space-y-2">
                      <p className="text-sm text-gray-600">Run this command in your terminal:</p>
                      <div className="relative">
                        <pre className="bg-gray-900 text-green-400 p-3 rounded-lg text-sm font-mono overflow-x-auto">
                          npx supabase secrets set OPENAI_API_KEY=sk-your-key-here
                        </pre>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="absolute top-1.5 right-1.5 h-7 text-gray-400 hover:text-white"
                          onClick={() => copyToClipboard('npx supabase secrets set OPENAI_API_KEY=sk-your-key-here', 'CLI command')}
                        >
                          <Copy className="w-3 h-3" />
                        </Button>
                      </div>
                      <p className="text-xs text-gray-500">
                        Replace <code className="bg-gray-200 px-1 py-0.5 rounded">sk-your-key-here</code> with your actual API key.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <hr />

            {/* Step 3: Verify */}
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold shadow-sm">
                3
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 mb-1">Verify It Works</h4>
                <p className="text-sm text-gray-600 mb-3">
                  After saving the secret, verify the key is detected. Secrets may take up to 30 seconds to propagate.
                </p>
                <div className="flex flex-wrap gap-2">
                  {!isPolling ? (
                    <>
                      <Button
                        onClick={startPolling}
                        className="bg-blue-600 hover:bg-blue-700 shadow-sm"
                        disabled={verificationStep === 'success'}
                      >
                        <Clock className="w-4 h-4 mr-2" />
                        I've Added the Key — Start Verification
                      </Button>
                      <Button
                        variant="outline"
                        onClick={handleManualRecheck}
                        disabled={isRechecking}
                      >
                        {isRechecking ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <RefreshCw className="w-4 h-4 mr-2" />
                        )}
                        Manual Check
                      </Button>
                    </>
                  ) : (
                    <Button
                      variant="outline"
                      onClick={stopPolling}
                      className="border-blue-300 text-blue-700"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Stop Auto-Checking
                    </Button>
                  )}
                </div>
                {verificationStep === 'success' && (
                  <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                    <span className="text-sm text-green-800 font-medium">
                      Key verified! The AI assistant is now fully operational.
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Security Note */}
            <div className="flex items-start gap-3 p-3 bg-slate-50 border border-slate-200 rounded-lg">
              <Shield className="w-4 h-4 text-slate-500 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-slate-600">
                Your API key is stored securely as a server-side secret. It is never exposed to the browser or frontend code.
                All AI requests are processed through the <code className="bg-slate-200 px-1 py-0.5 rounded">repair-diagnostic</code> edge function on the server.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
