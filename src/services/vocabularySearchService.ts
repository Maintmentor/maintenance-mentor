import { supabase } from '@/lib/supabase';
import { VocabularyTerm, UserProgress } from './vocabularyService';

export interface SearchFilters {
  query?: string;
  difficulty?: number[];
  categories?: string[];
  equipmentTypes?: string[];
  masteryStatus?: ('new' | 'learning' | 'mastered' | 'review')[];
  tags?: string[];
  isVerified?: boolean;
  dateRange?: {
    from: Date;
    to: Date;
  };
}

export interface SavedSearch {
  id: string;
  name: string;
  filters: SearchFilters;
  user_id: string;
  created_at: string;
  last_used: string;
  use_count: number;
}

export interface SearchSuggestion {
  type: 'term' | 'category' | 'tag' | 'recent';
  value: string;
  count?: number;
  relevance: number;
}

class VocabularySearchService {
  async searchTerms(filters: SearchFilters, limit = 50, offset = 0): Promise<{
    terms: (VocabularyTerm & { progress?: UserProgress })[];
    total: number;
  }> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    let query = supabase
      .from('vocabulary_terms')
      .select(`
        *,
        user_vocabulary_progress(*)
      `, { count: 'exact' });

    // Full-text search across terms and definitions
    if (filters.query) {
      const searchQuery = filters.query.trim();
      query = query.or(`
        term.ilike.%${searchQuery}%,
        definition.ilike.%${searchQuery}%,
        phonetic_transcription.ilike.%${searchQuery}%
      `);
    }

    // Difficulty levels filter
    if (filters.difficulty && filters.difficulty.length > 0) {
      query = query.in('difficulty_level', filters.difficulty);
    }

    // Categories filter
    if (filters.categories && filters.categories.length > 0) {
      query = query.in('category', filters.categories);
    }

    // Equipment types filter (using category field)
    if (filters.equipmentTypes && filters.equipmentTypes.length > 0) {
      query = query.in('category', filters.equipmentTypes);
    }

    // Verification status
    if (filters.isVerified !== undefined) {
      query = query.eq('is_verified', filters.isVerified);
    }

    // Date range filter
    if (filters.dateRange) {
      query = query
        .gte('created_at', filters.dateRange.from.toISOString())
        .lte('created_at', filters.dateRange.to.toISOString());
    }

    const { data, error, count } = await query
      .range(offset, offset + limit - 1)
      .order('usage_frequency', { ascending: false });

    if (error) throw error;

    let filteredData = data || [];

    // Apply mastery status filter (requires progress data)
    if (filters.masteryStatus && filters.masteryStatus.length > 0) {
      filteredData = filteredData.filter(term => {
        const progress = term.user_vocabulary_progress?.[0];
        if (!progress && filters.masteryStatus?.includes('new')) return true;
        if (!progress) return false;

        const masteryLevel = progress.mastery_level;
        const nextReview = new Date(progress.next_review);
        const now = new Date();

        if (filters.masteryStatus?.includes('new') && masteryLevel === 0) return true;
        if (filters.masteryStatus?.includes('learning') && masteryLevel > 0 && masteryLevel < 4) return true;
        if (filters.masteryStatus?.includes('mastered') && masteryLevel >= 4) return true;
        if (filters.masteryStatus?.includes('review') && nextReview <= now) return true;

        return false;
      });
    }

    return {
      terms: filteredData.map(item => ({
        ...item,
        progress: item.user_vocabulary_progress?.[0]
      })),
      total: count || 0
    };
  }

  async saveSearch(name: string, filters: SearchFilters): Promise<SavedSearch> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('saved_searches')
      .insert([{
        name,
        filters: JSON.stringify(filters),
        user_id: user.id,
        use_count: 0
      }])
      .select()
      .single();

    if (error) throw error;
    return {
      ...data,
      filters: JSON.parse(data.filters)
    };
  }

  async getSavedSearches(): Promise<SavedSearch[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('saved_searches')
      .select('*')
      .eq('user_id', user.id)
      .order('last_used', { ascending: false });

    if (error) throw error;
    return (data || []).map(item => ({
      ...item,
      filters: JSON.parse(item.filters)
    }));
  }

  async updateSearchUsage(searchId: string): Promise<void> {
    await supabase
      .from('saved_searches')
      .update({
        last_used: new Date().toISOString(),
        use_count: supabase.sql`use_count + 1`
      })
      .eq('id', searchId);
  }

  async getSearchSuggestions(query: string): Promise<SearchSuggestion[]> {
    const suggestions: SearchSuggestion[] = [];
    const searchQuery = query.toLowerCase().trim();

    if (searchQuery.length < 2) return suggestions;

    // Term suggestions
    const { data: termData } = await supabase
      .from('vocabulary_terms')
      .select('term, usage_frequency')
      .ilike('term', `%${searchQuery}%`)
      .eq('is_verified', true)
      .limit(5);

    termData?.forEach(term => {
      suggestions.push({
        type: 'term',
        value: term.term,
        relevance: term.usage_frequency || 0
      });
    });

    // Category suggestions
    const { data: categoryData } = await supabase
      .from('vocabulary_terms')
      .select('category')
      .ilike('category', `%${searchQuery}%`)
      .eq('is_verified', true);

    const categories = [...new Set(categoryData?.map(c => c.category) || [])];
    categories.forEach(category => {
      suggestions.push({
        type: 'category',
        value: category,
        relevance: 50
      });
    });

    return suggestions.sort((a, b) => b.relevance - a.relevance).slice(0, 8);
  }

  async getFrequentlyAccessedTerms(limit = 10): Promise<VocabularyTerm[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const { data, error } = await supabase
      .from('vocabulary_terms')
      .select(`
        *,
        user_vocabulary_progress!inner(review_count)
      `)
      .eq('user_vocabulary_progress.user_id', user.id)
      .order('user_vocabulary_progress.review_count', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  }

  async getRecommendedTerms(limit = 10): Promise<VocabularyTerm[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    // Get user's learning patterns
    const { data: progressData } = await supabase
      .from('user_vocabulary_progress')
      .select('term_id, mastery_level')
      .eq('user_id', user.id);

    if (!progressData || progressData.length === 0) {
      // New user - recommend beginner terms
      const { data, error } = await supabase
        .from('vocabulary_terms')
        .select('*')
        .eq('difficulty_level', 1)
        .eq('is_verified', true)
        .order('usage_frequency', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    }

    // Get categories user is learning
    const learnedTermIds = progressData.map(p => p.term_id);
    const { data: learnedTerms } = await supabase
      .from('vocabulary_terms')
      .select('category, difficulty_level')
      .in('id', learnedTermIds);

    const userCategories = [...new Set(learnedTerms?.map(t => t.category) || [])];
    const avgDifficulty = Math.round(
      (learnedTerms?.reduce((sum, t) => sum + t.difficulty_level, 0) || 0) / 
      (learnedTerms?.length || 1)
    );

    // Recommend similar difficulty terms in same categories
    const { data, error } = await supabase
      .from('vocabulary_terms')
      .select('*')
      .in('category', userCategories)
      .gte('difficulty_level', Math.max(1, avgDifficulty - 1))
      .lte('difficulty_level', Math.min(5, avgDifficulty + 1))
      .not('id', 'in', `(${learnedTermIds.join(',')})`)
      .eq('is_verified', true)
      .order('usage_frequency', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  }

  async getFilterOptions(): Promise<{
    categories: string[];
    equipmentTypes: string[];
    tags: string[];
    difficultyLevels: number[];
  }> {
    const [categoriesData, tagsData] = await Promise.all([
      supabase
        .from('vocabulary_terms')
        .select('category')
        .eq('is_verified', true),
      supabase
        .from('vocabulary_terms')
        .select('category')
        .eq('is_verified', true)
    ]);

    const categories = [...new Set(categoriesData.data?.map(c => c.category) || [])];
    const equipmentTypes = categories.filter(c => 
      ['hydraulic', 'electrical', 'mechanical', 'pneumatic', 'electronic'].some(type => 
        c.toLowerCase().includes(type)
      )
    );

    return {
      categories: categories.sort(),
      equipmentTypes: equipmentTypes.sort(),
      tags: [], // Could be expanded with a tags system
      difficultyLevels: [1, 2, 3, 4, 5]
    };
  }
}

export const vocabularySearchService = new VocabularySearchService();