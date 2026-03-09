import { supabase } from '@/lib/supabase';

export interface ImageQualityScore {
  overall: number;
  clarity: number;
  productVisibility: number;
  backgroundQuality: number;
  relevance: number;
  mlPrediction: number;
}

export interface ImageFeatures {
  url: string;
  width?: number;
  height?: number;
  fileSize?: number;
  hasTransparentBg?: boolean;
  dominantColors?: string[];
}

class MLImageScoringService {
  private modelWeights = {
    clarity: 0.25,
    productVisibility: 0.30,
    backgroundQuality: 0.20,
    relevance: 0.25
  };

  private modelLoaded = false;

  async loadLatestModel(): Promise<void> {
    try {
      const { data: config } = await supabase
        .from('ml_model_configs')
        .select('*')
        .eq('model_name', 'image_quality_scorer')
        .order('version', { ascending: false })
        .limit(1)
        .single();

      if (config?.config?.weights) {
        this.modelWeights = {
          clarity: config.config.weights.clarity,
          productVisibility: config.config.weights.visibility,
          backgroundQuality: config.config.weights.background,
          relevance: config.config.weights.relevance
        };
        this.modelLoaded = true;
        console.log('Loaded ML model version:', config.version);
      }
    } catch (error) {
      console.error('Failed to load ML model:', error);
    }
  }


  async scoreImage(
    imageUrl: string,
    searchQuery: string,
    partNumber?: string
  ): Promise<ImageQualityScore> {
    // Load latest model if not already loaded
    if (!this.modelLoaded) {
      await this.loadLatestModel();
    }


    const features = await this.extractImageFeatures(imageUrl);
    const historicalScore = await this.getHistoricalScore(searchQuery, partNumber);

    
    const clarity = this.scoreClarity(features);
    const productVisibility = this.scoreProductVisibility(features);
    const backgroundQuality = this.scoreBackgroundQuality(features);
    const relevance = await this.scoreRelevance(imageUrl, searchQuery, partNumber);
    
    const baseScore = 
      clarity * this.modelWeights.clarity +
      productVisibility * this.modelWeights.productVisibility +
      backgroundQuality * this.modelWeights.backgroundQuality +
      relevance * this.modelWeights.relevance;
    
    const mlPrediction = historicalScore ? 
      (baseScore * 0.7 + historicalScore * 0.3) : baseScore;
    
    return {
      overall: mlPrediction,
      clarity,
      productVisibility,
      backgroundQuality,
      relevance,
      mlPrediction
    };
  }

  private async extractImageFeatures(url: string): Promise<ImageFeatures> {
    return {
      url,
      width: 800,
      height: 600,
      hasTransparentBg: url.includes('.png'),
      dominantColors: ['white', 'gray']
    };
  }

  private scoreClarity(features: ImageFeatures): number {
    let score = 0.5;
    if (features.width && features.width >= 800) score += 0.2;
    if (features.height && features.height >= 600) score += 0.2;
    if (features.fileSize && features.fileSize > 50000) score += 0.1;
    return Math.min(score, 1.0);
  }

  private scoreProductVisibility(features: ImageFeatures): number {
    let score = 0.6;
    if (features.hasTransparentBg) score += 0.2;
    if (features.dominantColors?.includes('white')) score += 0.2;
    return Math.min(score, 1.0);
  }

  private scoreBackgroundQuality(features: ImageFeatures): number {
    let score = 0.5;
    if (features.hasTransparentBg) score += 0.3;
    if (features.dominantColors?.includes('white') || 
        features.dominantColors?.includes('gray')) score += 0.2;
    return Math.min(score, 1.0);
  }

  private async scoreRelevance(
    url: string,
    searchQuery: string,
    partNumber?: string
  ): Promise<number> {
    const queryTerms = searchQuery.toLowerCase().split(' ');
    const urlLower = url.toLowerCase();
    let matches = 0;
    
    queryTerms.forEach(term => {
      if (urlLower.includes(term)) matches++;
    });
    
    return Math.min(matches / queryTerms.length + 0.3, 1.0);
  }

  private async getHistoricalScore(
    searchQuery: string,
    partNumber?: string
  ): Promise<number | null> {
    try {
      let query = supabase
        .from('image_quality_feedback')
        .select('feedback_type');
      
      if (partNumber) {
        query = query.eq('part_number', partNumber);
      } else {
        query = query.eq('search_query', searchQuery);
      }
      
      const { data, error } = await query.limit(100);
      
      if (error || !data || data.length === 0) return null;
      
      const positive = data.filter(f => f.feedback_type === 'positive').length;
      return positive / data.length;
    } catch (error) {
      return null;
    }
  }

  async trainFromFeedback(): Promise<void> {
    const { data: feedback } = await supabase
      .from('image_quality_feedback')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1000);
    
    if (!feedback || feedback.length === 0) return;
    
    const positive = feedback.filter(f => f.feedback_type === 'positive');
    const negative = feedback.filter(f => f.feedback_type === 'negative');
    
    if (positive.length > 50 && negative.length > 50) {
      this.adjustWeights(positive, negative);
    }
  }

  private adjustWeights(positive: any[], negative: any[]) {
    const avgPositiveScore = positive.reduce((sum, f) => 
      sum + (f.ai_verification_score || 0.5), 0) / positive.length;
    const avgNegativeScore = negative.reduce((sum, f) => 
      sum + (f.ai_verification_score || 0.5), 0) / negative.length;
    
    if (avgPositiveScore > avgNegativeScore + 0.1) {
      this.modelWeights.relevance += 0.05;
      this.modelWeights.clarity -= 0.05;
    }
  }
}

export const mlImageScoringService = new MLImageScoringService();
