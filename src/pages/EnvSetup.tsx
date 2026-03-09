import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SupabaseSetupWizard from '@/components/setup/SupabaseSetupWizard';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { EnvValidator } from '@/utils/envValidator';

export default function EnvSetup() {
  const navigate = useNavigate();
  const validation = EnvValidator.validateEnv();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <Button
          variant="ghost"
          onClick={() => navigate('/')}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Home
        </Button>

        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Environment Setup
          </h1>
          <p className="text-lg text-gray-600">
            Configure your API credentials to unlock all features
          </p>
        </div>

        {!validation.isValid && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-red-900 mb-2">Configuration Issues Detected:</h3>
            <ul className="list-disc list-inside text-red-700 space-y-1">
              {validation.errors.map((error, i) => (
                <li key={i}>{error}</li>
              ))}
            </ul>
          </div>
        )}

        <SupabaseSetupWizard />

        <div className="bg-white rounded-lg p-6 shadow-sm">
          <h3 className="font-semibold text-lg mb-3">Setup Instructions:</h3>
          <ol className="list-decimal list-inside space-y-2 text-gray-700">
            <li>Go to your Supabase Dashboard</li>
            <li>Navigate to Settings → API</li>
            <li>Copy your Project URL and anon/public key</li>
            <li>Paste them into the form above</li>
            <li>Click "Test Connection" to verify</li>
            <li>Download the .env file and place it in your project root</li>
            <li>Restart your development server</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
