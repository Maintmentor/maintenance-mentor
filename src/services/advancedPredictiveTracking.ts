import { supabase } from '@/lib/supabase';
import { KalmanFilter } from './kalmanFilter';
import { LSTMMotionPredictor, MotionSequence } from './lstmMotionPredictor';

export type PredictionMethod = 'kalman' | 'lstm';

export interface TrackingConfig {
  method: PredictionMethod;
  predictionSteps: number;
  confidenceThreshold: number;
}

export class AdvancedPredictiveTracker {
  private kalmanFilters: Map<string, KalmanFilter> = new Map();
  private lstmPredictor: LSTMMotionPredictor | null = null;
  private config: TrackingConfig;

  constructor(config: Partial<TrackingConfig> = {}) {
    this.config = {
      method: config.method || 'kalman',
      predictionSteps: config.predictionSteps || 5,
      confidenceThreshold: config.confidenceThreshold || 0.5,
    };
  }

  async initialize(objectClass?: string): Promise<void> {
    if (this.config.method === 'lstm') {
      this.lstmPredictor = new LSTMMotionPredictor();
      
      // Try to load existing model for this object class
      if (objectClass) {
        const model = await this.loadModelForClass(objectClass);
        if (model) {
          await this.lstmPredictor.loadModel(model);
        } else {
          await this.lstmPredictor.createModel();
        }
      } else {
        await this.lstmPredictor.createModel();
      }
    }
  }

  async predictNextPositions(
    trackId: string,
    history: any[],
    method?: PredictionMethod
  ): Promise<any[]> {
    const useMethod = method || this.config.method;

    if (useMethod === 'kalman') {
      return this.predictWithKalman(trackId, history);
    } else {
      return this.predictWithLSTM(history);
    }
  }

  private predictWithKalman(trackId: string, history: any[]): any[] {
    if (!this.kalmanFilters.has(trackId)) {
      const latest = history[history.length - 1];
      this.kalmanFilters.set(trackId, new KalmanFilter(latest.bbox));
    }

    const kf = this.kalmanFilters.get(trackId)!;
    const predictions = [];

    for (let i = 0; i < this.config.predictionSteps; i++) {
      const pred = kf.predict();
      predictions.push({
        bbox: pred,
        confidence: Math.max(0.3, 1 - i * 0.15),
        method: 'kalman',
      });
    }

    return predictions;
  }

  private async predictWithLSTM(history: any[]): Promise<any[]> {
    if (!this.lstmPredictor) {
      throw new Error('LSTM predictor not initialized');
    }

    const sequence: MotionSequence = {
      positions: history.map(h => h.bbox),
      timestamps: history.map((_, i) => i),
    };

    const predictions = await this.lstmPredictor.predict(sequence, this.config.predictionSteps);
    
    return predictions.map(pred => ({
      bbox: pred.position,
      confidence: pred.confidence,
      velocity: pred.velocity,
      method: 'lstm',
    }));
  }

  async trainLSTMModel(
    objectClass: string,
    videoId: string
  ): Promise<any> {
    if (!this.lstmPredictor) {
      this.lstmPredictor = new LSTMMotionPredictor();
      await this.lstmPredictor.createModel();
    }

    // Fetch historical tracking data
    const sequences = await this.fetchTrainingData(objectClass, videoId);
    
    if (sequences.length < 10) {
      throw new Error('Insufficient training data. Need at least 10 sequences.');
    }

    // Train the model
    const history = await this.lstmPredictor.train(sequences, 50);

    // Save model to database
    const modelData = await this.lstmPredictor.saveModel();
    await this.saveModelToDatabase(objectClass, modelData, history);

    return history;
  }

  private async fetchTrainingData(
    objectClass: string,
    videoId?: string
  ): Promise<MotionSequence[]> {
    const query = supabase
      .from('video_object_tracks')
      .select('*')
      .eq('object_class', objectClass)
      .order('frame_number', { ascending: true });

    if (videoId) {
      query.eq('video_id', videoId);
    }

    const { data, error } = await query;
    if (error) throw error;

    // Group by track_id
    const trackMap = new Map<string, any[]>();
    data?.forEach(track => {
      if (!trackMap.has(track.track_id)) {
        trackMap.set(track.track_id, []);
      }
      trackMap.get(track.track_id)!.push(track);
    });

    // Convert to sequences
    return Array.from(trackMap.values())
      .filter(tracks => tracks.length >= 10)
      .map(tracks => ({
        positions: tracks.map(t => t.bbox),
        timestamps: tracks.map(t => t.frame_number),
      }));
  }

  private async saveModelToDatabase(
    objectClass: string,
    modelData: any,
    trainingHistory: any
  ): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    await supabase.from('lstm_models').insert({
      user_id: user.id,
      object_class: objectClass,
      model_name: `${objectClass}_lstm_${Date.now()}`,
      model_data: modelData,
      training_metrics: trainingHistory,
      training_samples: trainingHistory.loss?.length || 0,
    });
  }

  private async loadModelForClass(objectClass: string): Promise<any> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data } = await supabase
      .from('lstm_models')
      .select('*')
      .eq('user_id', user.id)
      .eq('object_class', objectClass)
      .eq('is_active', true)
      .order('trained_at', { ascending: false })
      .limit(1)
      .single();

    return data?.model_data || null;
  }

  setMethod(method: PredictionMethod): void {
    this.config.method = method;
  }

  dispose(): void {
    this.kalmanFilters.clear();
    if (this.lstmPredictor) {
      this.lstmPredictor.dispose();
      this.lstmPredictor = null;
    }
  }
}
