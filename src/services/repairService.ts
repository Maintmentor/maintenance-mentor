import { supabase } from '@/lib/supabase';

export interface RepairHistory {
  id: string;
  user_id: string;
  appliance: string;
  issue: string;
  description?: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  cost?: number;
  repair_date: string;
  technician_notes?: string;
  images?: string[];
  created_at: string;
  updated_at: string;
}

export interface ServiceRequest {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  category: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  estimated_cost?: number;
  actual_cost?: number;
  scheduled_date?: string;
  completed_date?: string;
  technician_notes?: string;
  customer_notes?: string;
  images?: string[];
  created_at: string;
  updated_at: string;
}

class RepairService {
  // Repair History CRUD operations
  async getRepairHistory(userId: string) {
    const { data, error } = await supabase
      .from('repair_history')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }

  async createRepairRecord(record: Omit<RepairHistory, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('repair_history')
      .insert([record])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateRepairRecord(id: string, updates: Partial<RepairHistory>) {
    const { data, error } = await supabase
      .from('repair_history')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async deleteRepairRecord(id: string) {
    const { error } = await supabase
      .from('repair_history')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  // Service Requests CRUD operations
  async getServiceRequests(userId: string) {
    const { data, error } = await supabase
      .from('service_requests')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      // Table might not exist, return empty array
      console.warn('Service requests table might not exist:', error);
      return [];
    }
    return data || [];
  }

  async createServiceRequest(request: Omit<ServiceRequest, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('service_requests')
      .insert([request])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateServiceRequest(id: string, updates: Partial<ServiceRequest>) {
    const { data, error } = await supabase
      .from('service_requests')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Real-time subscriptions
  subscribeToRepairUpdates(userId: string, callback: (payload: any) => void) {
    return supabase
      .channel('repair-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'repair_history',
          filter: `user_id=eq.${userId}`
        },
        callback
      )
      .subscribe();
  }

  subscribeToServiceRequests(userId: string, callback: (payload: any) => void) {
    return supabase
      .channel('service-requests')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'service_requests',
          filter: `user_id=eq.${userId}`
        },
        callback
      )
      .subscribe();
  }

  // Get statistics
  async getRepairStatistics(userId: string) {
    const { data, error } = await supabase
      .from('repair_history')
      .select('status, cost')
      .eq('user_id', userId);

    if (error) throw error;

    const stats = {
      total: data?.length || 0,
      completed: data?.filter(r => r.status === 'completed').length || 0,
      inProgress: data?.filter(r => r.status === 'in_progress').length || 0,
      pending: data?.filter(r => r.status === 'pending').length || 0,
      totalCost: data?.reduce((sum, r) => sum + (r.cost || 0), 0) || 0
    };

    return stats;
  }
}

export const repairService = new RepairService();