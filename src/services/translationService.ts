import { supabase } from '@/lib/supabase';

export interface TranslationResult {
  translatedText: string;
  cached: boolean;
  sourceLang: string;
  targetLang: string;
  confidence?: number;
  translationId?: string;
}

export interface TranslationFeedback {
  translationId: string;
  rating: number; // -1 or 1
  suggestedCorrection?: string;
  feedbackComment?: string;
}


export interface TranslationPreferences {
  sourceLanguage: string;
  targetLanguage: string;
  autoTranslateEnabled: boolean;
  translateAiResponses: boolean;
}

class TranslationService {
  private preferences: TranslationPreferences | null = null;

  async translate(
    text: string,
    sourceLang: string,
    targetLang: string,
    useCache = true
  ): Promise<TranslationResult> {
    try {
      const { data, error } = await supabase.functions.invoke('translation-service', {
        body: { text, sourceLang, targetLang, useCache }
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Translation error:', error);
      throw error;
    }
  }

  async getPreferences(userId: string): Promise<TranslationPreferences> {
    if (this.preferences) return this.preferences;

    const { data, error } = await supabase
      .from('translation_preferences')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching preferences:', error);
    }

    this.preferences = data ? {
      sourceLanguage: data.source_language,
      targetLanguage: data.target_language,
      autoTranslateEnabled: data.auto_translate_enabled,
      translateAiResponses: data.translate_ai_responses
    } : {
      sourceLanguage: 'auto',
      targetLanguage: 'en-US',
      autoTranslateEnabled: true,
      translateAiResponses: true
    };

    return this.preferences;
  }

  async updatePreferences(
    userId: string,
    preferences: Partial<TranslationPreferences>
  ): Promise<void> {
    const { error } = await supabase
      .from('translation_preferences')
      .upsert({
        user_id: userId,
        source_language: preferences.sourceLanguage,
        target_language: preferences.targetLanguage,
        auto_translate_enabled: preferences.autoTranslateEnabled,
        translate_ai_responses: preferences.translateAiResponses,
        updated_at: new Date().toISOString()
      });

    if (error) throw error;
    this.preferences = null; // Clear cache
  }

  async saveToHistory(
    userId: string,
    conversationId: string,
    originalText: string,
    translatedText: string,
    sourceLang: string,
    targetLang: string,
    type: 'user_to_ai' | 'ai_to_user'
  ): Promise<void> {
    await supabase.from('translation_history').insert({
      user_id: userId,
      conversation_id: conversationId,
      original_text: originalText,
      translated_text: translatedText,
      source_language: sourceLang,
      target_language: targetLang,
      translation_type: type
    });
  }

  async getCacheStats(): Promise<{
    totalEntries: number;
    totalUses: number;
    cacheHitRate: number;
  }> {
    const { data, error } = await supabase
      .from('translation_cache')
      .select('use_count');

    if (error) throw error;

    const totalEntries = data.length;
    const totalUses = data.reduce((sum, entry) => sum + entry.use_count, 0);
    const cacheHitRate = totalEntries > 0 ? ((totalUses - totalEntries) / totalUses) * 100 : 0;

    return { totalEntries, totalUses, cacheHitRate };
  }

  async submitFeedback(
    userId: string,
    feedback: TranslationFeedback
  ): Promise<void> {
    const { error } = await supabase
      .from('translation_feedback')
      .insert({
        user_id: userId,
        translation_id: feedback.translationId,
        rating: feedback.rating,
        suggested_correction: feedback.suggestedCorrection,
        feedback_comment: feedback.feedbackComment
      });

    if (error) throw error;
  }

  async getFeedbackStats(): Promise<{
    totalFeedback: number;
    positiveCount: number;
    negativeCount: number;
    averageRating: number;
  }> {
    const { data, error } = await supabase
      .from('translation_feedback')
      .select('rating');

    if (error) throw error;

    const totalFeedback = data.length;
    const positiveCount = data.filter(f => f.rating === 1).length;
    const negativeCount = data.filter(f => f.rating === -1).length;
    const averageRating = totalFeedback > 0 
      ? data.reduce((sum, f) => sum + f.rating, 0) / totalFeedback 
      : 0;

    return { totalFeedback, positiveCount, negativeCount, averageRating };
  }

  clearPreferencesCache(): void {
    this.preferences = null;
  }

}

export const translationService = new TranslationService();
