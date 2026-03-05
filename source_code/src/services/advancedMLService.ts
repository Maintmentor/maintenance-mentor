// Advanced ML Service with Computer Vision Features
import { objectDetectionService, DetectedObject } from './objectDetectionService';

export interface AdvancedImageFeatures {
  edgeDetection: {
    edgeDensity: number;
    sharpness: number;
    blurScore: number;
  };
  colorHistogram: {
    colorfulness: number;
    contrast: number;
    brightness: number;
    saturation: number;
  };
  objectDetection: {
    confidence: number;
    boundingBoxQuality: number;
    centeredness: number;
  };
  exifData: {
    resolution: number;
    hasMetadata: boolean;
    quality: number;
  };
  compositeScore: number;
}

export interface MLWeights {
  edgeDensity: number;
  sharpness: number;
  colorfulness: number;
  contrast: number;
  objectConfidence: number;
  resolution: number;
  centeredness: number;
  bias: number;
}

class AdvancedMLService {
  private weights: MLWeights = {
    edgeDensity: 0.15,
    sharpness: 0.20,
    colorfulness: 0.10,
    contrast: 0.15,
    objectConfidence: 0.25,
    resolution: 0.10,
    centeredness: 0.05,
    bias: 0.5
  };

  // Analyze image using advanced computer vision
  async analyzeImage(imageUrl: string): Promise<AdvancedImageFeatures> {
    try {
      const img = await this.loadImage(imageUrl);
      
      const edgeDetection = await this.detectEdges(img);
      const colorHistogram = await this.analyzeColorHistogram(img);
      const objectDetection = await this.detectObject(img);
      const exifData = await this.parseExifData(imageUrl);

      const compositeScore = this.calculateCompositeScore({
        edgeDetection,
        colorHistogram,
        objectDetection,
        exifData
      });

      return {
        edgeDetection,
        colorHistogram,
        objectDetection,
        exifData,
        compositeScore
      };
    } catch (error) {
      console.error('Error analyzing image:', error);
      return this.getDefaultFeatures();
    }
  }

  private async loadImage(url: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = url;
    });
  }

  // Edge detection using Sobel operator
  private async detectEdges(img: HTMLImageElement) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    canvas.width = img.width;
    canvas.height = img.height;
    ctx.drawImage(img, 0, 0);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    let edgeCount = 0;
    let totalVariance = 0;

    for (let y = 1; y < canvas.height - 1; y++) {
      for (let x = 1; x < canvas.width - 1; x++) {
        const idx = (y * canvas.width + x) * 4;
        const gx = this.getSobelX(data, x, y, canvas.width);
        const gy = this.getSobelY(data, x, y, canvas.width);
        const magnitude = Math.sqrt(gx * gx + gy * gy);
        
        if (magnitude > 50) edgeCount++;
        totalVariance += magnitude;
      }
    }

    const totalPixels = canvas.width * canvas.height;
    const edgeDensity = edgeCount / totalPixels;
    const avgVariance = totalVariance / totalPixels;
    const sharpness = Math.min(avgVariance / 50, 1);
    const blurScore = 1 - sharpness;

    return { edgeDensity, sharpness, blurScore };
  }

  private getSobelX(data: Uint8ClampedArray, x: number, y: number, width: number): number {
    const getGray = (px: number, py: number) => {
      const idx = (py * width + px) * 4;
      return 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
    };

    return (
      -1 * getGray(x - 1, y - 1) + 1 * getGray(x + 1, y - 1) +
      -2 * getGray(x - 1, y) + 2 * getGray(x + 1, y) +
      -1 * getGray(x - 1, y + 1) + 1 * getGray(x + 1, y + 1)
    );
  }

  private getSobelY(data: Uint8ClampedArray, x: number, y: number, width: number): number {
    const getGray = (px: number, py: number) => {
      const idx = (py * width + px) * 4;
      return 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
    };

    return (
      -1 * getGray(x - 1, y - 1) - 2 * getGray(x, y - 1) - 1 * getGray(x + 1, y - 1) +
      1 * getGray(x - 1, y + 1) + 2 * getGray(x, y + 1) + 1 * getGray(x + 1, y + 1)
    );
  }

  // Color histogram analysis
  private async analyzeColorHistogram(img: HTMLImageElement) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    canvas.width = img.width;
    canvas.height = img.height;
    ctx.drawImage(img, 0, 0);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    let rMean = 0, gMean = 0, bMean = 0;
    let rVar = 0, gVar = 0, bVar = 0;
    const pixelCount = data.length / 4;

    for (let i = 0; i < data.length; i += 4) {
      rMean += data[i];
      gMean += data[i + 1];
      bMean += data[i + 2];
    }

    rMean /= pixelCount;
    gMean /= pixelCount;
    bMean /= pixelCount;

    for (let i = 0; i < data.length; i += 4) {
      rVar += Math.pow(data[i] - rMean, 2);
      gVar += Math.pow(data[i + 1] - gMean, 2);
      bVar += Math.pow(data[i + 2] - bMean, 2);
    }

    const contrast = Math.sqrt((rVar + gVar + bVar) / (3 * pixelCount)) / 255;
    const brightness = (rMean + gMean + bMean) / (3 * 255);
    const colorfulness = Math.sqrt(
      Math.pow(rMean - gMean, 2) + Math.pow(gMean - bMean, 2) + Math.pow(bMean - rMean, 2)
    ) / 255;
    const saturation = Math.max(rMean, gMean, bMean) - Math.min(rMean, gMean, bMean);

    return { colorfulness, contrast, brightness, saturation: saturation / 255 };
  }

  // Real object detection using TensorFlow.js COCO-SSD
  private async detectObject(img: HTMLImageElement) {
    try {
      const result = await objectDetectionService.detectObjects(img);
      
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      
      // Calculate centeredness based on detected objects
      let centeredness = 0.5;
      if (result.objects.length > 0) {
        const centerDistances = result.objects.map(obj => {
          const objCenterX = obj.bbox[0] + obj.bbox[2] / 2;
          const objCenterY = obj.bbox[1] + obj.bbox[3] / 2;
          const distance = Math.sqrt(
            Math.pow(objCenterX - centerX, 2) + 
            Math.pow(objCenterY - centerY, 2)
          );
          const maxDistance = Math.sqrt(centerX * centerX + centerY * centerY);
          return 1 - (distance / maxDistance);
        });
        centeredness = centerDistances.reduce((a, b) => a + b, 0) / centerDistances.length;
      }
      
      const confidence = result.averageConfidence;
      const boundingBoxQuality = result.highConfidenceCount / Math.max(result.totalObjects, 1);
      
      return { confidence, boundingBoxQuality, centeredness };
    } catch (error) {
      console.error('Object detection error:', error);
      return { confidence: 0.5, boundingBoxQuality: 0.5, centeredness: 0.5 };
    }
  }


  // Parse EXIF data
  private async parseExifData(imageUrl: string) {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const arrayBuffer = await blob.arrayBuffer();
      
      // Simple resolution check
      const img = await this.loadImage(imageUrl);
      const resolution = img.width * img.height;
      const quality = Math.min(resolution / 1000000, 1); // Normalize to 1MP
      
      return {
        resolution,
        hasMetadata: arrayBuffer.byteLength > 0,
        quality
      };
    } catch {
      return { resolution: 0, hasMetadata: false, quality: 0 };
    }
  }

  private calculateCompositeScore(features: Omit<AdvancedImageFeatures, 'compositeScore'>): number {
    const score = 
      this.weights.edgeDensity * features.edgeDetection.edgeDensity +
      this.weights.sharpness * features.edgeDetection.sharpness +
      this.weights.colorfulness * features.colorHistogram.colorfulness +
      this.weights.contrast * features.colorHistogram.contrast +
      this.weights.objectConfidence * features.objectDetection.confidence +
      this.weights.resolution * features.exifData.quality +
      this.weights.centeredness * features.objectDetection.centeredness +
      this.weights.bias;

    return Math.max(0, Math.min(1, score));
  }

  updateWeights(newWeights: Partial<MLWeights>) {
    this.weights = { ...this.weights, ...newWeights };
  }

  getWeights(): MLWeights {
    return { ...this.weights };
  }

  private getDefaultFeatures(): AdvancedImageFeatures {
    return {
      edgeDetection: { edgeDensity: 0.5, sharpness: 0.5, blurScore: 0.5 },
      colorHistogram: { colorfulness: 0.5, contrast: 0.5, brightness: 0.5, saturation: 0.5 },
      objectDetection: { confidence: 0.5, boundingBoxQuality: 0.5, centeredness: 0.5 },
      exifData: { resolution: 0, hasMetadata: false, quality: 0.5 },
      compositeScore: 0.5
    };
  }
}

export const advancedMLService = new AdvancedMLService();
