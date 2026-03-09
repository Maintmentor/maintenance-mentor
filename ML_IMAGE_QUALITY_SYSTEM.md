# ML-Based Image Quality Verification System

## Overview
Enhanced the image quality verification system with machine learning capabilities that learn from user feedback to continuously improve image selection accuracy.

## Features Implemented

### 1. **ML Scoring Service** (`src/services/mlImageScoringService.ts`)
- **Multi-factor scoring system** weighing:
  - Clarity (25%): Image resolution, size, quality indicators
  - Product Visibility (30%): Product prominence, background type
  - Background Quality (20%): Clean backgrounds, transparency
  - Relevance (25%): URL matching, search term alignment
  
- **Historical learning**: Incorporates past user feedback to adjust predictions
- **Adaptive weights**: Model adjusts scoring weights based on feedback patterns
- **Training capability**: `trainFromFeedback()` method learns from user ratings

### 2. **Enhanced Edge Function** (`fetch-real-part-images`)
- Integrated ML scoring into image selection pipeline
- Scores each candidate image across multiple quality dimensions
- Selects best image based on combined ML score
- Returns quality metrics with each image for transparency

### 3. **User Feedback Collection**
- **Thumbs up/down buttons** on every product image in chat
- **Feedback stored** with ML scores for training data
- **Real-time feedback** submission with user notifications
- **Quality metrics tracking**: Clarity, visibility, background, relevance scores

### 4. **ML Image Quality Dashboard** (`src/components/analytics/MLImageQualityDashboard.tsx`)
Comprehensive admin dashboard showing:
- **Total feedback count** and positive rate
- **ML accuracy metrics** with improvement indicators
- **Quality score breakdowns** (clarity, visibility, background, relevance)
- **Recent feedback** with visual indicators
- **Quality trends chart** showing improvement over time
- **Manual model training** button for admins

### 5. **Image Quality Trends Chart** (`src/components/analytics/ImageQualityTrendsChart.tsx`)
- 7-day rolling trends of image quality
- Visual trend indicators (up/down/stable)
- Positive rate tracking over time
- Average ML scores per day

### 6. **Image Enhancement Service** (`src/services/imageEnhancementService.ts`)
Framework for future enhancements:
- Auto-cropping to product
- Background removal
- Clarity enhancement
- Batch processing capabilities

## Database Schema

Added ML scoring columns to `image_quality_feedback` table:
```sql
- clarity_score (DECIMAL 0-1)
- visibility_score (DECIMAL 0-1)
- background_score (DECIMAL 0-1)
- relevance_score (DECIMAL 0-1)
- ml_prediction_score (DECIMAL 0-1)
- enhanced_image_url (TEXT)
```

## How It Works

### Image Selection Flow:
1. **Search**: System finds candidate images via Google Images API
2. **ML Scoring**: Each image scored on 4 quality dimensions
3. **AI Verification**: OpenAI Vision validates product match
4. **Combined Score**: ML metrics + AI verification = final score
5. **Best Selection**: Highest scoring image returned to user
6. **User Feedback**: User rates image quality (thumbs up/down)
7. **Learning**: Feedback stored with scores for model training

### Continuous Improvement:
- User feedback accumulates in database
- Admin triggers model training via dashboard
- Model adjusts weights based on positive/negative patterns
- Future predictions improve based on learned preferences
- Metrics tracked to measure improvement over time

## Admin Access

Navigate to: **Admin Dashboard → ML Images Tab**

Features available:
- View total feedback and positive rates
- Monitor quality metrics across all dimensions
- See recent user feedback
- Track quality trends over time
- Manually trigger model training
- Review ML accuracy improvements

## Key Benefits

1. **Automatic Quality Assessment**: No manual image curation needed
2. **Continuous Learning**: System improves with every user interaction
3. **Transparent Scoring**: Users see why images were selected
4. **Data-Driven**: Decisions based on multiple quality factors
5. **Scalable**: Handles thousands of images efficiently
6. **Measurable**: Clear metrics show improvement over time

## Future Enhancements

- Automatic image cropping to highlight products
- Background removal for cleaner presentation
- Image enhancement (brightness, contrast, sharpness)
- A/B testing different scoring weights
- Deep learning models for visual quality assessment
- Automated retraining on schedule
- Quality alerts for low-scoring images

## Testing

1. Use the AI assistant to ask repair questions
2. View product images returned
3. Rate images with thumbs up/down
4. Check Admin → ML Images to see metrics
5. Click "Train Model" to update weights
6. Observe improved image quality over time

## Metrics to Monitor

- **Positive Rate**: Target >80%
- **ML Accuracy**: Target >85%
- **Clarity Score**: Target >70%
- **Visibility Score**: Target >75%
- **Background Quality**: Target >70%
- **Relevance Score**: Target >80%

The system is now live and learning from every user interaction!
