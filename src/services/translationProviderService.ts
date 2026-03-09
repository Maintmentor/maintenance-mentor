import { supabase } from '@/lib/supabase';

export interface TranslationProvider {
  id: string;
  name: string;
  provider_type: 'openai' | 'google' | 'deepl';
  is_enabled: boolean;
  priority: number;
  cost_per_1k_chars: number;
  quality_score: number;
  supported_languages: string[];
}

export interface ProviderMetrics {
  provider_id: string;
  provider_name?: string;
  source_language: string;
  target_language: string;
  total_requests: number;
  successful_requests: number;
  failed_requests: number;
  avg_response_time_ms: number;
  total_cost: number;
  success_rate: number;
}

export interface RoutingRule {
  id: string;
  name: string;
  priority: number;
  source_language?: string;
  target_language?: string;
  preferred_provider_id?: string;
  fallback_provider_ids?: string[];
  routing_strategy: 'cost' | 'quality' | 'speed' | 'balanced';
  is_enabled: boolean;
}

export const translationProviderService = {
  async getProviders(): Promise<TranslationProvider[]> {
    const { data, error } = await supabase
      .from('translation_providers')
      .select('*')
      .order('priority', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async updateProvider(id: string, updates: Partial<TranslationProvider>) {
    const { error } = await supabase
      .from('translation_providers')
      .update(updates)
      .eq('id', id);

    if (error) throw error;
  },

  async getProviderMetrics(providerId?: string): Promise<ProviderMetrics[]> {
    let query = supabase
      .from('translation_provider_metrics')
      .select(`
        *,
        translation_providers!inner(name)
      `);

    if (providerId) {
      query = query.eq('provider_id', providerId);
    }

    const { data, error } = await query.order('total_requests', { ascending: false });

    if (error) throw error;

    return (data || []).map(m => ({
      ...m,
      provider_name: m.translation_providers?.name,
      success_rate: m.total_requests > 0 
        ? (m.successful_requests / m.total_requests) * 100 
        : 0
    }));
  },

  async getRoutingRules(): Promise<RoutingRule[]> {
    const { data, error } = await supabase
      .from('translation_routing_rules')
      .select('*')
      .order('priority', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async createRoutingRule(rule: Omit<RoutingRule, 'id'>) {
    const { data, error } = await supabase
      .from('translation_routing_rules')
      .insert(rule)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateRoutingRule(id: string, updates: Partial<RoutingRule>) {
    const { error } = await supabase
      .from('translation_routing_rules')
      .update(updates)
      .eq('id', id);

    if (error) throw error;
  },

  async deleteRoutingRule(id: string) {
    const { error } = await supabase
      .from('translation_routing_rules')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async getFailoverHistory(limit = 100) {
    const { data, error } = await supabase
      .from('translation_provider_failovers')
      .select(`
        *,
        original_provider:translation_providers!original_provider_id(name),
        fallback_provider:translation_providers!fallback_provider_id(name)
      `)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  },

  async getProviderComparison(sourceLang: string, targetLang: string) {
    const { data, error } = await supabase
      .from('translation_provider_metrics')
      .select(`
        *,
        translation_providers!inner(name, provider_type, cost_per_1k_chars, quality_score)
      `)
      .eq('source_language', sourceLang)
      .eq('target_language', targetLang);

    if (error) throw error;
    return data || [];
  }
};
