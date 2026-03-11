import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { supabase } from '@/lib/supabase';
import {
  Key,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Loader2,
  RefreshCw,
  ExternalLink,
  Copy,
  Shield,
  Zap,
  MessageSquare,
  Clock,
  ChevronDown,
  ChevronUp,
  Terminal,
  Globe,
  Lock,
  Cpu,
  Sparkles,
  ArrowRight,
  Play,
  X,
} from 'lucide-react';
import { toast } from 'sonner';

interface KeyStatus {
  status: 'loading' | 'missing' | 'configured' | 'valid' | 'invalid' | 'error';
  message: string;
  keyPreview?: string | null;
  keyFormat?: string;
  capabilities?: {
    gpt4: boolean;
    gpt4o: boolean;
    gpt35: boolean;
    dalle: boolean;
    totalModels: number;
  };
  testReply?: string;
  responseTimeMs?: number;
  tokensUsed?: number;
  httpStatus?: number;
}

export default function OpenAIKeySetupGuide() {
  const [keyStatus, setKeyStatus] = useState<KeyStatus>({ status: 'loading', message: 'Checking...' });
  const [isChecking, setIsChecking] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [showCLI, setShowCLI] = useState(false);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const [pollCount, setPollCount] = useState(0);
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Derive the project ref from the Supabase URL for direct dashboard link
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
  const projectRef = supabaseUrl.match(/https?:\/\/([^.]+)\./)?.[1] || '';
  const dashboardSecretsUrl = projectRef
    ? `https://supabase.com/dashboard/project/${projectRef}/settings/functions`
    : 'https://supabase.com/dashboard';

  const checkKeyStatus = useCallback(async () => {
    setIsChecking(true);
    try {
      const { data, error } = await supabase.functions.invoke('openai-key-validator', {
        body: { action: 'check' }
      });

      if (error) throw error;

      const newStatus: KeyStatus = {
        status: data.status,
        message: data.message,
        keyPreview: data.keyPreview,
        keyFormat: data.keyFormat
      };
      setKeyStatus(newStatus);
      setLastChecked(new Date());
      return newStatus.status;
    } catch (err: any) {
      // Fallback: try probing repair-diagnostic directly
      try {
        const { data: rdData, error: rdError } = await supabase.functions.invoke('repair-diagnostic', {
          body: { question: '__health_check__' }
        });

        const combinedError = `${rdError?.message || ''} ${JSON.stringify(rdData) || ''}`.toLowerCase();
        if (
          combinedError.includes('api key not configured') ||
          combinedError.includes('openai_api_key') ||
          combinedError.includes('no api key')
        ) {
          setKeyStatus({ status: 'missing', message: 'OPENAI_API_KEY secret is not set in edge function secrets.' });
          setLastChecked(new Date());
          return 'missing';
        }

        // If no key error, assume configured
        setKeyStatus({ status: 'configured', message: 'Key appears to be configured (openai-key-validator function not available, but repair-diagnostic responded without key errors).' });
        setLastChecked(new Date());
        return 'configured';
      } catch {
        setKeyStatus({
          status: 'error',
          message: `Failed to check key status: ${err.message}. Both openai-key-validator and repair-diagnostic edge functions may not be deployed.`
        });
        return 'error';
      }
    } finally {
      setIsChecking(false);
    }
  }, []);

  useEffect(() => {
    checkKeyStatus().then(status => {
      // Auto-expand instructions if key is missing
      if (status === 'missing') {
        setShowInstructions(true);
      }
    });
  }, [checkKeyStatus]);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, []);

  const startPolling = () => {
    setIsPolling(true);
    setPollCount(0);
    if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);

    pollIntervalRef.current = setInterval(async () => {
      setPollCount(prev => {
        const next = prev + 1;
        if (next >= 24) {
          if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
          setIsPolling(false);
          toast.error('Auto-verification timed out after 2 minutes. Try clicking "Re-check Status" manually.');
          return next;
        }
        return next;
      });

      const status = await checkKeyStatus();
      if (status === 'configured' || status === 'valid') {
        if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
        setIsPolling(false);
        toast.success('OpenAI API key detected! You can now validate and test it.', { duration: 6000 });
      }
    }, 5000);
  };

  const stopPolling = () => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
    setIsPolling(false);
  };

  const validateKey = async () => {
    setIsValidating(true);
    try {
      const { data, error } = await supabase.functions.invoke('openai-key-validator', {
        body: { action: 'validate' }
      });

      if (error) throw error;

      setKeyStatus({
        status: data.status === 'valid' ? 'valid' : data.status === 'missing' ? 'missing' : 'invalid',
        message: data.message,
        keyPreview: data.keyPreview,
        capabilities: data.capabilities,
        httpStatus: data.httpStatus
      });
      setLastChecked(new Date());

      if (data.valid) {
        toast.success('OpenAI API key is valid and working!');
      } else if (data.status === 'missing') {
        toast.error('OpenAI API key is not configured yet.');
      } else {
        toast.error(`Key validation failed: ${data.message}`);
      }
    } catch (err: any) {
      setKeyStatus({
        status: 'error',
        message: `Validation failed: ${err.message}`
      });
      toast.error('Failed to validate key');
    } finally {
      setIsValidating(false);
    }
  };

  const testChat = async () => {
    setIsTesting(true);
    try {
      const { data, error } = await supabase.functions.invoke('openai-key-validator', {
        body: { action: 'test-chat' }
      });

      if (error) throw error;

      if (data.success) {
        setKeyStatus(prev => ({
          ...prev,
          status: 'valid',
          message: 'End-to-end chat test passed!',
          testReply: data.testReply,
          responseTimeMs: data.responseTimeMs,
          tokensUsed: data.tokensUsed
        }));
        toast.success(`Chat test passed! Response in ${data.responseTimeMs}ms`);
      } else {
        setKeyStatus(prev => ({
          ...prev,
          status: data.status === 'missing' ? 'missing' : 'invalid',
          message: data.message
        }));
        toast.error(data.message);
      }
      setLastChecked(new Date());
    } catch (err: any) {
      toast.error(`Chat test failed: ${err.message}`);
    } finally {
      setIsTesting(false);
    }
  };

  const copyToClipboard = (text: string, label?: string) => {
    navigator.clipboard.writeText(text);
    toast.success(label ? `${label} copied!` : 'Copied to clipboard!');
  };

  const getStatusIcon = () => {
    switch (keyStatus.status) {
      case 'loading':
        return <Loader2 className="w-6 h-6 animate-spin text-blue-500" />;
      case 'valid':
      case 'configured':
        return <CheckCircle2 className="w-6 h-6 text-green-500" />;
      case 'missing':
        return <XCircle className="w-6 h-6 text-red-500" />;
      case 'invalid':
        return <AlertTriangle className="w-6 h-6 text-amber-500" />;
      case 'error':
        return <XCircle className="w-6 h-6 text-red-500" />;
      default:
        return <Key className="w-6 h-6 text-gray-500" />;
    }
  };

  const getStatusColor = () => {
    switch (keyStatus.status) {
      case 'valid':
      case 'configured':
        return 'bg-green-50 border-green-200';
      case 'missing':
        return 'bg-red-50 border-red-200';
      case 'invalid':
        return 'bg-amber-50 border-amber-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const getStatusBadge = () => {
    switch (keyStatus.status) {
      case 'loading':
        return <Badge variant="secondary">Checking...</Badge>;
      case 'valid':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Valid & Working</Badge>;
      case 'configured':
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Configured</Badge>;
      case 'missing':
        return <Badge variant="destructive">Not Configured</Badge>;
      case 'invalid':
        return <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">Invalid Key</Badge>;
      case 'error':
        return <Badge variant="destructive">Error</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Main Status Card */}
      <Card className={`border-2 ${getStatusColor()}`}>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className={`p-3 rounded-xl ${
                keyStatus.status === 'valid' ? 'bg-green-100' :
                keyStatus.status === 'missing' ? 'bg-red-100' :
                keyStatus.status === 'configured' ? 'bg-blue-100' :
                'bg-gray-100'
              }`}>
                {getStatusIcon()}
              </div>
              <div>
                <CardTitle className="text-xl">OpenAI API Key Status</CardTitle>
                <CardDescription className="mt-1">
                  Required for the AI Repair Assistant to make real AI calls
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {getStatusBadge()}
              <Button
                variant="outline"
                size="sm"
                onClick={() => checkKeyStatus()}
                disabled={isChecking}
              >
                {isChecking ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Status Message */}
            <div className="flex items-start gap-3 p-4 rounded-lg bg-white/80 border">
              <Shield className="w-5 h-5 mt-0.5 text-gray-500 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">{keyStatus.message}</p>
                {keyStatus.keyPreview && (
                  <p className="text-xs text-gray-500 mt-1 font-mono">
                    Key: {keyStatus.keyPreview}
                  </p>
                )}
                {lastChecked && (
                  <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Last checked: {lastChecked.toLocaleTimeString()}
                  </p>
                )}
              </div>
            </div>

            {/* Auto-polling indicator */}
            {isPolling && (
              <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <Loader2 className="w-4 h-4 text-blue-500 animate-spin flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm text-blue-800">Auto-checking every 5 seconds... (attempt {pollCount}/24)</p>
                  <p className="text-xs text-blue-600">Add the secret in the dashboard and it will be detected automatically.</p>
                </div>
                <Button size="sm" variant="ghost" onClick={stopPolling} className="text-blue-600 h-7 w-7 p-0">
                  <X className="w-4 h-4" />
                </Button>
              </div>
            )}

            {/* Capabilities (shown after validation) */}
            {keyStatus.capabilities && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className={`p-3 rounded-lg border text-center ${keyStatus.capabilities.gpt4 ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                  <Cpu className="w-5 h-5 mx-auto mb-1 text-gray-600" />
                  <p className="text-xs font-medium">GPT-4</p>
                  <p className={`text-xs ${keyStatus.capabilities.gpt4 ? 'text-green-600' : 'text-gray-400'}`}>
                    {keyStatus.capabilities.gpt4 ? 'Available' : 'Not Available'}
                  </p>
                </div>
                <div className={`p-3 rounded-lg border text-center ${keyStatus.capabilities.gpt4o ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                  <Sparkles className="w-5 h-5 mx-auto mb-1 text-gray-600" />
                  <p className="text-xs font-medium">GPT-4o</p>
                  <p className={`text-xs ${keyStatus.capabilities.gpt4o ? 'text-green-600' : 'text-gray-400'}`}>
                    {keyStatus.capabilities.gpt4o ? 'Available' : 'Not Available'}
                  </p>
                </div>
                <div className={`p-3 rounded-lg border text-center ${keyStatus.capabilities.gpt35 ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                  <Zap className="w-5 h-5 mx-auto mb-1 text-gray-600" />
                  <p className="text-xs font-medium">GPT-3.5</p>
                  <p className={`text-xs ${keyStatus.capabilities.gpt35 ? 'text-green-600' : 'text-gray-400'}`}>
                    {keyStatus.capabilities.gpt35 ? 'Available' : 'Not Available'}
                  </p>
                </div>
                <div className={`p-3 rounded-lg border text-center ${keyStatus.capabilities.dalle ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                  <Globe className="w-5 h-5 mx-auto mb-1 text-gray-600" />
                  <p className="text-xs font-medium">DALL-E</p>
                  <p className={`text-xs ${keyStatus.capabilities.dalle ? 'text-green-600' : 'text-gray-400'}`}>
                    {keyStatus.capabilities.dalle ? 'Available' : 'Not Available'}
                  </p>
                </div>
              </div>
            )}

            {/* Test Results */}
            {keyStatus.testReply && (
              <div className="p-4 rounded-lg bg-green-50 border border-green-200">
                <div className="flex items-center gap-2 mb-2">
                  <MessageSquare className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium text-green-800">Chat Test Result</span>
                </div>
                <p className="text-sm text-green-700 italic">"{keyStatus.testReply}"</p>
                <div className="flex gap-4 mt-2">
                  {keyStatus.responseTimeMs && (
                    <span className="text-xs text-green-600 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {keyStatus.responseTimeMs}ms response time
                    </span>
                  )}
                  {keyStatus.tokensUsed && (
                    <span className="text-xs text-green-600 flex items-center gap-1">
                      <Zap className="w-3 h-3" />
                      {keyStatus.tokensUsed} tokens used
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3">
              {keyStatus.status === 'missing' && !isPolling && (
                <Button
                  onClick={startPolling}
                  className="bg-amber-600 hover:bg-amber-700"
                >
                  <Play className="w-4 h-4 mr-2" />
                  I've Added the Key — Start Auto-Verification
                </Button>
              )}
              <Button
                onClick={validateKey}
                disabled={isValidating || keyStatus.status === 'missing'}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isValidating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Validating...
                  </>
                ) : (
                  <>
                    <Key className="w-4 h-4 mr-2" />
                    Validate Key
                  </>
                )}
              </Button>
              <Button
                onClick={testChat}
                disabled={isTesting || keyStatus.status === 'missing'}
                variant="outline"
                className="border-purple-300 text-purple-700 hover:bg-purple-50"
              >
                {isTesting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Testing Chat...
                  </>
                ) : (
                  <>
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Test AI Chat
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowInstructions(!showInstructions)}
              >
                {showInstructions ? (
                  <ChevronUp className="w-4 h-4 mr-2" />
                ) : (
                  <ChevronDown className="w-4 h-4 mr-2" />
                )}
                {keyStatus.status === 'missing' ? 'Setup Instructions' : 'Update Key'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Setup Instructions */}
      {showInstructions && (
        <Card className="border-2 border-blue-200">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
            <CardTitle className="text-lg flex items-center gap-2">
              <Key className="w-5 h-5 text-blue-600" />
              How to Add Your OpenAI API Key
            </CardTitle>
            <CardDescription>
              Follow these steps to configure the AI assistant for production use
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            {/* Quick Summary */}
            {keyStatus.status === 'missing' && (
              <Alert className="border-amber-300 bg-amber-50">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <AlertTitle className="text-amber-900">Single Step Remaining</AlertTitle>
                <AlertDescription className="text-amber-800">
                  The edge function code is already configured to read from <code className="bg-amber-100 px-1 py-0.5 rounded text-xs font-mono">Deno.env.get('OPENAI_API_KEY')</code>.
                  You just need to add the secret value in your project dashboard.
                </AlertDescription>
              </Alert>
            )}

            {/* Step 1: Get API Key */}
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold">
                1
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 mb-2">Get your OpenAI API Key</h4>
                <p className="text-sm text-gray-600 mb-3">
                  Create a new API key from the OpenAI platform. Ensure your account has billing enabled and sufficient credits.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open('https://platform.openai.com/api-keys', '_blank')}
                  className="mb-2"
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Open OpenAI API Keys Page
                </Button>
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg mt-2">
                  <p className="text-xs text-amber-800 flex items-center gap-1">
                    <AlertTriangle className="w-3 h-3 flex-shrink-0" />
                    The key should start with <code className="bg-amber-100 px-1 rounded">sk-</code> (e.g., sk-proj-abc123...). Ensure billing is enabled on your OpenAI account.
                  </p>
                </div>
              </div>
            </div>

            <hr className="border-gray-200" />

            {/* Step 2: Add to Edge Function Secrets */}
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold">
                2
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 mb-2">Add the key as an Edge Function Secret</h4>
                <p className="text-sm text-gray-600 mb-3">
                  Choose one of the methods below:
                </p>

                {/* Method A: Dashboard */}
                <div className="p-4 bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-lg mb-3">
                  <h5 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                    <Globe className="w-4 h-4 text-green-600" />
                    Method A: Database Dashboard (Recommended)
                  </h5>
                  <ol className="text-sm text-gray-600 space-y-2.5 ml-6 list-decimal">
                    <li>Open your project dashboard</li>
                    <li>Navigate to <strong>Project Settings</strong> (gear icon in sidebar)</li>
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
                    <li>Paste your OpenAI key as the value (starts with <code className="bg-green-100 px-1 py-0.5 rounded text-xs font-mono">sk-</code>)</li>
                    <li>Click <strong>"Save"</strong></li>
                  </ol>
                  <div className="mt-4">
                    <Button
                      size="sm"
                      className="bg-green-600 hover:bg-green-700 text-white shadow-sm"
                      onClick={() => window.open(dashboardSecretsUrl, '_blank')}
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Open Dashboard Settings
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </Button>
                    {projectRef && (
                      <p className="text-xs text-green-600 mt-2">
                        Project: <code className="bg-green-100 px-1 rounded">{projectRef}</code>
                      </p>
                    )}
                  </div>
                </div>

                {/* Method B: CLI */}
                <div className="p-4 bg-white border rounded-lg">
                  <button
                    className="w-full flex items-center justify-between text-left"
                    onClick={() => setShowCLI(!showCLI)}
                  >
                    <h5 className="font-medium text-gray-900 flex items-center gap-2">
                      <Terminal className="w-4 h-4 text-purple-600" />
                      Method B: CLI
                    </h5>
                    {showCLI ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                  {showCLI && (
                    <div className="mt-3 space-y-3">
                      <p className="text-sm text-gray-600">
                        Run this command in your terminal:
                      </p>
                      <div className="relative">
                        <pre className="bg-gray-900 text-green-400 p-4 rounded-lg text-sm font-mono overflow-x-auto">
                          npx supabase secrets set OPENAI_API_KEY=sk-your-key-here
                        </pre>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="absolute top-2 right-2 h-7 text-gray-400 hover:text-white"
                          onClick={() => copyToClipboard('npx supabase secrets set OPENAI_API_KEY=sk-your-key-here', 'CLI command')}
                        >
                          <Copy className="w-3 h-3" />
                        </Button>
                      </div>
                      <p className="text-xs text-gray-500">
                        Replace <code className="bg-gray-100 px-1 py-0.5 rounded">sk-your-key-here</code> with your actual API key.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <hr className="border-gray-200" />

            {/* Step 3: Verify */}
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold">
                3
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 mb-2">Verify the key is working</h4>
                <p className="text-sm text-gray-600 mb-3">
                  After adding the secret, verify it's detected. Secrets may take up to 30 seconds to propagate.
                </p>
                <div className="flex flex-wrap gap-2">
                  {!isPolling ? (
                    <Button
                      size="sm"
                      onClick={startPolling}
                      className="bg-amber-600 hover:bg-amber-700"
                    >
                      <Play className="w-4 h-4 mr-2" />
                      I've Added the Key — Start Auto-Verification
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={stopPolling}
                      className="border-blue-300 text-blue-700"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Stop Auto-Checking
                    </Button>
                  )}
                  <Button
                    size="sm"
                    onClick={() => checkKeyStatus()}
                    disabled={isChecking}
                    variant="outline"
                  >
                    {isChecking ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
                    Manual Re-check
                  </Button>
                  <Button
                    size="sm"
                    onClick={validateKey}
                    disabled={isValidating || keyStatus.status === 'missing'}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {isValidating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Key className="w-4 h-4 mr-2" />}
                    Validate Key
                  </Button>
                  <Button
                    size="sm"
                    onClick={testChat}
                    disabled={isTesting || keyStatus.status === 'missing'}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    {isTesting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <MessageSquare className="w-4 h-4 mr-2" />}
                    Test AI Chat
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Missing Key Alert */}
      {keyStatus.status === 'missing' && !showInstructions && (
        <Alert variant="destructive" className="border-red-300 bg-red-50">
          <XCircle className="h-4 w-4" />
          <AlertTitle>AI Chat Feature is Disabled</AlertTitle>
          <AlertDescription className="mt-2">
            <p className="mb-2">
              The <strong>OPENAI_API_KEY</strong> secret is not configured in your edge functions.
              The AI Repair Assistant will not be able to respond to user questions until this is set up.
            </p>
            <Button
              size="sm"
              variant="outline"
              className="border-red-300 text-red-700 hover:bg-red-100"
              onClick={() => setShowInstructions(true)}
            >
              Show Setup Instructions
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Security Notice */}
      <Card className="bg-slate-50 border-slate-200">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Lock className="w-5 h-5 text-slate-500 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="text-sm font-semibold text-slate-700 mb-1">Security Note</h4>
              <p className="text-xs text-slate-600">
                Your OpenAI API key is stored securely as an edge function secret. It is never exposed
                to the browser or frontend code. All AI requests are processed server-side through the
                <code className="bg-slate-200 px-1 py-0.5 rounded mx-1">repair-diagnostic</code>
                edge function, which accesses the key via <code className="bg-slate-200 px-1 py-0.5 rounded mx-1">Deno.env.get('OPENAI_API_KEY')</code>.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
