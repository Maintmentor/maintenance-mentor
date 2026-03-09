import React from 'react';
import { UserProfileManager } from '@/components/auth/UserProfileManager';
import { Navigation } from '@/components/Navigation';
import Footer from '@/components/Footer';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

const Profile: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <ProtectedRoute>
        <UserProfileManager />
      </ProtectedRoute>
      <Footer />
    </div>
  );
};

export default Profile;