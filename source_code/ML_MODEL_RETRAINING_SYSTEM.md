# ML Model Retraining System

## Overview
Automated ML retraining system that continuously improves translation quality based on user feedback with A/B testing, rollback capabilities, and performance tracking.

## Features

### 1. Automated Retraining
- **Scheduled Jobs**: Weekly retraining runs automatically via GitHub Actions
- **Manual Triggers**: Admins can trigger retraining on-demand
- **Feedback Analysis**: Analyzes approved user corrections and feedback patterns
- **Pattern Recognition**: Identifies common translation issues by language pair

### 2. Model Versioning
- **Version History**: Track all model versions with metadata
- **Status Tracking**: Training → Testing → Active → Deprecated/Rolled Back
- **Performance Metrics**: Accuracy improvement, feedback count, training duration
- **Activation Control**: Admins can activate/deactivate model versions

### 3. A/B Testing
- **Experiment Creation**: Compare two model versions side-by-side
- **Traffic Splitting**: Configurable percentage split (e.g., 50/50, 70/30)
- **Automatic Assignment**: Users randomly assigned to model versions
- **Performance Comparison**: Track metrics for each model variant
- **Winner Selection**: Automatically determine best performing model

### 4. Rollback Capabilities
- **One-Click Rollback**: Instantly revert to previous model version
- **Status Preservation**: Maintains history of rolled-back versions
- **Safety Net**: Quick recovery if new model performs poorly

### 5. Admin Dashboard
- **Retraining Monitor**: View job history and status
- **Version Management**: Activate, deactivate, and rollback models
- **A/B Test Control**: Create and manage experiments
- **Metrics Visualization**: Track accuracy improvements and feedback incorporation

## Database Schema

### translation_model_versions
```sql
- id: UUID (primary key)
- version_number: VARCHAR (unique, e.g., "v1234567890")
- model_type: VARCHAR (e.g., "gpt-4o-mini-finetuned")
- status: VARCHAR (training, testing, active, deprecated, rolled_back)
- is_active: BOOLEAN
- training_feedback_count: INTEGER
- accuracy_improvement: DECIMAL
- trained_at: TIMESTAMPTZ
- performance_metrics: JSONB
```

### translation_ab_tests
```sql
- id: UUID (primary key)
- experiment_name: VARCHAR
- model_a_version: UUID (FK)
- model_b_version: UUID (FK)
- traffic_split: DECIMAL (0.0 to 1.0)
- status: VARCHAR (running, completed, stopped)
- results: JSONB
- winner_version: UUID (FK)
```

### translation_retraining_jobs
```sql
- id: UUID (primary key)
- job_type: VARCHAR (scheduled, manual, triggered)
- status: VARCHAR (pending, running, completed, failed)
- feedback_processed: INTEGER
- corrections_applied: INTEGER
- training_duration_seconds: INTEGER
- results: JSONB
```

## Usage

### Admin Dashboard Access
```typescript
import { MLRetrainingDashboard } from '@/components/admin/MLRetrainingDashboard';
import { MLModelVersionHistory } from '@/components/admin/MLModelVersionHistory';
import { ABTestingDashboard } from '@/components/admin/ABTestingDashboard';

// In admin page
<MLRetrainingDashboard />
<MLModelVersionHistory />
<ABTestingDashboard />
```

### Trigger Manual Retraining
```typescript
import { translationRetrainingService } from '@/services/translationRetrainingService';

const result = await translationRetrainingService.triggerRetraining(userId);
console.log('Job ID:', result.job_id);
```

### Create A/B Test
```typescript
const test = await translationRetrainingService.createABTest({
  experimentName: 'Spanish Translation v2 vs v3',
  modelAVersion: 'model-v2-id',
  modelBVersion: 'model-v3-id',
  trafficSplit: 0.5 // 50/50 split
});
```

### Activate Model Version
```typescript
await translationRetrainingService.activateModel(versionId);
```

### Rollback to Previous Version
```typescript
await translationRetrainingService.rollbackModel(previousVersionId);
```

## Scheduled Retraining

The system runs automatic retraining weekly via GitHub Actions:

**Schedule**: Every Sunday at 2:00 AM UTC

**Workflow**: `.github/workflows/ml-model-retraining.yml`

**Manual Trigger**: Can be triggered from GitHub Actions tab

## Retraining Process

1. **Collect Feedback**: Gather all approved user corrections
2. **Analyze Patterns**: Identify common issues by language pair
3. **Calculate Metrics**: Determine accuracy rates and improvement areas
4. **Create Version**: Generate new model version with updated training data
5. **Test Phase**: New model enters testing status
6. **A/B Test** (Optional): Compare with current active model
7. **Activation**: Admin activates model after validation
8. **Monitor**: Track performance metrics

## Metrics Tracked

- **Translation Accuracy**: Positive feedback rate
- **Feedback Incorporation**: Percentage of corrections applied
- **Model Performance**: Latency, confidence scores
- **User Satisfaction**: Thumbs up/down ratings
- **Language Pair Performance**: Accuracy by language combination

## Notifications

Admins receive notifications for:
- ✅ Retraining job completion
- ❌ Retraining job failures
- 🏆 A/B test winner determination
- ⚠️ Model performance degradation
- 🔄 Rollback events

## Best Practices

1. **Regular Retraining**: Weekly schedule ensures continuous improvement
2. **A/B Testing**: Always test new models before full deployment
3. **Monitor Metrics**: Watch for performance degradation
4. **Quick Rollback**: Don't hesitate to rollback if issues arise
5. **Feedback Review**: Regularly review user corrections for quality
6. **Version Notes**: Document changes in each model version

## API Endpoints

### Trigger Retraining
```bash
POST /functions/v1/translation-model-retrainer
Body: { "jobType": "manual", "triggeredBy": "user-id" }
```

### A/B Test Assignment
```bash
POST /functions/v1/translation-ab-test-manager
Body: { "action": "assign", "userId": "user-id", "sessionId": "session-id" }
```

### Complete A/B Test
```bash
POST /functions/v1/translation-ab-test-manager
Body: { "action": "evaluate", "experimentId": "experiment-id" }
```

## Troubleshooting

### Retraining Job Fails
- Check if sufficient feedback data exists (minimum 10 corrections)
- Verify OpenAI API key is valid
- Review error message in job record

### Model Not Activating
- Ensure model status is 'testing' or 'active'
- Check for existing active model conflicts
- Verify user has admin permissions

### A/B Test Not Assigning
- Confirm test status is 'running'
- Check traffic split configuration
- Verify both model versions exist

## Future Enhancements

- [ ] Multi-model ensemble predictions
- [ ] Automatic rollback on performance degradation
- [ ] Real-time model performance monitoring
- [ ] Custom training data selection
- [ ] Language-specific model variants
- [ ] Confidence threshold tuning
