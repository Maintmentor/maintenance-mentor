import React from 'react';
import { usePermissions } from '@/hooks/usePermissions';
import { useAuth } from '@/contexts/AuthContext';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  resource?: string;
  action?: 'read' | 'write' | 'delete' | 'manage' | 'export';
  requireAdmin?: boolean;
  requireManager?: boolean;
  requireRole?: string[];
  fallback?: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  resource,
  action = 'read',
  requireAdmin = false,
  requireManager = false,
  requireRole,
  fallback
}) => {
  const { user } = useAuth();
  const { hasPermission, isAdmin, isManager, hasRole, loading } = usePermissions();

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <Alert>
        <Shield className="h-4 w-4" />
        <AlertDescription>
          You must be logged in to access this content.
        </AlertDescription>
      </Alert>
    );
  }

  // Check admin requirement
  if (requireAdmin && !isAdmin()) {
    return fallback || (
      <Alert>
        <Shield className="h-4 w-4" />
        <AlertDescription>
          You need administrator privileges to access this content.
        </AlertDescription>
      </Alert>
    );
  }

  // Check manager requirement
  if (requireManager && !isManager() && !isAdmin()) {
    return fallback || (
      <Alert>
        <Shield className="h-4 w-4" />
        <AlertDescription>
          You need manager or administrator privileges to access this content.
        </AlertDescription>
      </Alert>
    );
  }

  // Check specific role requirement
  if (requireRole && requireRole.length > 0) {
    const hasRequiredRole = requireRole.some(role => hasRole(role));
    if (!hasRequiredRole) {
      return fallback || (
        <Alert>
          <Shield className="h-4 w-4" />
          <AlertDescription>
            You need one of the following roles to access this content: {requireRole.join(', ')}.
          </AlertDescription>
        </Alert>
      );
    }
  }

  // Check specific resource permission
  if (resource && !hasPermission(resource, action)) {
    return fallback || (
      <Alert>
        <Shield className="h-4 w-4" />
        <AlertDescription>
          You don't have permission to {action} {resource}.
        </AlertDescription>
      </Alert>
    );
  }

  return <>{children}</>;
};