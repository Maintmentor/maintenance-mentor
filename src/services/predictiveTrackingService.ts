import { supabase } from '@/lib/supabase';
import { KalmanFilter } from './kalmanFilter';

interface Detection {
  frame: number;
  timestamp: number;
  bbox: { x: number; y: number; width: number; height: number };
  confidence: number;
}

interface PredictedPosition {
  frame: number;
  x: number;
  y: number;
  width: number;
  height: number;
  confidence: number;
  velocity: { x: number; y: number };
  acceleration: { x: number; y: number };
}

interface Warning {
  type: 'exit_frame' | 'dangerous_area' | 'rapid_movement' | 'occlusion';
  severity: 'low' | 'medium' | 'high';
  frame: number;
  message: string;
  metadata?: any;
}

export class PredictiveTracker {
  private kalmanFilter: KalmanFilter;
  private previousVelocity: { x: number; y: number } = { x: 0, y: 0 };
  private frameWidth: number;
  private frameHeight: number;
  private dangerZones: Array<{ x: number; y: number; width: number; height: number }> = [];

  constructor(
    initialX: number,
    initialY: number,
    frameWidth: number = 1920,
    frameHeight: number = 1080,
    dangerZones: Array<{ x: number; y: number; width: number; height: number }> = []
  ) {
    this.kalmanFilter = new KalmanFilter(initialX, initialY);
    this.frameWidth = frameWidth;
    this.frameHeight = frameHeight;
    this.dangerZones = dangerZones;
  }

  // Predict next N frames
  predictFuturePositions(
    currentDetections: Detection[],
    numFramesToPredict: number = 10
  ): PredictedPosition[] {
    const predictions: PredictedPosition[] = [];
    
    // Update Kalman filter with current detections
    currentDetections.forEach(det => {
      const centerX = det.bbox.x + det.bbox.width / 2;
      const centerY = det.bbox.y + det.bbox.height / 2;
      this.kalmanFilter.update(centerX, centerY);
    });

    const lastDet = currentDetections[currentDetections.length - 1];
    const lastWidth = lastDet.bbox.width;
    const lastHeight = lastDet.bbox.height;

    // Predict future frames
    for (let i = 1; i <= numFramesToPredict; i++) {
      const predicted = this.kalmanFilter.predict();
      
      // Calculate acceleration
      const acceleration = {
        x: predicted.vx - this.previousVelocity.x,
        y: predicted.vy - this.previousVelocity.y
      };
      
      this.previousVelocity = { x: predicted.vx, y: predicted.vy };

      // Confidence decreases with prediction distance
      const confidence = Math.max(0.3, 1 - (i * 0.05));

      predictions.push({
        frame: lastDet.frame + i,
        x: predicted.x - lastWidth / 2,
        y: predicted.y - lastHeight / 2,
        width: lastWidth,
        height: lastHeight,
        confidence,
        velocity: { x: predicted.vx, y: predicted.vy },
        acceleration
      });
    }

    return predictions;
  }

  // Handle occlusions by predicting positions during missing frames
  handleOcclusion(
    lastKnownDetection: Detection,
    occlusionDuration: number
  ): PredictedPosition[] {
    const predictions: PredictedPosition[] = [];
    
    for (let i = 1; i <= occlusionDuration; i++) {
      const predicted = this.kalmanFilter.predict();
      predictions.push({
        frame: lastKnownDetection.frame + i,
        x: predicted.x - lastKnownDetection.bbox.width / 2,
        y: predicted.y - lastKnownDetection.bbox.height / 2,
        width: lastKnownDetection.bbox.width,
        height: lastKnownDetection.bbox.height,
        confidence: Math.max(0.2, 0.8 - (i * 0.1)),
        velocity: { x: predicted.vx, y: predicted.vy },
        acceleration: { x: 0, y: 0 }
      });
    }

    return predictions;
  }

  // Smooth trajectory by applying Kalman filter to all detections
  smoothTrajectory(detections: Detection[]): Detection[] {
    const smoothed: Detection[] = [];
    
    detections.forEach(det => {
      const centerX = det.bbox.x + det.bbox.width / 2;
      const centerY = det.bbox.y + det.bbox.height / 2;
      
      this.kalmanFilter.update(centerX, centerY);
      const state = this.kalmanFilter.getState();
      
      smoothed.push({
        ...det,
        bbox: {
          x: state.x - det.bbox.width / 2,
          y: state.y - det.bbox.height / 2,
          width: det.bbox.width,
          height: det.bbox.height
        }
      });
    });

    return smoothed;
  }

  // Generate warnings based on predictions
  generateWarnings(predictions: PredictedPosition[]): Warning[] {
    const warnings: Warning[] = [];

    predictions.forEach(pred => {
      // Check if object is exiting frame
      if (
        pred.x < 0 || pred.y < 0 ||
        pred.x + pred.width > this.frameWidth ||
        pred.y + pred.height > this.frameHeight
      ) {
        warnings.push({
          type: 'exit_frame',
          severity: 'medium',
          frame: pred.frame,
          message: `Object predicted to exit frame at frame ${pred.frame}`,
          metadata: { position: { x: pred.x, y: pred.y } }
        });
      }

      // Check if object is entering danger zone
      this.dangerZones.forEach((zone, idx) => {
        if (this.isOverlapping(pred, zone)) {
          warnings.push({
            type: 'dangerous_area',
            severity: 'high',
            frame: pred.frame,
            message: `Object entering dangerous area ${idx + 1} at frame ${pred.frame}`,
            metadata: { zone, position: { x: pred.x, y: pred.y } }
          });
        }
      });

      // Check for rapid movement
      const speed = Math.sqrt(pred.velocity.x ** 2 + pred.velocity.y ** 2);
      if (speed > 50) {
        warnings.push({
          type: 'rapid_movement',
          severity: 'low',
          frame: pred.frame,
          message: `Rapid movement detected (speed: ${speed.toFixed(1)} px/frame)`,
          metadata: { velocity: pred.velocity, speed }
        });
      }
    });

    return warnings;
  }

  private isOverlapping(
    bbox1: { x: number; y: number; width: number; height: number },
    bbox2: { x: number; y: number; width: number; height: number }
  ): boolean {
    return !(
      bbox1.x + bbox1.width < bbox2.x ||
      bbox2.x + bbox2.width < bbox1.x ||
      bbox1.y + bbox1.height < bbox2.y ||
      bbox2.y + bbox2.height < bbox1.y
    );
  }
}

// Save predictions to database
export const savePredictions = async (
  trackId: string,
  analysisId: string,
  predictions: PredictedPosition[]
) => {
  const records = predictions.map(pred => ({
    track_id: trackId,
    analysis_id: analysisId,
    predicted_frame: pred.frame,
    predicted_x: pred.x,
    predicted_y: pred.y,
    predicted_width: pred.width,
    predicted_height: pred.height,
    confidence: pred.confidence,
    velocity_x: pred.velocity.x,
    velocity_y: pred.velocity.y,
    acceleration_x: pred.acceleration.x,
    acceleration_y: pred.acceleration.y
  }));

  const { error } = await supabase
    .from('video_object_predictions')
    .insert(records);

  if (error) throw error;
};

// Save warnings to database
export const saveWarnings = async (
  trackId: string,
  analysisId: string,
  warnings: Warning[]
) => {
  const records = warnings.map(warning => ({
    track_id: trackId,
    analysis_id: analysisId,
    warning_type: warning.type,
    frame_number: warning.frame,
    severity: warning.severity,
    message: warning.message,
    metadata: warning.metadata
  }));

  const { error } = await supabase
    .from('video_tracking_warnings')
    .insert(records);

  if (error) throw error;
};

// Get predictions for a track
export const getPredictions = async (trackId: string) => {
  const { data, error } = await supabase
    .from('video_object_predictions')
    .select('*')
    .eq('track_id', trackId)
    .order('predicted_frame');

  if (error) throw error;
  return data;
};

// Get warnings for an analysis
export const getWarnings = async (analysisId: string) => {
  const { data, error } = await supabase
    .from('video_tracking_warnings')
    .select('*')
    .eq('analysis_id', analysisId)
    .order('frame_number');

  if (error) throw error;
  return data;
};
