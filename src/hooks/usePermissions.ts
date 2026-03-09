import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

interface Permission {
  read?: boolean;
  write?: boolean;
  delete?: boolean;
  manage?: boolean;
  export?: boolean;
}

interface Permissions {
  [key: string]: Permission;
}

const DEFAULT_PERMISSIONS: Permissions = {
  ai_assistant: { read: true },
  repairs: { read: true },
  settings: { read: true },
  notifications: { read: true },
};

export const usePermissions = () => {
  const { user } = useAuth();
  const [permissions, setPermissions] = useState<Permissions>({});
  const [roles, setRoles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchPermissions();
    } else {
      setPermissions({});
      setRoles([]);
      setLoading(false);
    }
  }, [user]);

  const fetchPermissions = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('user-role-manager', {
        body: { action: 'get_user_permissions' }
      });

      if (error) {
        console.warn('Permissions fetch failed, using defaults:', error);
        setPermissions(DEFAULT_PERMISSIONS);
        setRoles(['user']);
        setLoading(false);
        return;
      }
      setPermissions(data?.permissions || DEFAULT_PERMISSIONS);
      setRoles(data?.roles || ['user']);
    } catch (error) {
      console.warn('Permissions unavailable, using defaults:', error);
      setPermissions(DEFAULT_PERMISSIONS);
      setRoles(['user']);
    } finally {
      setLoading(false);
    }
  };

  const hasPermission = (resource: string, action: keyof Permission): boolean => {
    return permissions[resource]?.[action] === true;
  };

  const hasAnyPermission = (resource: string, actions: (keyof Permission)[]): boolean => {
    return actions.some(action => hasPermission(resource, action));
  };

  const isAdmin = (): boolean => {
    return hasPermission('user_management', 'manage');
  };

  const isManager = (): boolean => {
    return hasPermission('security_audit', 'write') && !isAdmin();
  };

  const hasRole = (roleName: string): boolean => {
    return roles.includes(roleName);
  };

  return {
    permissions,
    roles,
    loading,
    hasPermission,
    hasAnyPermission,
    hasRole,
    isAdmin,
    isManager,
    refetch: fetchPermissions
  };
};
