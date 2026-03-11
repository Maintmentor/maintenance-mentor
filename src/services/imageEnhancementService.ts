import { supabase } from '@/lib/supabase';

export interface EnhancementOptions {
  autoCrop?: boolean;
  removeBackground?: boolean;
  enhanceClarity?: boolean;
  targetSize?: { width: number; height: number };
}

class ImageEnhancementService {
  async enhanceImage(
    imageUrl: string,
    options: EnhancementOptions = {}
  ): Promise<string> {
    try {
      // Call edge function for image enhancement
      const { data, error } = await supabase.functions.invoke('enhance-product-image', {
        body: {
          imageUrl,
          autoCrop: options.autoCrop ?? true,
          removeBackground: options.removeBackground ?? false,
          enhanceClarity: options.enhanceClarity ?? true,
          targetSize: options.targetSize || { width: 800, height: 800 }
        }
      });

      if (error) throw error;
      
      return data.enhancedUrl || imageUrl;
    } catch (error) {
      console.error('Image enhancement error:', error);
      return imageUrl; // Return original on error
    }
  }

  async cropToProduct(imageUrl: string): Promise<string> {
    try {
      // Use OpenAI Vision to detect product boundaries
      const { data, error } = await supabase.functions.invoke('crop-to-product', {
        body: { imageUrl }
      });

      if (error) throw error;
      
      return data.croppedUrl || imageUrl;
    } catch (error) {
      console.error('Auto-crop error:', error);
      return imageUrl;
    }
  }

  async removeBackground(imageUrl: string): Promise<string> {
    try {
      // Use background removal API
      const { data, error } = await supabase.functions.invoke('remove-background', {
        body: { imageUrl }
      });

      if (error) throw error;
      
      return data.processedUrl || imageUrl;
    } catch (error) {
      console.error('Background removal error:', error);
      return imageUrl;
    }
  }

  async batchEnhance(imageUrls: string[]): Promise<Map<string, string>> {
    const results = new Map<string, string>();
    
    for (const url of imageUrls) {
      try {
        const enhanced = await this.enhanceImage(url);
        results.set(url, enhanced);
      } catch (error) {
        results.set(url, url); // Keep original on error
      }
    }
    
    return results;
  }

  getOptimizedUrl(url: string, width: number = 800): string {
    // Add image optimization parameters to URL if supported
    if (url.includes('googleusercontent.com')) {
      return `${url}=w${width}`;
    }
    
    return url;
  }
}

export const imageEnhancementService = new ImageEnhancementService();
