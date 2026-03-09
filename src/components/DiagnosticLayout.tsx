import React, { useEffect } from 'react';

export default function DiagnosticLayout() {
  useEffect(() => {
    console.log('='.repeat(50));
    console.log('DIAGNOSTIC LAYOUT MOUNTED SUCCESSFULLY');
    console.log('='.repeat(50));
    console.log('React is working!');
    console.log('Routing is working!');
    console.log('If you see this in console and text on screen, the issue is with AppLayout components');
    console.log('='.repeat(50));
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center p-8">
      <div className="bg-white rounded-2xl shadow-2xl p-12 max-w-2xl w-full">
        <h1 className="text-4xl font-bold text-gray-900 mb-6">
          ✅ React is Working!
        </h1>
        <div className="space-y-4 text-lg text-gray-700">
          <p>✓ HTML is rendering</p>
          <p>✓ CSS/Tailwind is working</p>
          <p>✓ React components are mounting</p>
          <p>✓ Routing is functional</p>
        </div>
        <div className="mt-8 p-6 bg-blue-50 rounded-lg">
          <h2 className="text-xl font-semibold text-blue-900 mb-3">
            Next Steps:
          </h2>
          <ol className="list-decimal list-inside space-y-2 text-blue-800">
            <li>Check browser console for any errors</li>
            <li>Verify all component imports in AppLayout.tsx</li>
            <li>Test each component individually</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
