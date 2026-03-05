import React from 'react';
import Dashboard from '@/components/Dashboard';
import { AppProvider } from '@/contexts/AppContext';
import { Navigation } from '@/components/Navigation';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import DashboardSidebar from '@/components/DashboardSidebar';

const DashboardPage: React.FC = () => {
  return (
    <AppProvider>
      <div className="min-h-screen bg-gray-50">
        <Navigation />
        <ProtectedRoute>
          <div className="flex">
            <DashboardSidebar />
            <main className="flex-1">
              <Dashboard />
            </main>
          </div>
        </ProtectedRoute>
      </div>
    </AppProvider>
  );
};

export default DashboardPage;

