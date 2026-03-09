import { supabase } from '@/lib/supabase';
import { analyzeFallback } from './fallbackAnalysisService';

export interface PartSource {
  part: string;
  retailers: string[];
  estimatedPrice: string;
  partNumber?: string;
  notes?: string;
}

export interface AIAnalysisResult {
  diagnosis: string;
  severity: 'low' | 'medium' | 'high';
  recommendations: string[];
  estimatedCost: string;
  difficulty: 'easy' | 'medium' | 'hard';
  tools: string[];
  safetyWarnings?: string[];
  partsSources?: PartSource[];
}

export const analyzeRepairImage = async (imageData: string, imageFile?: File): Promise<AIAnalysisResult> => {
  try {
    // Call the edge function instead of OpenAI directly
    const { data, error } = await supabase.functions.invoke('repair-diagnostic', {
      body: { 
        question: 'Please analyze this image and provide detailed repair recommendations, identify all parts needed, and provide safety warnings',
        images: [imageData]
      }
    });

    if (error) {
      console.error('Edge function error:', error);
      throw error;
    }

    if (data && data.success && data.answer) {
      // Parse the answer to extract structured information
      const answer = data.answer;
      const lines = answer.split('\n');
      
      // Extract severity from answer
      let severity: 'low' | 'medium' | 'high' = 'medium';
      if (answer.toLowerCase().includes('urgent') || answer.toLowerCase().includes('immediate')) {
        severity = 'high';
      } else if (answer.toLowerCase().includes('minor') || answer.toLowerCase().includes('simple')) {
        severity = 'low';
      }

      // Extract recommendations (numbered steps)
      const recommendations = lines
        .filter(line => /^\d+\./.test(line.trim()))
        .map(line => line.trim());

      // Extract tools mentioned
      const toolKeywords = ['wrench', 'screwdriver', 'pliers', 'hammer', 'drill', 'saw', 'level', 'tape measure'];
      const tools = toolKeywords.filter(tool => answer.toLowerCase().includes(tool));
      if (tools.length === 0) tools.push('Basic hand tools');

      // Extract safety warnings
      const safetyWarnings = lines
        .filter(line => line.toLowerCase().includes('safety') || line.toLowerCase().includes('warning') || line.toLowerCase().includes('caution'))
        .map(line => line.trim())
        .filter(line => line.length > 0);

      // Process part images if available
      const partsSources = data.partImages?.map((img: any) => ({
        part: img.query,
        retailers: ['HD Supply', 'Home Depot', 'Lowes'],
        estimatedPrice: '$10-50',
        partNumber: `HD-${Date.now()}`,
        notes: img.source
      })) || [];

      return {
        diagnosis: data.answer || 'Unable to analyze image',
        severity,
        recommendations: recommendations.length > 0 ? recommendations : [data.answer],
        estimatedCost: '$50-200',
        difficulty: severity === 'high' ? 'hard' : severity === 'low' ? 'easy' : 'medium',
        tools,
        safetyWarnings: safetyWarnings.length > 0 ? safetyWarnings : undefined,
        partsSources
      };
    }

    // Fallback if edge function returns unexpected format
    console.log('Using fallback due to unexpected response format');
    return await analyzeFallback(imageFile);
  } catch (error) {
    console.error('AI Vision API Error:', error);
    // Use fallback analysis when API fails
    return await analyzeFallback(imageFile);
  }
};