import { supabase } from '@/lib/supabase';

interface TrainingData {
  sourceText: string;
  sourceLanguage: string;
  targetLanguage: string;
  originalTranslation: string;
  suggestedCorrection: string;
  rating: number;
}

class TranslationMLService {
  async getTrainingData(): Promise<TrainingData[]> {
    const { data, error } = await supabase
      .from('translation_ml_training_data')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || []).map(item => ({
      sourceText: item.source_text,
      sourceLanguage: item.source_language,
      targetLanguage: item.target_language,
      originalTranslation: item.original_translation,
      suggestedCorrection: item.suggested_correction,
      rating: item.rating
    }));
  }

  async analyzeTranslationPatterns(): Promise<{
    commonIssues: { issue: string; count: number }[];
    languagePairAccuracy: { pair: string; accuracy: number }[];
    improvementSuggestions: string[];
  }> {
    const trainingData = await this.getTrainingData();

    // Analyze common issues
    const issueMap = new Map<string, number>();
    trainingData.forEach(item => {
      if (item.rating === -1) {
        const issue = this.categorizeIssue(item);
        issueMap.set(issue, (issueMap.get(issue) || 0) + 1);
      }
    });

    const commonIssues = Array.from(issueMap.entries())
      .map(([issue, count]) => ({ issue, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Calculate accuracy by language pair
    const pairMap = new Map<string, { positive: number; total: number }>();
    trainingData.forEach(item => {
      const pair = `${item.sourceLanguage}-${item.targetLanguage}`;
      const stats = pairMap.get(pair) || { positive: 0, total: 0 };
      stats.total++;
      if (item.rating === 1) stats.positive++;
      pairMap.set(pair, stats);
    });

    const languagePairAccuracy = Array.from(pairMap.entries())
      .map(([pair, stats]) => ({
        pair,
        accuracy: stats.total > 0 ? (stats.positive / stats.total) * 100 : 0
      }))
      .sort((a, b) => a.accuracy - b.accuracy);

    // Generate improvement suggestions
    const improvementSuggestions = this.generateSuggestions(commonIssues, languagePairAccuracy);

    return { commonIssues, languagePairAccuracy, improvementSuggestions };
  }

  private categorizeIssue(item: TrainingData): string {
    // Simple categorization based on common patterns
    if (!item.suggestedCorrection) return 'General accuracy issue';
    
    const original = item.originalTranslation.toLowerCase();
    const suggested = item.suggestedCorrection.toLowerCase();

    if (original.length < suggested.length * 0.5) return 'Translation too short';
    if (original.length > suggested.length * 2) return 'Translation too verbose';
    if (this.hasTechnicalTerms(item.sourceText)) return 'Technical terminology issue';
    if (this.hasIdiomatic(item.sourceText)) return 'Idiomatic expression issue';
    
    return 'General accuracy issue';
  }

  private hasTechnicalTerms(text: string): boolean {
    const technicalKeywords = ['repair', 'maintenance', 'diagnostic', 'component', 'system'];
    return technicalKeywords.some(keyword => text.toLowerCase().includes(keyword));
  }

  private hasIdiomatic(text: string): boolean {
    // Simple check for common idioms
    const idiomaticPatterns = ['not working', 'broke down', 'acting up', 'on the fritz'];
    return idiomaticPatterns.some(pattern => text.toLowerCase().includes(pattern));
  }

  private generateSuggestions(
    commonIssues: { issue: string; count: number }[],
    languagePairAccuracy: { pair: string; accuracy: number }[]
  ): string[] {
    const suggestions: string[] = [];

    if (commonIssues.length > 0) {
      suggestions.push(`Focus on improving: ${commonIssues[0].issue}`);
    }

    const lowAccuracyPairs = languagePairAccuracy.filter(p => p.accuracy < 70);
    if (lowAccuracyPairs.length > 0) {
      suggestions.push(`Improve translation quality for: ${lowAccuracyPairs.map(p => p.pair).join(', ')}`);
    }

    suggestions.push('Consider adding more context-aware translation rules');
    suggestions.push('Review technical terminology glossary');

    return suggestions;
  }

  async getMLMetrics(): Promise<{
    totalTrainingExamples: number;
    positiveExamples: number;
    negativeExamples: number;
    averageConfidence: number;
  }> {
    const trainingData = await this.getTrainingData();

    return {
      totalTrainingExamples: trainingData.length,
      positiveExamples: trainingData.filter(d => d.rating === 1).length,
      negativeExamples: trainingData.filter(d => d.rating === -1).length,
      averageConfidence: 0.85 // Placeholder - would calculate from actual model
    };
  }
}

export const translationMLService = new TranslationMLService();
