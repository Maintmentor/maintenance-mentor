import React from 'react';
import { Navigation } from '@/components/Navigation';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import DashboardSidebar from '@/components/DashboardSidebar';
import ComingSoon from '@/components/ComingSoon';
import { MessageSquare } from 'lucide-react';

export default function TeamChatPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <ProtectedRoute>
        <div className="flex">
          <DashboardSidebar />
          <main className="flex-1 p-8">
            <ComingSoon
              title="Team Chat Coming Soon"
              description="Collaborate with your maintenance team in real-time. Share repair updates, coordinate schedules, and keep everyone in the loop."
              icon={<MessageSquare className="h-12 w-12 text-white" />}
            />
          </main>
        </div>
      </ProtectedRoute>
    </div>
  );
}
