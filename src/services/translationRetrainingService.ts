import { supabase } from '@/lib/supabase';

export interface ModelVersion {
  id: string;
  version_number: string;
  model_type: string;
  status: string;
  is_active: boolean;
  training_feedback_count: number;
  accuracy_improvement: number;
  trained_at: string;
  performance_metrics?: any;
}

export interface RetrainingJob {
  id: string;
  job_type: string;
  status: string;
  feedback_processed: number;
  corrections_applied: number;
  training_duration_seconds: number;
  started_at: string;
  completed_at?: string;
  results?: any;
}

export interface ABTest {
  id: string;
  experiment_name: string;
  model_a_version: string;
  model_b_version: string;
  traffic_split: number;
  status: string;
  start_date: string;
  end_date?: string;
  results?: any;
  winner_version?: string;
}

export const translationRetrainingService = {
  // Trigger manual retraining
  async triggerRetraining(userId?: string): Promise<{ success: boolean; job_id: string }> {
    const { data, error } = await supabase.functions.invoke('translation-model-retrainer', {
      body: { jobType: 'manual', triggeredBy: userId }
    });

    if (error) throw error;
    return data;
  },

  // Get all model versions
  async getModelVersions(): Promise<ModelVersion[]> {
    const { data, error } = await supabase
      .from('translation_model_versions')
      .select('*')
      .order('trained_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // Get active model version
  async getActiveModel(): Promise<ModelVersion | null> {
    const { data, error } = await supabase
      .from('translation_model_versions')
      .select('*')
      .eq('is_active', true)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  // Activate a model version
  async activateModel(versionId: string): Promise<void> {
    // Deactivate all models
    await supabase
      .from('translation_model_versions')
      .update({ is_active: false, deactivated_at: new Date().toISOString() })
      .eq('is_active', true);

    // Activate selected model
    const { error } = await supabase
      .from('translation_model_versions')
      .update({ 
        is_active: true, 
        activated_at: new Date().toISOString(),
        status: 'active'
      })
      .eq('id', versionId);

    if (error) throw error;
  },

  // Rollback to previous version
  async rollbackModel(versionId: string): Promise<void> {
    // Mark current active as rolled back
    await supabase
      .from('translation_model_versions')
      .update({ 
        is_active: false, 
        status: 'rolled_back',
        deactivated_at: new Date().toISOString()
      })
      .eq('is_active', true);

    // Activate rollback version
    await this.activateModel(versionId);
  },

  // Get retraining job history
  async getRetrainingJobs(): Promise<RetrainingJob[]> {
    const { data, error } = await supabase
      .from('translation_retraining_jobs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;
    return data || [];
  },

  // Create A/B test
  async createABTest(params: {
    experimentName: string;
    modelAVersion: string;
    modelBVersion: string;
    trafficSplit?: number;
  }): Promise<ABTest> {
    const { data, error } = await supabase
      .from('translation_ab_tests')
      .insert({
        experiment_name: params.experimentName,
        model_a_version: params.modelAVersion,
        model_b_version: params.modelBVersion,
        traffic_split: params.trafficSplit || 0.5,
        status: 'running'
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Get A/B test assignment
  async getABTestAssignment(userId: string, sessionId: string): Promise<string | null> {
    const { data, error } = await supabase.functions.invoke('translation-ab-test-manager', {
      body: { action: 'assign', userId, sessionId }
    });

    if (error) throw error;
    return data?.assigned_version || null;
  },

  // Complete A/B test
  async completeABTest(experimentId: string): Promise<any> {
    const { data, error } = await supabase.functions.invoke('translation-ab-test-manager', {
      body: { action: 'evaluate', experimentId }
    });

    if (error) throw error;
    return data;
  },

  // Get model performance metrics
  async getModelMetrics(versionId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('translation_model_metrics')
      .select('*')
      .eq('model_version_id', versionId)
      .order('measured_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }
};
