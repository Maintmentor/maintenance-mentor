import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/lib/supabase';
import { Loader2, Search, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function ImageFetchTest() {
  const [query, setQuery] = useState('Fluidmaster 502P21 toilet flapper');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const testFetch = async () => {
    setLoading(true);
    setResult(null);
    
    try {
      console.log('Testing image fetch for:', query);
      
      const { data, error } = await supabase.functions.invoke('fetch-real-part-images', {
        body: { query }
      });

      if (error) {
        console.error('Function error:', error);
        setResult({ success: false, error: error.message });
        toast.error('Function call failed');
        return;
      }

      console.log('Function response:', data);
      setResult(data);
      
      if (data.success && data.image) {
        toast.success('Real image found!');
      } else {
        toast.error('No images found');
      }

    } catch (err: any) {
      console.error('Test error:', err);
      setResult({ success: false, error: err.message });
      toast.error('Test failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-6 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Image Fetch Test</h2>
      <p className="text-gray-600 mb-4">
        Test the real product image fetching system
      </p>

      <div className="flex gap-2 mb-4">
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Enter part name or number..."
          className="flex-1"
        />
        <Button onClick={testFetch} disabled={loading || !query}>
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
          ) : (
            <Search className="w-4 h-4 mr-2" />
          )}
          Test
        </Button>
      </div>

      {result && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            {result.success ? (
              <CheckCircle className="w-5 h-5 text-green-600" />
            ) : (
              <XCircle className="w-5 h-5 text-red-600" />
            )}
            <span className="font-medium">
              {result.success ? 'Success' : 'Failed'}
            </span>
          </div>

          {result.image && (
            <div>
              <p className="text-sm text-gray-600 mb-2">Real Product Image:</p>
              <img 
                src={result.image} 
                alt="Product" 
                className="w-full rounded-lg shadow-md"
              />
              {result.allImages && result.allImages.length > 0 && (
                <p className="text-xs text-gray-500 mt-2">Source: {result.allImages[0].source}</p>
              )}
            </div>
          )}

          {!result.image && result.message && (
            <div className="bg-amber-50 border border-amber-200 rounded p-3">
              <p className="text-sm text-amber-800">{result.message}</p>
            </div>
          )}


          {result.error && (
            <div className="bg-red-50 border border-red-200 rounded p-3">
              <p className="text-sm text-red-800">{result.error}</p>
            </div>
          )}

          <details className="text-sm">
            <summary className="cursor-pointer text-gray-600">View Raw Response</summary>
            <pre className="mt-2 p-3 bg-gray-100 rounded overflow-auto">
              {JSON.stringify(result, null, 2)}
            </pre>
          </details>
        </div>
      )}

      <div className="mt-6 p-4 bg-blue-50 rounded">
        <h3 className="font-semibold mb-2">Test Queries:</h3>
        <div className="space-y-1 text-sm">
          <button 
            onClick={() => setQuery('Fluidmaster 502P21 toilet flapper')}
            className="block text-blue-600 hover:underline"
          >
            Fluidmaster 502P21 toilet flapper
          </button>
          <button 
            onClick={() => setQuery('Delta RP50587 single handle cartridge')}
            className="block text-blue-600 hover:underline"
          >
            Delta RP50587 single handle cartridge
          </button>
          <button 
            onClick={() => setQuery('Whirlpool W10348269 dishwasher drain pump')}
            className="block text-blue-600 hover:underline"
          >
            Whirlpool W10348269 dishwasher drain pump
          </button>
        </div>
      </div>
    </Card>
  );
}
