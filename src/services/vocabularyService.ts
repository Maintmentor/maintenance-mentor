import { supabase } from '@/lib/supabase';
import { vocabularyAnalyticsService } from './vocabularyAnalyticsService';

export interface VocabularyTerm {
  id: string;
  term: string;
  definition: string;
  phonetic_transcription?: string;
  difficulty_level: number;
  category: string;
  language_code: string;
  audio_url?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  is_verified: boolean;
  verification_count: number;
  usage_frequency: number;
}

export interface VocabularyCollection {
  id: string;
  name: string;
  description?: string;
  is_public: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface UserProgress {
  id: string;
  user_id: string;
  term_id: string;
  mastery_level: number;
  last_reviewed: string;
  next_review: string;
  review_count: number;
  correct_count: number;
  streak: number;
  ease_factor: number;
  interval_days: number;
}

export interface ValidationResult {
  id: string;
  term_id: string;
  validator_id: string;
  is_valid: boolean;
  feedback?: string;
  validated_at: string;
}

class VocabularyService {
  // Spaced repetition algorithm
  calculateNextReview(progress: UserProgress, isCorrect: boolean): Partial<UserProgress> {
    const now = new Date();
    let { ease_factor, interval_days, streak } = progress;
    
    if (isCorrect) {
      streak += 1;
      if (streak === 1) {
        interval_days = 1;
      } else if (streak === 2) {
        interval_days = 6;
      } else {
        interval_days = Math.round(interval_days * ease_factor);
      }
      ease_factor = Math.max(1.3, ease_factor + (0.1 - (5 - progress.mastery_level) * (0.08 + (5 - progress.mastery_level) * 0.02)));
    } else {
      streak = 0;
      interval_days = 1;
      ease_factor = Math.max(1.3, ease_factor - 0.2);
    }

    const next_review = new Date(now.getTime() + interval_days * 24 * 60 * 60 * 1000);
    
    return {
      mastery_level: Math.min(5, Math.max(0, progress.mastery_level + (isCorrect ? 1 : -1))),
      last_reviewed: now.toISOString(),
      next_review: next_review.toISOString(),
      review_count: progress.review_count + 1,
      correct_count: progress.correct_count + (isCorrect ? 1 : 0),
      streak,
      ease_factor,
      interval_days
    };
  }

  async getTerms(filters?: {
    category?: string;
    difficulty?: number;
    verified_only?: boolean;
    search?: string;
  }): Promise<VocabularyTerm[]> {
    let query = supabase.from('vocabulary_terms').select('*');
    
    if (filters?.category) {
      query = query.eq('category', filters.category);
    }
    if (filters?.difficulty) {
      query = query.eq('difficulty_level', filters.difficulty);
    }
    if (filters?.verified_only) {
      query = query.eq('is_verified', true);
    }
    if (filters?.search) {
      query = query.or(`term.ilike.%${filters.search}%,definition.ilike.%${filters.search}%`);
    }
    
    const { data, error } = await query.order('term');
    if (error) throw error;
    return data || [];
  }

  async createTerm(term: Omit<VocabularyTerm, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'is_verified' | 'verification_count' | 'usage_frequency'>): Promise<VocabularyTerm> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('vocabulary_terms')
      .insert([{ ...term, created_by: user.id }])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  async updateProgress(termId: string, isCorrect: boolean): Promise<UserProgress> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Get term details for analytics
    const { data: term } = await supabase
      .from('vocabulary_terms')
      .select('*')
      .eq('id', termId)
      .single();

    // Track the practice action
    if (term) {
      await vocabularyAnalyticsService.trackAction(termId, 'practiced', {
        difficultyLevel: term.difficulty_level?.toString(),
        category: term.category,
        correctAnswer: isCorrect,
        responseTime: Math.floor(Math.random() * 5000) + 1000 // Simulated response time
      });
    }

    // Get current progress
    const { data: currentProgress } = await supabase
      .from('user_vocabulary_progress')
      .select('*')
      .eq('user_id', user.id)
      .eq('term_id', termId)
      .single();

    const updates = this.calculateNextReview(
      currentProgress || {
        user_id: user.id,
        term_id: termId,
        mastery_level: 0,
        review_count: 0,
        correct_count: 0,
        streak: 0,
        ease_factor: 2.5,
        interval_days: 1
      } as UserProgress,
      isCorrect
    );

    // Track mastery if term is mastered
    if (updates.mastery_level && updates.mastery_level >= 4 && term) {
      await vocabularyAnalyticsService.trackAction(termId, 'mastered', {
        difficultyLevel: term.difficulty_level?.toString(),
        category: term.category
      });
    }

    const { data, error } = await supabase
      .from('user_vocabulary_progress')
      .upsert({
        user_id: user.id,
        term_id: termId,
        ...updates
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async getReviewTerms(limit = 20): Promise<(VocabularyTerm & { progress?: UserProgress })[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('vocabulary_terms')
      .select(`
        *,
        user_vocabulary_progress!inner(*)
      `)
      .eq('user_vocabulary_progress.user_id', user.id)
      .lte('user_vocabulary_progress.next_review', new Date().toISOString())
      .limit(limit);

    if (error) throw error;
    return data?.map(item => ({
      ...item,
      progress: item.user_vocabulary_progress?.[0]
    })) || [];
  }

  async validateTerm(termId: string, isValid: boolean, feedback?: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('vocabulary_validations')
      .insert([{
        term_id: termId,
        validator_id: user.id,
        is_valid: isValid,
        feedback
      }]);

    if (error) throw error;

    // Update verification count and status
    const { data: validations } = await supabase
      .from('vocabulary_validations')
      .select('is_valid')
      .eq('term_id', termId);

    if (validations) {
      const validCount = validations.filter(v => v.is_valid).length;
      const totalCount = validations.length;
      const isVerified = validCount >= 3 && validCount / totalCount >= 0.8;

      await supabase
        .from('vocabulary_terms')
        .update({
          verification_count: totalCount,
          is_verified: isVerified
        })
        .eq('id', termId);
    }
  }

  async importGlossary(terms: Array<{
    term: string;
    definition: string;
    category?: string;
    difficulty_level?: number;
    phonetic_transcription?: string;
  }>): Promise<VocabularyTerm[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const termsToInsert = terms.map(term => ({
      ...term,
      created_by: user.id,
      category: term.category || 'imported',
      difficulty_level: term.difficulty_level || 2,
      language_code: 'en'
    }));

    const { data, error } = await supabase
      .from('vocabulary_terms')
      .insert(termsToInsert)
      .select();

    if (error) throw error;
    return data || [];
  }

  async createCollection(name: string, description?: string, isPublic = false): Promise<VocabularyCollection> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('vocabulary_collections')
      .insert([{
        name,
        description,
        is_public: isPublic,
        created_by: user.id
      }])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async addTermToCollection(collectionId: string, termId: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await supabase
      .from('collection_terms')
      .insert([{
        collection_id: collectionId,
        term_id: termId,
        added_by: user.id
      }]);

    if (error) throw error;
  }

  async getCollections(): Promise<VocabularyCollection[]> {
    const { data, error } = await supabase
      .from('vocabulary_collections')
      .select('*')
      .order('name');

    if (error) throw error;
    return data || [];
  }

  async getCollectionTerms(collectionId: string): Promise<VocabularyTerm[]> {
    const { data, error } = await supabase
      .from('collection_terms')
      .select(`
        vocabulary_terms(*)
      `)
      .eq('collection_id', collectionId);

    if (error) throw error;
    return data?.map(item => item.vocabulary_terms).filter(Boolean) || [];
  }

  async getCategories(): Promise<string[]> {
    const { data, error } = await supabase
      .from('vocabulary_terms')
      .select('category')
      .eq('is_verified', true);

    if (error) throw error;
    const categories = [...new Set(data?.map(item => item.category) || [])];
    return categories.sort();
  }

  async getUserStats(): Promise<{
    totalTerms: number;
    masteredTerms: number;
    reviewsDue: number;
    streak: number;
  }> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data: progress } = await supabase
      .from('user_vocabulary_progress')
      .select('*')
      .eq('user_id', user.id);

    if (!progress) {
      return { totalTerms: 0, masteredTerms: 0, reviewsDue: 0, streak: 0 };
    }

    const now = new Date().toISOString();
    const masteredTerms = progress.filter(p => p.mastery_level >= 4).length;
    const reviewsDue = progress.filter(p => p.next_review <= now).length;
    const maxStreak = Math.max(...progress.map(p => p.streak), 0);

    return {
      totalTerms: progress.length,
      masteredTerms,
      reviewsDue,
      streak: maxStreak
    };
  }
}

export const vocabularyService = new VocabularyService();