import { supabase } from '@/lib/supabase';

// Repair History CRUD Operations
export const repairHistoryService = {
  async getAll(userId?: string) {
    let query = supabase
      .from('repair_history')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (userId) {
      query = query.eq('user_id', userId);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  async create(repair: any) {
    const { data, error } = await supabase
      .from('repair_history')
      .insert([repair])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async update(id: string, updates: any) {
    const { data, error } = await supabase
      .from('repair_history')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('repair_history')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  // Real-time subscription
  subscribeToChanges(callback: (payload: any) => void) {
    return supabase
      .channel('repair_history_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'repair_history' },
        callback
      )
      .subscribe();
  }
};

// User Profiles CRUD Operations
export const userProfileService = {
  async get(userId: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error) throw error;
    return data;
  },

  async update(userId: string, updates: any) {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async create(profile: any) {
    const { data, error } = await supabase
      .from('profiles')
      .insert([profile])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
};

// Service Requests CRUD Operations
export const serviceRequestService = {
  async getAll(userId?: string) {
    let query = supabase
      .from('service_requests')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (userId) {
      query = query.eq('user_id', userId);
    }
    
    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  async create(request: any) {
    const { data, error } = await supabase
      .from('service_requests')
      .insert([request])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async updateStatus(id: string, status: string) {
    const { data, error } = await supabase
      .from('service_requests')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Real-time subscription for status updates
  subscribeToStatusUpdates(callback: (payload: any) => void) {
    return supabase
      .channel('service_request_status')
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'service_requests' },
        callback
      )
      .subscribe();
  }
};