/**
 * Kalman Filter implementation for object tracking
 * Predicts future positions and smooths trajectories
 */

export interface KalmanState {
  // State vector: [x, y, vx, vy]
  x: number[];
  // Covariance matrix (4x4)
  P: number[][];
  // Process noise
  Q: number[][];
  // Measurement noise
  R: number[][];
  // State transition matrix
  F: number[][];
  // Measurement matrix
  H: number[][];
}

export class KalmanFilter {
  private state: KalmanState;
  private dt: number; // Time step

  constructor(initialX: number, initialY: number, dt: number = 1) {
    this.dt = dt;
    
    // Initialize state: [x, y, vx, vy]
    this.state = {
      x: [initialX, initialY, 0, 0],
      
      // Initial covariance (high uncertainty)
      P: [
        [1000, 0, 0, 0],
        [0, 1000, 0, 0],
        [0, 0, 1000, 0],
        [0, 0, 0, 1000]
      ],
      
      // Process noise
      Q: [
        [0.1, 0, 0, 0],
        [0, 0.1, 0, 0],
        [0, 0, 0.1, 0],
        [0, 0, 0, 0.1]
      ],
      
      // Measurement noise
      R: [
        [10, 0],
        [0, 10]
      ],
      
      // State transition matrix
      F: [
        [1, 0, dt, 0],
        [0, 1, 0, dt],
        [0, 0, 1, 0],
        [0, 0, 0, 1]
      ],
      
      // Measurement matrix (we only measure x, y)
      H: [
        [1, 0, 0, 0],
        [0, 1, 0, 0]
      ]
    };
  }

  // Predict next state
  predict(): { x: number; y: number; vx: number; vy: number } {
    // x = F * x
    const newX = this.matrixVectorMultiply(this.state.F, this.state.x);
    
    // P = F * P * F^T + Q
    const FP = this.matrixMultiply(this.state.F, this.state.P);
    const FPFt = this.matrixMultiply(FP, this.transpose(this.state.F));
    const newP = this.matrixAdd(FPFt, this.state.Q);
    
    this.state.x = newX;
    this.state.P = newP;
    
    return {
      x: this.state.x[0],
      y: this.state.x[1],
      vx: this.state.x[2],
      vy: this.state.x[3]
    };
  }

  // Update with measurement
  update(measuredX: number, measuredY: number): void {
    const z = [measuredX, measuredY];
    
    // y = z - H * x (innovation)
    const Hx = this.matrixVectorMultiply(this.state.H, this.state.x);
    const y = [z[0] - Hx[0], z[1] - Hx[1]];
    
    // S = H * P * H^T + R (innovation covariance)
    const HP = this.matrixMultiply(this.state.H, this.state.P);
    const HPHt = this.matrixMultiply(HP, this.transpose(this.state.H));
    const S = this.matrixAdd(HPHt, this.state.R);
    
    // K = P * H^T * S^-1 (Kalman gain)
    const PHt = this.matrixMultiply(this.state.P, this.transpose(this.state.H));
    const Sinv = this.matrixInverse2x2(S);
    const K = this.matrixMultiply(PHt, Sinv);
    
    // x = x + K * y
    const Ky = this.matrixVectorMultiply(K, y);
    this.state.x = this.state.x.map((val, i) => val + Ky[i]);
    
    // P = (I - K * H) * P
    const KH = this.matrixMultiply(K, this.state.H);
    const I = this.identity(4);
    const IminusKH = this.matrixSubtract(I, KH);
    this.state.P = this.matrixMultiply(IminusKH, this.state.P);
  }

  getState() {
    return {
      x: this.state.x[0],
      y: this.state.x[1],
      vx: this.state.x[2],
      vy: this.state.x[3]
    };
  }

  // Matrix operations
  private matrixMultiply(A: number[][], B: number[][]): number[][] {
    const result: number[][] = [];
    for (let i = 0; i < A.length; i++) {
      result[i] = [];
      for (let j = 0; j < B[0].length; j++) {
        let sum = 0;
        for (let k = 0; k < A[0].length; k++) {
          sum += A[i][k] * B[k][j];
        }
        result[i][j] = sum;
      }
    }
    return result;
  }

  private matrixVectorMultiply(A: number[][], v: number[]): number[] {
    return A.map(row => row.reduce((sum, val, i) => sum + val * v[i], 0));
  }

  private matrixAdd(A: number[][], B: number[][]): number[][] {
    return A.map((row, i) => row.map((val, j) => val + B[i][j]));
  }

  private matrixSubtract(A: number[][], B: number[][]): number[][] {
    return A.map((row, i) => row.map((val, j) => val - B[i][j]));
  }

  private transpose(A: number[][]): number[][] {
    return A[0].map((_, i) => A.map(row => row[i]));
  }

  private identity(n: number): number[][] {
    return Array(n).fill(0).map((_, i) => 
      Array(n).fill(0).map((_, j) => i === j ? 1 : 0)
    );
  }

  private matrixInverse2x2(A: number[][]): number[][] {
    const det = A[0][0] * A[1][1] - A[0][1] * A[1][0];
    return [
      [A[1][1] / det, -A[0][1] / det],
      [-A[1][0] / det, A[0][0] / det]
    ];
  }
}
