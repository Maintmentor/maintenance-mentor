# TensorFlow.js Object Detection System

## Overview
Real-time object detection using TensorFlow.js and COCO-SSD model for product identification and image quality verification in the chat interface.

## Features

### 1. Real Object Detection
- **TensorFlow.js COCO-SSD Model**: Pre-trained on 80+ object classes
- **Client-Side Processing**: No server calls, instant detection
- **Confidence Scoring**: Each detected object has a confidence score (0-1)
- **Bounding Box Visualization**: Visual overlay showing detected objects

### 2. Object Classes Detected
The COCO-SSD model can detect 80+ objects including:
- **Household Items**: sink, toilet, refrigerator, oven, microwave, toaster
- **Furniture**: chair, couch, bed, dining table
- **Electronics**: tv, laptop, mouse, keyboard, cell phone
- **Tools & Parts**: bottle, cup, fork, knife, spoon, bowl
- **Accessories**: clock, vase, scissors, hair drier, toothbrush

### 3. Integration Points

#### A. Object Detection Service (`objectDetectionService.ts`)
```typescript
// Load model once, reuse across app
await objectDetectionService.loadModel();

// Detect objects in image
const result = await objectDetectionService.detectObjects(imageElement);
// Returns: objects[], totalObjects, averageConfidence, highConfidenceCount, productRelevance
```

#### B. Advanced ML Service (`advancedMLService.ts`)
- Integrates real object detection into image quality scoring
- Calculates centeredness based on detected object positions
- Uses confidence scores for quality assessment
- Replaces simulated detection with real TensorFlow.js predictions

#### C. Visualization Component (`ObjectDetectionOverlay.tsx`)
- Displays image with bounding boxes
- Color-coded boxes: Green (>70% confidence), Orange (<70%)
- Shows object class and confidence percentage
- Lists all detected objects with badges

#### D. Chat Interface Integration
- "Detect Objects" button on every part image
- Modal dialog showing detection results
- Real-time analysis when images are displayed
- Helps users verify product identification accuracy

## Technical Implementation

### Model Loading
```typescript
// Lazy loading - only loads when first needed
const model = await cocoSsd.load();
// Model cached in memory for subsequent detections
```

### Detection Process
1. Load image into HTMLImageElement
2. Pass to TensorFlow.js COCO-SSD model
3. Model returns predictions with bounding boxes
4. Calculate metrics: confidence, centeredness, relevance
5. Draw bounding boxes on canvas overlay
6. Display results to user

### Performance Optimization
- **Model Caching**: Load once, reuse for all detections
- **Client-Side**: No network latency
- **Async Loading**: Non-blocking UI
- **Canvas Rendering**: Efficient visualization

## Usage Examples

### In Chat Interface
1. User receives part image in chat
2. Clicks "Detect Objects" button
3. Modal opens showing:
   - Original image with bounding boxes
   - List of detected objects with confidence scores
   - Color-coded visualization

### In Image Quality Feedback
1. User provides feedback on image quality
2. System automatically runs object detection
3. Detection results stored with feedback
4. ML model learns from detection + user feedback

### In Advanced ML Analysis
1. Image analyzed for quality scoring
2. Object detection provides:
   - Confidence scores (how certain the detection is)
   - Centeredness (is object centered in frame?)
   - Product relevance (is it a relevant household item?)
3. Scores combined with edge detection, color analysis, EXIF data

## Benefits

### For Users
- **Visual Verification**: See what objects AI detected
- **Confidence Transparency**: Know how certain the AI is
- **Better Feedback**: Understand why certain images were chosen

### For ML System
- **Real Detection Data**: Actual object detection vs simulation
- **Improved Accuracy**: Learn from real TensorFlow.js predictions
- **Better Image Selection**: Choose images with high-confidence detections

### For Developers
- **No Server Costs**: Client-side processing
- **Fast Performance**: Instant detection
- **Easy Integration**: Simple API, works with any image
- **Proven Model**: COCO-SSD is well-tested and accurate

## Model Accuracy

### COCO-SSD Performance
- **80+ Object Classes**: Comprehensive coverage
- **High Accuracy**: 70%+ confidence for clear objects
- **Fast Inference**: ~100-300ms per image
- **Robust**: Works with various image qualities

### Confidence Thresholds
- **>0.7 (70%)**: High confidence - Green boxes
- **0.5-0.7**: Medium confidence - Orange boxes
- **<0.5**: Low confidence - Not displayed by default

## Future Enhancements

1. **Custom Model Training**: Train on specific repair parts
2. **Multi-Model Ensemble**: Combine COCO-SSD with custom models
3. **Real-Time Video Detection**: Detect objects in uploaded videos
4. **Part Classification**: Identify specific part models/brands
5. **Damage Detection**: Detect visible damage or wear
6. **Size Estimation**: Estimate object dimensions from image

## Dependencies

```json
{
  "@tensorflow/tfjs": "^4.17.0",
  "@tensorflow-models/coco-ssd": "^2.2.3"
}
```

## Files Modified/Created

### New Files
- `src/services/objectDetectionService.ts` - Core detection service
- `src/components/chat/ObjectDetectionOverlay.tsx` - Visualization component

### Modified Files
- `package.json` - Added COCO-SSD dependency
- `src/services/advancedMLService.ts` - Integrated real detection
- `src/components/chat/ImageQualityFeedback.tsx` - Added detection button
- `src/components/chat/EnhancedChatInterface.tsx` - Added detection to part images

## Status
✅ TensorFlow.js and COCO-SSD installed
✅ Object detection service implemented
✅ Visualization component created
✅ Integrated into chat interface
✅ Integrated into image quality feedback
✅ Advanced ML service updated with real detection
✅ Documentation complete

## Testing

### Test Object Detection
1. Go to chat interface
2. Ask about a repair (e.g., "my toilet is running")
3. When part images appear, click "Detect Objects"
4. Verify bounding boxes and confidence scores appear
5. Check that detected objects match image content

### Test ML Integration
1. Provide image quality feedback
2. Check console for detection results
3. Verify detection data saved to database
4. Confirm ML model uses real detection scores

## Support
For issues or questions about object detection:
- Check browser console for TensorFlow.js errors
- Verify CORS is enabled for image URLs
- Ensure sufficient memory for model loading
- Test with clear, well-lit product images for best results
