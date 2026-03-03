import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';
import { Upload, Send, CheckCircle, XCircle, Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function EdgeFunctionTest() {
  const [testQuestion, setTestQuestion] = useState('What does a toilet fill valve look like?');
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<any>(null);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`]);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    addLog('📤 Uploading image to Supabase storage...');
    try {
      const fileName = `test/${Date.now()}_${file.name}`;
      const { data, error } = await supabase.storage
        .from('repair-photos')
        .upload(fileName, file);

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('repair-photos')
        .getPublicUrl(fileName);

      setUploadedImage(publicUrl);
      addLog(`✅ Image uploaded: ${publicUrl}`);
      toast.success('Image uploaded successfully');
    } catch (err: any) {
      addLog(`❌ Upload failed: ${err.message}`);
      toast.error('Failed to upload image');
    }
  };

  const testEdgeFunction = async () => {
    setTesting(true);
    setResult(null);
    setError(null);
    setLogs([]);

    addLog('🚀 Starting edge function test...');
    addLog(`📝 Question: ${testQuestion}`);
    if (uploadedImage) {
      addLog(`🖼️ Image: ${uploadedImage}`);
    }

    try {
      const payload = {
        question: testQuestion,
        images: uploadedImage ? [uploadedImage] : [],
        userId: 'test-user',
        conversationId: 'test-conversation'
      };

      addLog('📤 Sending request to repair-diagnostic function...');
      addLog(`Payload: ${JSON.stringify(payload, null, 2)}`);

      const startTime = Date.now();
      const { data, error: funcError } = await supabase.functions.invoke('repair-diagnostic', {
        body: payload
      });
      const duration = Date.now() - startTime;

      addLog(`⏱️ Function completed in ${duration}ms`);

      if (funcError) {
        addLog(`❌ Edge function error: ${funcError.message}`);
        addLog(`Error details: ${JSON.stringify(funcError, null, 2)}`);
        setError(funcError);
        toast.error('Edge function error', {
          description: funcError.message
        });
        return;
      }

      addLog('✅ Function response received');
      addLog(`Response: ${JSON.stringify(data, null, 2)}`);

      if (data.success) {
        addLog('✅ Success! AI response generated');
        addLog(`Answer length: ${data.answer?.length || 0} characters`);
        addLog(`Part images: ${data.partImages?.length || 0}`);
        setResult(data);
        toast.success('Test successful!');
      } else {
        addLog(`⚠️ Function returned success: false`);
        addLog(`Error: ${data.error}`);
        setError({ message: data.error });
        toast.error('Function returned error', {
          description: data.error
        });
      }
    } catch (err: any) {
      addLog(`💥 Unexpected error: ${err.message}`);
      addLog(`Stack: ${err.stack}`);
      setError(err);
      toast.error('Test failed', {
        description: err.message
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Edge Function Test</h1>
        <p className="text-gray-600">Test the repair-diagnostic edge function with detailed logging</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Test Input */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Test Input</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Question</label>
              <Input
                value={testQuestion}
                onChange={(e) => setTestQuestion(e.target.value)}
                placeholder="Enter a repair question..."
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Upload Image (Optional)</label>
              <div className="border-2 border-dashed rounded-lg p-4 text-center">
                {uploadedImage ? (
                  <div>
                    <img src={uploadedImage} alt="Uploaded" className="w-32 h-32 object-cover mx-auto rounded mb-2" />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setUploadedImage(null)}
                    >
                      Remove
                    </Button>
                  </div>
                ) : (
                  <label className="cursor-pointer">
                    <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                    <span className="text-sm text-gray-600">Click to upload</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                )}
              </div>
            </div>

            <Button
              onClick={testEdgeFunction}
              disabled={testing || !testQuestion}
              className="w-full"
              size="lg"
            >
              {testing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Testing...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Run Test
                </>
              )}
            </Button>
          </div>
        </Card>

        {/* Logs */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Execution Logs</h2>
          <div className="bg-gray-900 text-green-400 p-4 rounded font-mono text-xs h-96 overflow-y-auto">
            {logs.length === 0 ? (
              <div className="text-gray-500">No logs yet. Click "Run Test" to start.</div>
            ) : (
              logs.map((log, i) => (
                <div key={i} className="mb-1">{log}</div>
              ))
            )}
          </div>
        </Card>
      </div>

      {/* Results */}
      {(result || error) && (
        <Card className="mt-6 p-6">
          <div className="flex items-center gap-2 mb-4">
            {result ? (
              <>
                <CheckCircle className="w-6 h-6 text-green-500" />
                <h2 className="text-xl font-semibold">Test Passed</h2>
              </>
            ) : (
              <>
                <XCircle className="w-6 h-6 text-red-500" />
                <h2 className="text-xl font-semibold">Test Failed</h2>
              </>
            )}
          </div>

          {result && (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">AI Response:</h3>
                <div className="bg-gray-50 p-4 rounded whitespace-pre-wrap">{result.answer}</div>
              </div>

              {result.partImages && result.partImages.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2">Part Images ({result.partImages.length}):</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {result.partImages.map((img: any, i: number) => (
                      <div key={i} className="border rounded p-2">
                        <img src={img.url} alt={img.query} className="w-full h-32 object-cover rounded mb-2" />
                        <div className="text-sm">
                          <div><strong>Query:</strong> {img.query}</div>
                          <div><strong>Source:</strong> {img.source}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded p-4">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
                <div className="flex-1">
                  <div className="font-semibold text-red-900">Error Details:</div>
                  <div className="text-sm text-red-800 mt-1">{error.message}</div>
                  {error.context && (
                    <pre className="mt-2 text-xs bg-red-100 p-2 rounded overflow-x-auto">
                      {JSON.stringify(error.context, null, 2)}
                    </pre>
                  )}
                </div>
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
