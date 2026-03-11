import * as cocoSsd from '@tensorflow-models/coco-ssd';
import '@tensorflow/tfjs';

export interface DetectedObject {
  class: string;
  score: number;
  bbox: [number, number, number, number]; // [x, y, width, height]
}

export interface ObjectDetectionResult {
  objects: DetectedObject[];
  totalObjects: number;
  averageConfidence: number;
  highConfidenceCount: number;
  productRelevance: number;
}

class ObjectDetectionService {
  private model: cocoSsd.ObjectDetection | null = null;
  private modelLoading: Promise<cocoSsd.ObjectDetection> | null = null;

  async loadModel(): Promise<cocoSsd.ObjectDetection> {
    if (this.model) return this.model;
    if (this.modelLoading) return this.modelLoading;

    this.modelLoading = cocoSsd.load();
    this.model = await this.modelLoading;
    this.modelLoading = null;
    return this.model;
  }

  async detectObjects(imageElement: HTMLImageElement | HTMLCanvasElement): Promise<ObjectDetectionResult> {
    const model = await this.loadModel();
    const predictions = await model.detect(imageElement);

    const objects: DetectedObject[] = predictions.map(pred => ({
      class: pred.class,
      score: pred.score,
      bbox: pred.bbox as [number, number, number, number]
    }));

    const totalObjects = objects.length;
    const averageConfidence = totalObjects > 0 
      ? objects.reduce((sum, obj) => sum + obj.score, 0) / totalObjects 
      : 0;
    const highConfidenceCount = objects.filter(obj => obj.score > 0.7).length;
    const productRelevance = this.calculateProductRelevance(objects);

    return {
      objects,
      totalObjects,
      averageConfidence,
      highConfidenceCount,
      productRelevance
    };
  }

  private calculateProductRelevance(objects: DetectedObject[]): number {
    const relevantClasses = [
      'sink', 'toilet', 'refrigerator', 'oven', 'toaster', 'microwave',
      'bottle', 'cup', 'fork', 'knife', 'spoon', 'bowl', 'chair', 'couch',
      'bed', 'dining table', 'tv', 'laptop', 'mouse', 'keyboard', 'cell phone',
      'clock', 'vase', 'scissors', 'teddy bear', 'hair drier', 'toothbrush'
    ];

    const relevantObjects = objects.filter(obj => 
      relevantClasses.includes(obj.class.toLowerCase())
    );

    return relevantObjects.length > 0 ? relevantObjects.length / objects.length : 0;
  }
}

export const objectDetectionService = new ObjectDetectionService();

// Export convenience function for direct use
export const detectObjects = async (imageElement: HTMLImageElement | HTMLCanvasElement): Promise<DetectedObject[]> => {
  const result = await objectDetectionService.detectObjects(imageElement);
  return result.objects;
};

