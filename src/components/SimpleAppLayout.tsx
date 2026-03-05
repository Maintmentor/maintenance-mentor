import React from 'react';

// Ultra-simple layout to test if React is working
export default function SimpleAppLayout() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 py-20">
        <div className="text-center space-y-8">
          <h1 className="text-6xl font-bold text-blue-900">
            ✅ React is Working!
          </h1>
          <p className="text-2xl text-gray-600">
            If you see this, your app is rendering correctly.
          </p>
          <div className="bg-green-100 border-2 border-green-500 rounded-lg p-8 max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold text-green-800 mb-4">
              Diagnostic Test Passed
            </h2>
            <ul className="text-left space-y-2 text-green-700">
              <li>✓ React is rendering</li>
              <li>✓ Tailwind CSS is working</li>
              <li>✓ Component imports are successful</li>
              <li>✓ No JavaScript errors</li>
            </ul>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 max-w-2xl mx-auto">
            <p className="text-lg text-blue-800">
              <strong>Next Step:</strong> Switch back to the full AppLayout to see all features.
            </p>
            <p className="text-sm text-blue-600 mt-2">
              Edit src/pages/Index.tsx and change SimpleAppLayout back to AppLayout
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
