# LSTM Neural Network Motion Prediction System

## Overview
Advanced motion prediction system using LSTM neural networks as an alternative to Kalman filters for complex, non-linear object motion patterns in video analysis.

## Features Implemented

### 1. LSTM Motion Predictor (`lstmMotionPredictor.ts`)
- **TensorFlow.js Integration**: Full LSTM model implementation
- **Model Architecture**:
  - 2 LSTM layers (64 and 32 units)
  - Dropout layers (20%) for regularization
  - Dense layers for output prediction
  - Predicts 4D position: x, y, width, height
- **Training Capabilities**:
  - Trains on historical tracking sequences
  - 50 epochs with 20% validation split
  - Adam optimizer with MSE loss
  - Real-time training progress logging
- **Prediction**:
  - Multi-step ahead predictions (default 5 frames)
  - Confidence decay over prediction horizon
  - Velocity calculation between frames
- **Model Persistence**:
  - Save/load models to IndexedDB
  - Export model topology and weights

### 2. Advanced Predictive Tracker (`advancedPredictiveTracking.ts`)
- **Dual Method Support**:
  - Kalman Filter: Fast, simple linear motion
  - LSTM: Complex, non-linear patterns
- **Dynamic Method Selection**: Switch between methods per object class
- **Training Pipeline**:
  - Fetch historical tracking data from database
  - Group by track_id for sequence creation
  - Minimum 10 sequences required for training
  - Per-object-class model training
- **Model Management**:
  - Save trained models to database
  - Load existing models for object classes
  - Track training metrics and sample counts
- **Prediction Interface**:
  - Unified API for both methods
  - Confidence scoring for predictions
  - Velocity and acceleration estimates

### 3. Model Selection UI (`ModelSelectionPanel.tsx`)
- **Method Selection**:
  - Radio group for Kalman vs LSTM choice
  - Visual indicators (⚡ Fast vs 🧠 Accurate)
  - Real-time method switching
- **Model Management**:
  - Display trained models by object class
  - Show training sample counts
  - Visual status indicators
- **Training Interface**:
  - List detected object classes
  - Train/Retrain buttons per class
  - Real-time progress bar during training
  - Training metrics display
- **User Feedback**:
  - Success/error toasts
  - Final loss display after training
  - Insufficient data warnings

### 4. Database Schema

#### `lstm_models` Table
```sql
- id: UUID primary key
- user_id: UUID (foreign key to auth.users)
- object_class: TEXT (e.g., 'wrench', 'phone')
- model_name: TEXT
- model_data: JSONB (model topology and weights)
- training_metrics: JSONB (loss, accuracy history)
- training_samples: INTEGER
- trained_at: TIMESTAMP
- last_used_at: TIMESTAMP
- is_active: BOOLEAN
```

#### `prediction_method_preferences` Table
```sql
- id: UUID primary key
- user_id: UUID (unique, foreign key)
- default_method: TEXT ('kalman' or 'lstm')
- object_class_methods: JSONB (per-class preferences)
```

### 5. Video Analysis Integration
- Added "Predictions" tab with model selection
- Method selection persists across sessions
- Seamless switching between prediction methods
- Training initiated directly from analysis interface

## Usage

### Training an LSTM Model
1. Upload and analyze a video with object tracking
2. Navigate to "Predictions" tab
3. Select "LSTM Neural Network" method
4. Click "Train" for desired object class
5. Wait for training to complete (~30-60 seconds)
6. Model automatically saved and activated

### Using LSTM Predictions
1. Select "LSTM Neural Network" in Model Selection Panel
2. Predictions automatically use trained model for object class
3. If no model exists, falls back to Kalman filter
4. View predictions in Predictive Tracking Panel

### Method Comparison

| Feature | Kalman Filter | LSTM Network |
|---------|--------------|--------------|
| Speed | Very Fast | Moderate |
| Accuracy (Linear) | High | High |
| Accuracy (Non-linear) | Low | Very High |
| Training Required | No | Yes |
| Memory Usage | Low | Moderate |
| Best For | Simple motion | Complex patterns |

## Technical Details

### LSTM Model Specifications
- **Input Shape**: [sequence_length, 4] (default 10 frames)
- **Output**: [4] (x, y, width, height)
- **Training Data**: Sequences of 10+ consecutive frames
- **Batch Size**: 32
- **Learning Rate**: 0.001
- **Loss Function**: Mean Squared Error

### Prediction Confidence
- **Kalman**: Decreases 15% per prediction step
- **LSTM**: Decreases 10% per prediction step
- **Minimum Confidence**: 0.3 (Kalman), 0.5 (LSTM)

### Training Requirements
- Minimum 10 tracking sequences per object class
- Each sequence must have 10+ consecutive frames
- Automatically filters short sequences
- Groups by track_id for proper sequence formation

## Future Enhancements
1. **Hybrid Approach**: Combine Kalman and LSTM predictions
2. **Attention Mechanism**: Add attention layers for better long-term predictions
3. **Transfer Learning**: Pre-train on large datasets
4. **Real-time Training**: Continuous model updates during tracking
5. **Multi-object LSTM**: Single model for all object classes
6. **Ensemble Methods**: Combine multiple models for better accuracy

## Performance Optimization
- Models cached in IndexedDB for fast loading
- Lazy loading of TensorFlow.js
- Batch predictions for multiple objects
- GPU acceleration when available
- Model quantization for smaller size

## Error Handling
- Graceful fallback to Kalman if LSTM fails
- Insufficient data warnings
- Model loading error recovery
- Training timeout protection
- Memory cleanup after predictions

## Dependencies
- `@tensorflow/tfjs`: ^4.17.0 (already installed)
- TensorFlow.js automatically uses WebGL for GPU acceleration

## Files Modified/Created
1. ✅ `src/services/lstmMotionPredictor.ts` - LSTM model implementation
2. ✅ `src/services/advancedPredictiveTracking.ts` - Unified tracking service
3. ✅ `src/components/video-analysis/ModelSelectionPanel.tsx` - UI component
4. ✅ `src/pages/VideoAnalysis.tsx` - Integrated model selection
5. ✅ Database migrations for model storage
6. ✅ `ML_ADVANCED_FORECASTING.md` - This documentation

## Testing
Test the LSTM system by:
1. Uploading a video with complex object motion (e.g., curved paths)
2. Training an LSTM model for the detected object class
3. Comparing predictions between Kalman and LSTM methods
4. Observing improved accuracy for non-linear motion with LSTM
