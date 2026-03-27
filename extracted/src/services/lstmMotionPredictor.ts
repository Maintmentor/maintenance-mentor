import * as tf from '@tensorflow/tfjs';

export interface MotionSequence {
  positions: Array<{ x: number; y: number; width: number; height: number }>;
  timestamps: number[];
}

export interface LSTMPrediction {
  position: { x: number; y: number; width: number; height: number };
  confidence: number;
  velocity: { vx: number; vy: number };
}

export class LSTMMotionPredictor {
  private model: tf.LayersModel | null = null;
  private sequenceLength: number = 10;
  private inputDim: number = 4; // x, y, width, height
  private isTraining: boolean = false;

  async createModel(): Promise<void> {
    this.model = tf.sequential({
      layers: [
        tf.layers.lstm({
          units: 64,
          returnSequences: true,
          inputShape: [this.sequenceLength, this.inputDim],
        }),
        tf.layers.dropout({ rate: 0.2 }),
        tf.layers.lstm({ units: 32, returnSequences: false }),
        tf.layers.dropout({ rate: 0.2 }),
        tf.layers.dense({ units: 16, activation: 'relu' }),
        tf.layers.dense({ units: this.inputDim, activation: 'linear' }),
      ],
    });

    this.model.compile({
      optimizer: tf.train.adam(0.001),
      loss: 'meanSquaredError',
      metrics: ['mae'],
    });
  }

  async train(sequences: MotionSequence[], epochs: number = 50): Promise<any> {
    if (!this.model) await this.createModel();
    this.isTraining = true;

    const { xs, ys } = this.prepareTrainingData(sequences);
    
    const history = await this.model!.fit(xs, ys, {
      epochs,
      batchSize: 32,
      validationSplit: 0.2,
      callbacks: {
        onEpochEnd: (epoch, logs) => {
          console.log(`Epoch ${epoch}: loss = ${logs?.loss.toFixed(4)}`);
        },
      },
    });

    xs.dispose();
    ys.dispose();
    this.isTraining = false;

    return history.history;
  }

  private prepareTrainingData(sequences: MotionSequence[]): { xs: tf.Tensor; ys: tf.Tensor } {
    const xData: number[][][] = [];
    const yData: number[][] = [];

    for (const seq of sequences) {
      if (seq.positions.length < this.sequenceLength + 1) continue;

      for (let i = 0; i <= seq.positions.length - this.sequenceLength - 1; i++) {
        const inputSeq = seq.positions.slice(i, i + this.sequenceLength);
        const target = seq.positions[i + this.sequenceLength];

        xData.push(inputSeq.map(p => [p.x, p.y, p.width, p.height]));
        yData.push([target.x, target.y, target.width, target.height]);
      }
    }

    return {
      xs: tf.tensor3d(xData),
      ys: tf.tensor2d(yData),
    };
  }

  async predict(sequence: MotionSequence, steps: number = 5): Promise<LSTMPrediction[]> {
    if (!this.model || this.isTraining) {
      throw new Error('Model not ready');
    }

    const predictions: LSTMPrediction[] = [];
    let currentSeq = [...sequence.positions.slice(-this.sequenceLength)];

    for (let i = 0; i < steps; i++) {
      const input = tf.tensor3d([currentSeq.map(p => [p.x, p.y, p.width, p.height])]);
      const pred = this.model.predict(input) as tf.Tensor;
      const predData = await pred.data();
      
      const position = {
        x: predData[0],
        y: predData[1],
        width: predData[2],
        height: predData[3],
      };

      const velocity = this.calculateVelocity(currentSeq[currentSeq.length - 1], position);
      
      predictions.push({
        position,
        confidence: Math.max(0.5, 1 - i * 0.1),
        velocity,
      });

      currentSeq.push(position);
      currentSeq.shift();

      input.dispose();
      pred.dispose();
    }

    return predictions;
  }

  private calculateVelocity(prev: any, curr: any) {
    return {
      vx: curr.x - prev.x,
      vy: curr.y - prev.y,
    };
  }

  async saveModel(): Promise<any> {
    if (!this.model) throw new Error('No model to save');
    
    const saveResult = await this.model.save('indexeddb://lstm-motion-model');
    return {
      modelTopology: this.model.toJSON(null, false),
      weightData: await this.model.getWeights().map(w => w.dataSync()),
    };
  }

  async loadModel(modelData: any): Promise<void> {
    try {
      this.model = await tf.loadLayersModel('indexeddb://lstm-motion-model');
    } catch {
      await this.createModel();
    }
  }

  dispose(): void {
    if (this.model) {
      this.model.dispose();
      this.model = null;
    }
  }
}
