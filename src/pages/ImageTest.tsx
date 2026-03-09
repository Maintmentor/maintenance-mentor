import React from 'react';
import { AppProvider } from '@/contexts/AppContext';
import { Navigation } from '@/components/Navigation';
import ImageFetchTest from '@/components/chat/ImageFetchTest';

export default function ImageTestPage() {
  return (
    <AppProvider>
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <ImageFetchTest />
        </div>
      </div>
    </AppProvider>
  );
}
