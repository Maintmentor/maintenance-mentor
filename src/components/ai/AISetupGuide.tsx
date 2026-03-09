import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Key, Settings, Zap, AlertTriangle } from 'lucide-react';

const AISetupGuide: React.FC = () => {
  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">AI Setup Guide</h1>
        <p className="text-gray-600">Configure OpenAI Vision API for real photo analysis</p>
      </div>

      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <strong>Important:</strong> You need an OpenAI API key to use real AI photo analysis. 
          Without it, the app will show demo responses only.
        </AlertDescription>
      </Alert>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              Step 1: Get OpenAI API Key
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <ol className="list-decimal list-inside space-y-2">
              <li>Visit <a href="https://platform.openai.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">platform.openai.com</a></li>
              <li>Sign up or log in to your OpenAI account</li>
              <li>Navigate to API Keys section</li>
              <li>Create a new API key</li>
              <li>Copy the key (it starts with "sk-")</li>
            </ol>
            <Badge variant="outline" className="mt-2">
              Cost: ~$0.01-0.05 per image analysis
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Step 2: Configure Environment
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p>Add your API key to the environment variables:</p>
            <div className="bg-gray-100 p-3 rounded-lg font-mono text-sm">
              VITE_OPENAI_API_KEY=your_api_key_here
            </div>
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Security Note:</strong> In production, use a backend service to keep your API key secure. 
                The current setup is for demonstration purposes only.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Step 3: Test the Integration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <ol className="list-decimal list-inside space-y-2">
              <li>Restart your development server</li>
              <li>Go to the AI Demo section</li>
              <li>Click "Try AI Photo Analysis Now"</li>
              <li>Upload or take a photo of a repair issue</li>
              <li>Verify you get real AI analysis results</li>
            </ol>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Features Enabled</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold mb-2">With API Key:</h4>
                <ul className="space-y-1 text-sm">
                  <li>✅ Real photo analysis</li>
                  <li>✅ Detailed diagnostics</li>
                  <li>✅ Cost estimates</li>
                  <li>✅ Safety warnings</li>
                  <li>✅ Tool recommendations</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Without API Key:</h4>
                <ul className="space-y-1 text-sm">
                  <li>❌ Generic responses only</li>
                  <li>❌ No image recognition</li>
                  <li>❌ Limited diagnostics</li>
                  <li>✅ UI demo still works</li>
                  <li>✅ All other features work</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AISetupGuide;