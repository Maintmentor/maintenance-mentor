# Predictive Object Tracking System

## Overview
Advanced object tracking system using Kalman filters for position prediction, occlusion handling, trajectory smoothing, and early warning generation.

## Features

### 1. Kalman Filter Implementation
- **State Vector**: [x, y, velocity_x, velocity_y]
- **Prediction**: Estimates future positions based on motion model
- **Update**: Corrects predictions with actual measurements
- **Smoothing**: Reduces noise in trajectory data

### 2. Predictive Capabilities
- **Future Position Prediction**: Predicts next 10 frames
- **Confidence Decay**: Confidence decreases with prediction distance
- **Velocity Estimation**: Calculates object velocity in x and y directions
- **Acceleration Tracking**: Monitors changes in velocity

### 3. Occlusion Handling
- Maintains tracking during temporary object disappearance
- Predicts positions during occlusion periods
- Confidence decreases during occlusion
- Re-associates objects when they reappear

### 4. Warning System
- **Exit Frame Warning**: Alerts when object predicted to leave frame
- **Dangerous Area Warning**: Detects entry into predefined danger zones
- **Rapid Movement Warning**: Flags unusually fast object motion
- **Severity Levels**: Low, Medium, High

## Database Schema

### video_object_predictions
```sql
- id: UUID (primary key)
- track_id: UUID (foreign key to video_object_tracks)
- analysis_id: UUID (foreign key to video_analyses)
- predicted_frame: INTEGER
- predicted_x: FLOAT
- predicted_y: FLOAT
- predicted_width: FLOAT
- predicted_height: FLOAT
- confidence: FLOAT
- velocity_x: FLOAT
- velocity_y: FLOAT
- acceleration_x: FLOAT
- acceleration_y: FLOAT
- created_at: TIMESTAMP
```

### video_tracking_warnings
```sql
- id: UUID (primary key)
- track_id: UUID (foreign key to video_object_tracks)
- analysis_id: UUID (foreign key to video_analyses)
- warning_type: TEXT (exit_frame, dangerous_area, rapid_movement, occlusion)
- frame_number: INTEGER
- severity: TEXT (low, medium, high)
- message: TEXT
- metadata: JSONB
- created_at: TIMESTAMP
```

## Usage

### Automatic Integration
Predictive tracking runs automatically after object tracking:
1. Video frames are analyzed for objects
2. Objects are tracked across frames (IoU matching)
3. Kalman filter applied to each track
4. Predictions generated for next 10 frames
5. Warnings generated based on predictions
6. Results stored in database

### API Functions

```typescript
// Create predictor
const predictor = new PredictiveTracker(
  initialX,
  initialY,
  frameWidth,
  frameHeight,
  dangerZones
);

// Predict future positions
const predictions = predictor.predictFuturePositions(detections, 10);

// Handle occlusion
const occlusionPredictions = predictor.handleOcclusion(lastDetection, 5);

// Smooth trajectory
const smoothed = predictor.smoothTrajectory(detections);

// Generate warnings
const warnings = predictor.generateWarnings(predictions);

// Save to database
await savePredictions(trackId, analysisId, predictions);
await saveWarnings(trackId, analysisId, warnings);
```

## UI Components

### PredictiveTrackingPanel
- Displays tracking warnings with severity badges
- Shows predicted positions with confidence levels
- Motion statistics (average velocity, max speed)
- Expandable predictions list

### Features
- Color-coded severity indicators
- Frame-by-frame prediction details
- Velocity and acceleration display
- Warning type icons

## Kalman Filter Mathematics

### Prediction Step
```
x_pred = F * x
P_pred = F * P * F^T + Q
```

### Update Step
```
y = z - H * x (innovation)
S = H * P * H^T + R (innovation covariance)
K = P * H^T * S^-1 (Kalman gain)
x_new = x + K * y
P_new = (I - K * H) * P
```

Where:
- F: State transition matrix
- P: Covariance matrix
- Q: Process noise
- R: Measurement noise
- H: Measurement matrix
- K: Kalman gain

## Configuration

### Prediction Parameters
- **Frames to Predict**: 10 (configurable)
- **Confidence Decay**: 5% per frame
- **Minimum Confidence**: 30%

### Warning Thresholds
- **Rapid Movement**: Speed > 50 px/frame
- **Frame Exit**: Object bbox outside frame bounds
- **Danger Zone**: Overlap with predefined zones

## Performance

### Computational Complexity
- Kalman Filter: O(n) per frame
- Prediction: O(k) where k = frames to predict
- Warning Generation: O(k * z) where z = danger zones

### Optimization
- Matrix operations optimized for 4x4 matrices
- Predictions cached in database
- Warnings generated only for significant events

## Future Enhancements
- LSTM network integration for complex motion patterns
- Multi-object interaction prediction
- Adaptive danger zone learning
- Real-time prediction visualization overlay
- Custom warning rule configuration
