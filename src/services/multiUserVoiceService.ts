import { supabase } from '@/lib/supabase';

export interface MultiUserVoiceProfile {
  id: string;
  user_id: string;
  profile_name: string;
  display_name: string;
  language: string;
  accent?: string;
  role: 'technician' | 'apprentice' | 'supervisor' | 'admin';
  quality_score: number;
  training_hours: number;
  adaptation_level: 'basic' | 'intermediate' | 'advanced';
  is_active: boolean;
  created_at: string;
  updated_at: string;
  last_training: string;
}

export interface VoicePattern {
  id: string;
  profile_id: string;
  phoneme: string;
  frequency: number;
  accuracy: number;
  variations: string[];
}

export interface SharedVocabularyTerm {
  id: string;
  term: string;
  pronunciation?: string;
  category: 'technical' | 'brand' | 'part' | 'tool' | 'safety' | 'measurement';
  definition?: string;
  role_access: string[];
  created_by: string;
  usage_count: number;
}

export interface UserVocabularyTerm {
  id: string;
  profile_id: string;
  term: string;
  pronunciation?: string;
  category: string;
  confidence: number;
  recordings: string[];
  practice_count: number;
}

export interface VoiceTrainingSession {
  id: string;
  profile_id: string;
  session_type: 'accent' | 'vocabulary' | 'patterns' | 'assessment' | 'calibration';
  duration_minutes: number;
  accuracy_score: number;
  improvements: string[];
  next_steps: string[];
  session_data: any;
  completed_at: string;
}

class MultiUserVoiceService {
  async getUserProfiles(userId: string): Promise<MultiUserVoiceProfile[]> {
    const { data, error } = await supabase
      .from('voice_profiles')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async createProfile(profileData: Partial<MultiUserVoiceProfile>): Promise<MultiUserVoiceProfile> {
    const { data, error } = await supabase
      .from('voice_profiles')
      .insert([profileData])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async updateProfile(profileId: string, updates: Partial<MultiUserVoiceProfile>): Promise<MultiUserVoiceProfile> {
    const { data, error } = await supabase
      .from('voice_profiles')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', profileId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async setActiveProfile(userId: string, profileId: string): Promise<void> {
    // First, deactivate all profiles for the user
    await supabase
      .from('voice_profiles')
      .update({ is_active: false })
      .eq('user_id', userId);

    // Then activate the selected profile
    const { error } = await supabase
      .from('voice_profiles')
      .update({ is_active: true })
      .eq('id', profileId);

    if (error) throw error;
  }

  async getActiveProfile(userId: string): Promise<MultiUserVoiceProfile | null> {
    const { data, error } = await supabase
      .from('voice_profiles')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data || null;
  }

  async deleteProfile(profileId: string): Promise<void> {
    const { error } = await supabase
      .from('voice_profiles')
      .delete()
      .eq('id', profileId);

    if (error) throw error;
  }

  async getSharedVocabulary(role: string, category?: string): Promise<SharedVocabularyTerm[]> {
    let query = supabase
      .from('shared_vocabulary')
      .select('*')
      .contains('role_access', [role]);

    if (category) {
      query = query.eq('category', category);
    }

    const { data, error } = await query.order('usage_count', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async addSharedVocabulary(term: SharedVocabularyTerm): Promise<SharedVocabularyTerm> {
    const { data, error } = await supabase
      .from('shared_vocabulary')
      .insert([term])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getUserVocabulary(profileId: string): Promise<UserVocabularyTerm[]> {
    const { data, error } = await supabase
      .from('user_vocabulary')
      .select('*')
      .eq('profile_id', profileId)
      .order('practice_count', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async addUserVocabulary(term: UserVocabularyTerm): Promise<UserVocabularyTerm> {
    const { data, error } = await supabase
      .from('user_vocabulary')
      .insert([term])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async recordTrainingSession(session: Partial<VoiceTrainingSession>): Promise<VoiceTrainingSession> {
    const { data, error } = await supabase
      .from('voice_training_sessions')
      .insert([session])
      .select()
      .single();

    if (error) throw error;

    // Update profile training hours and last training
    if (session.profile_id && session.duration_minutes) {
      await supabase
        .from('voice_profiles')
        .update({
          training_hours: supabase.sql`training_hours + ${session.duration_minutes / 60}`,
          last_training: new Date().toISOString()
        })
        .eq('id', session.profile_id);
    }

    return data;
  }

  async getTrainingHistory(profileId: string): Promise<VoiceTrainingSession[]> {
    const { data, error } = await supabase
      .from('voice_training_sessions')
      .select('*')
      .eq('profile_id', profileId)
      .order('completed_at', { ascending: false })
      .limit(50);

    if (error) throw error;
    return data || [];
  }

  async getVoicePatterns(profileId: string): Promise<VoicePattern[]> {
    const { data, error } = await supabase
      .from('voice_patterns')
      .select('*')
      .eq('profile_id', profileId);

    if (error) throw error;
    return data || [];
  }

  async updateVoicePattern(profileId: string, phoneme: string, accuracy: number): Promise<void> {
    const { error } = await supabase
      .from('voice_patterns')
      .upsert({
        profile_id: profileId,
        phoneme,
        accuracy,
        frequency: supabase.sql`frequency + 1`
      });

    if (error) throw error;
  }

  getRolePermissions(role: string): string[] {
    const permissions: Record<string, string[]> = {
      admin: ['manage_all_profiles', 'manage_shared_vocabulary', 'view_analytics', 'export_data'],
      supervisor: ['view_team_profiles', 'manage_shared_vocabulary', 'view_analytics'],
      technician: ['manage_own_profiles', 'use_shared_vocabulary', 'contribute_vocabulary'],
      apprentice: ['manage_own_profiles', 'use_shared_vocabulary']
    };

    return permissions[role] || permissions.apprentice;
  }

  canAccessFeature(userRole: string, feature: string): boolean {
    const permissions = this.getRolePermissions(userRole);
    return permissions.includes(feature);
  }
}

export const multiUserVoiceService = new MultiUserVoiceService();