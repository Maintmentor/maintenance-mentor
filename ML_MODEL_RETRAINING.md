# Automated ML Model Retraining System

## Overview
The system automatically retrains the image quality ML model when sufficient user feedback is available, improving accuracy over time through continuous learning.

## Features

### 1. Scheduled Retraining
- **Daily Schedule**: Runs at 2 AM UTC via GitHub Actions
- **Manual Trigger**: Admins can trigger retraining from dashboard
- **Minimum Threshold**: Requires 100+ new feedback entries

### 2. Learning Algorithm
- **Weight Adjustment**: Updates model weights based on feedback
- **Learning Rate**: 0.1 (prevents overfitting)
- **Factors Weighted**:
  - Clarity (image resolution, sharpness)
  - Visibility (product prominence)
  - Background Quality (clean, professional)
  - Relevance (matches search query)

### 3. Safeguards
- **Minimum Quality**: Rejects models with accuracy < 60%
- **Validation**: Compares positive vs negative feedback
- **Version Control**: Increments model version on success
- **Rollback**: Previous model remains if new one fails

### 4. Admin Notifications
- Email alerts sent to all admins on successful retraining
- Includes accuracy improvement metrics
- Shows updated weight distribution

## Database Schema

### ml_model_configs
```sql
- model_name: 'image_quality_scorer'
- version: integer (auto-incremented)
- config: jsonb (contains weights)
- accuracy: float (0-1)
- last_trained_at: timestamp
- training_samples: integer
```

## Edge Function

### ml-model-retrainer
**Endpoint**: `/functions/v1/ml-model-retrainer`

**Process**:
1. Check new feedback count since last training
2. Calculate average scores for positive/negative feedback
3. Adjust weights using learning algorithm
4. Normalize weights to sum to 1.0
5. Validate accuracy threshold
6. Update database with new model
7. Send admin notifications

## GitHub Actions Workflow

**File**: `.github/workflows/ml-model-retraining.yml`

**Schedule**: Daily at 2 AM UTC
**Manual**: Can be triggered from Actions tab

## Admin Dashboard

### ML Model Retraining Tab
Located in Admin Dashboard → Retraining

**Features**:
- View current model version
- See accuracy metrics
- Check new feedback count
- Manual retraining button
- Real-time status updates

## Usage

### Automatic Retraining
1. System collects user feedback (thumbs up/down)
2. When 100+ new ratings accumulated
3. Daily job checks and retrains if threshold met
4. Admins receive email notification

### Manual Retraining
1. Go to Admin Dashboard → Retraining tab
2. Click "Refresh" to check status
3. Click "Start Retraining" if ready
4. Wait for completion toast

## Model Improvement Process

### How It Works
1. **Feedback Collection**: Users rate images with 👍/👎
2. **Score Analysis**: System calculates avg scores for each factor
3. **Weight Adjustment**: Increases weights for discriminative factors
4. **Normalization**: Ensures weights sum to 1.0
5. **Validation**: Checks if new model meets quality threshold
6. **Deployment**: Updates production model if validated

### Example
If positive images have higher clarity scores than negative:
- Clarity weight increases by learning_rate × difference
- Other weights adjusted to maintain sum of 1.0

## Monitoring

### Key Metrics
- **Model Version**: Current version number
- **Accuracy**: % of correctly predicted ratings
- **Training Samples**: Number of feedback entries used
- **New Feedback**: Count since last training
- **Weight Distribution**: Current factor weights

### Success Indicators
- Accuracy trending upward
- Consistent positive user feedback
- Reduced "no images available" reports

## Troubleshooting

### Model Not Retraining
- Check feedback count (need 100+)
- Verify GitHub Actions is enabled
- Check edge function logs

### Low Accuracy
- May need more diverse feedback
- Check for biased ratings
- Review image quality thresholds

### Failed Retraining
- Check edge function logs
- Verify database permissions
- Ensure email service configured

## Best Practices

1. **Monitor Regularly**: Check dashboard weekly
2. **Review Feedback**: Ensure quality ratings
3. **Track Trends**: Watch accuracy over time
4. **Manual Intervention**: Retrain manually if needed
5. **User Education**: Encourage accurate feedback

## Future Enhancements

- A/B testing of model versions
- Multi-model ensemble learning
- Real-time model updates
- Advanced feature extraction
- Cross-validation metrics
