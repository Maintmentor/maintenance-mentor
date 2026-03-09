import { supabase } from '@/lib/supabase';
import { AdvancedImageFeatures } from './advancedMLService';

export interface ImageFeedback {
  id?: string;
  user_id?: string;
  message_id?: string;
  part_number: string;
  image_url: string;
  search_query: string;
  feedback_type: 'positive' | 'negative';
  ai_verification_score?: number;
  ai_verification_reasoning?: string;
  clarity_score?: number;
  visibility_score?: number;
  background_score?: number;
  relevance_score?: number;
  ml_prediction_score?: number;
  advanced_features?: AdvancedImageFeatures;
  created_at?: string;
}



export const imageFeedbackService = {
  async submitFeedback(feedback: ImageFeedback): Promise<{ success: boolean; error?: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const insertData: any = {
        user_id: user?.id,
        message_id: feedback.message_id,
        part_number: feedback.part_number,
        image_url: feedback.image_url,
        search_query: feedback.search_query,
        feedback_type: feedback.feedback_type,
        ai_verification_score: feedback.ai_verification_score,
        ai_verification_reasoning: feedback.ai_verification_reasoning,
        clarity_score: feedback.clarity_score,
        visibility_score: feedback.visibility_score,
        background_score: feedback.background_score,
        relevance_score: feedback.relevance_score,
        ml_prediction_score: feedback.ml_prediction_score
      };

      // Add advanced features if available
      if (feedback.advanced_features) {
        const af = feedback.advanced_features;
        insertData.edge_density = af.edgeDetection.edgeDensity;
        insertData.sharpness = af.edgeDetection.sharpness;
        insertData.blur_score = af.edgeDetection.blurScore;
        insertData.colorfulness = af.colorHistogram.colorfulness;
        insertData.contrast = af.colorHistogram.contrast;
        insertData.brightness = af.colorHistogram.brightness;
        insertData.saturation = af.colorHistogram.saturation;
        insertData.object_confidence = af.objectDetection.confidence;
        insertData.bounding_box_quality = af.objectDetection.boundingBoxQuality;
        insertData.centeredness = af.objectDetection.centeredness;
        insertData.image_resolution = af.exifData.resolution;
        insertData.has_metadata = af.exifData.hasMetadata;
        insertData.composite_score = af.compositeScore;
      }

      const { error } = await supabase
        .from('image_quality_feedback')
        .insert(insertData);

      if (error) throw error;

      return { success: true };
    } catch (error: any) {
      console.error('Error submitting feedback:', error);
      return { success: false, error: error.message };
    }
  },



  async getFeedbackStats(partNumber: string): Promise<{ positive: number; negative: number }> {
    try {
      const { data, error } = await supabase
        .from('image_quality_feedback')
        .select('feedback_type')
        .eq('part_number', partNumber);

      if (error) throw error;

      const positive = data?.filter(f => f.feedback_type === 'positive').length || 0;
      const negative = data?.filter(f => f.feedback_type === 'negative').length || 0;

      return { positive, negative };
    } catch (error) {
      console.error('Error getting feedback stats:', error);
      return { positive: 0, negative: 0 };
    }
  },

  async getSearchQueryPerformance(searchQuery: string): Promise<number> {
    try {
      const { data, error } = await supabase
        .from('image_quality_feedback')
        .select('feedback_type')
        .eq('search_query', searchQuery);

      if (error) throw error;
      if (!data || data.length === 0) return 0.5;

      const positive = data.filter(f => f.feedback_type === 'positive').length;
      return positive / data.length;
    } catch (error) {
      console.error('Error getting search performance:', error);
      return 0.5;
    }
  }
};
