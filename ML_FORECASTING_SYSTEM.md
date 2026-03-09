# ML-Based Alert Performance Forecasting System

## Overview

This system uses machine learning to predict when alert performance goals are likely to be missed before they actually fail. It provides proactive warnings 24-48 hours in advance with confidence scores and recommended preventive actions.

## Features

### 1. Predictive Analytics
- **Time Series Forecasting**: Analyzes historical performance data to predict future trends
- **Confidence Scores**: Each prediction includes a confidence level (0-100%)
- **Multi-Metric Support**: Forecasts for response time, false positive rate, and uptime percentage

### 2. Anomaly Detection
- **Pattern Recognition**: Identifies unusual spikes, drops, or pattern breaks
- **Severity Classification**: Categorizes anomalies as low, medium, or high severity
- **Real-Time Alerts**: Immediate notification of detected anomalies

### 3. Proactive Warnings
- **24-48 Hour Advance Notice**: Warnings sent before predicted goal misses
- **Actionable Recommendations**: Specific steps to prevent goal failures
- **Email Notifications**: Automated emails to admin team with detailed insights

### 4. Trend Analysis
- **Forecast Horizons**: 24, 48, and 72-hour predictions
- **Risk Levels**: Low, medium, high, and critical risk classifications
- **Trend Direction**: Improving, declining, or stable trends

## Database Schema

### ml_predictions
Stores ML-generated predictions for alert performance:
```sql
- id: UUID (primary key)
- user_id: UUID (references auth.users)
- goal_type: TEXT (response_time, false_positive_rate, uptime_percentage)
- prediction_date: TIMESTAMPTZ
- predicted_value: NUMERIC
- confidence_score: NUMERIC (0-1)
- goal_threshold: NUMERIC
- will_miss_goal: BOOLEAN
- hours_until_miss: INTEGER
- recommended_actions: JSONB (array of strings)
- historical_data_points: INTEGER
- model_version: TEXT
```

### alert_forecast_trends
Time series forecast data:
```sql
- id: UUID (primary key)
- user_id: UUID
- goal_type: TEXT
- forecast_horizon_hours: INTEGER (24, 48, 72)
- forecast_data: JSONB (array of {timestamp, predicted_value, confidence})
- trend_direction: TEXT (improving, declining, stable)
- risk_level: TEXT (low, medium, high, critical)
```

### alert_anomalies
Detected anomalies in performance metrics:
```sql
- id: UUID (primary key)
- user_id: UUID
- goal_type: TEXT
- anomaly_type: TEXT (spike, drop, pattern_break)
- detected_at: TIMESTAMPTZ
- severity: TEXT (low, medium, high)
- anomaly_score: NUMERIC
- context: JSONB
```

### alert_proactive_warnings
Proactive warnings sent to admins:
```sql
- id: UUID (primary key)
- user_id: UUID
- prediction_id: UUID (references ml_predictions)
- goal_type: TEXT
- warning_sent_at: TIMESTAMPTZ
- hours_before_predicted_miss: INTEGER
- confidence_score: NUMERIC
- email_sent: BOOLEAN
- email_sent_at: TIMESTAMPTZ
- preventive_actions: JSONB
- was_accurate: BOOLEAN
- actual_outcome: TEXT
```

## ML Analytics Service

### Methods

#### generatePredictions(userId: string)
Generates predictions for all goal types based on historical data.

```typescript
const predictions = await mlAnalyticsService.generatePredictions(userId);
```

#### getPredictions(userId: string, goalType?: string)
Retrieves recent predictions, optionally filtered by goal type.

```typescript
const predictions = await mlAnalyticsService.getPredictions(userId, 'response_time');
```

#### getForecastTrends(userId: string, hours: number)
Gets forecast trends for specified time horizon.

```typescript
const trends = await mlAnalyticsService.getForecastTrends(userId, 48);
```

#### detectAnomalies(userId: string)
Detects anomalies in current performance metrics.

```typescript
const anomalies = await mlAnalyticsService.detectAnomalies(userId);
```

#### checkAndSendProactiveWarnings(userId: string)
Checks predictions and sends warnings for upcoming goal misses.

```typescript
await mlAnalyticsService.checkAndSendProactiveWarnings(userId);
```

## Edge Function: ml-analytics-processor

### Actions

#### generate_predictions
Analyzes historical data and generates predictions for all goal types.

**Request:**
```json
{
  "userId": "user-uuid",
  "action": "generate_predictions"
}
```

**Response:**
```json
{
  "predictions": [
    {
      "goal_type": "response_time",
      "prediction_date": "2025-10-12T21:23:00Z",
      "predicted_value": 210,
      "confidence_score": 0.85,
      "will_miss_goal": true,
      "hours_until_miss": 48,
      "recommended_actions": [
        "Scale up server resources",
        "Optimize database queries"
      ]
    }
  ]
}
```

#### detect_anomalies
Identifies anomalies in recent performance data.

**Request:**
```json
{
  "userId": "user-uuid",
  "action": "detect_anomalies"
}
```

## Email Notifications

### Proactive Warning Email
Sent 24-48 hours before predicted goal miss.

**Includes:**
- Goal type and current status
- Predicted value vs threshold
- Confidence score
- Hours until predicted miss
- Trend direction and risk level
- Preventive actions
- Forecast chart data

### Template Data:
```typescript
{
  goalType: 'response_time',
  goalTypeLabel: 'Response Time',
  hoursUntilMiss: 36,
  predictedValue: 210,
  goalThreshold: 200,
  confidenceScore: '85.0',
  preventiveActions: ['Scale up resources', 'Optimize queries'],
  trendDirection: 'declining',
  riskLevel: 'high',
  forecastData: [...]
}
```

## UI Components

### PredictiveInsightsWidget
Displays upcoming predicted goal misses with confidence scores and recommendations.

**Features:**
- Color-coded risk levels
- Countdown to predicted miss
- Recommended actions
- Confidence badges

### AnomalyDetectionWidget
Shows detected anomalies in performance metrics.

**Features:**
- Anomaly type icons (spike, drop, pattern break)
- Severity badges
- Detection timestamps
- Anomaly scores

### Integration in Dashboard
Both widgets are integrated into the Image Quality Dashboard alerts tab:

```tsx
<TabsContent value="alerts">
  <div className="grid gap-6 md:grid-cols-2">
    <PredictiveInsightsWidget userId={user.id} />
    <AnomalyDetectionWidget userId={user.id} />
  </div>
</TabsContent>
```

## Automated Workflows

### GitHub Actions: ml-predictions.yml
Runs every 6 hours to:
1. Generate ML predictions
2. Check and send proactive warnings
3. Detect anomalies

**Schedule:** `0 */6 * * *` (every 6 hours)

**Manual Trigger:** Available via workflow_dispatch

## ML Algorithm

### Linear Regression Forecasting
Simple but effective approach for time series prediction:

1. **Data Collection**: Gather historical performance metrics
2. **Trend Calculation**: Calculate rate of change over time
3. **Prediction**: Project trend 24-48 hours into future
4. **Confidence**: Based on data consistency (lower variance = higher confidence)
5. **Threshold Comparison**: Check if prediction exceeds goal threshold

### Anomaly Detection
Z-score based approach:

1. **Calculate Mean & Standard Deviation**: From historical data
2. **Z-Score Calculation**: `|value - mean| / stdDev`
3. **Threshold**: Z-score > 2 indicates anomaly
4. **Severity**: Z-score > 3 = high severity

## Best Practices

### 1. Data Requirements
- Minimum 5 historical data points for predictions
- Minimum 10 data points for anomaly detection
- Regular data collection (hourly recommended)

### 2. Confidence Thresholds
- **High Confidence (>80%)**: Take immediate action
- **Medium Confidence (60-80%)**: Monitor closely
- **Low Confidence (<60%)**: Informational only

### 3. Action Prioritization
1. Address high-confidence predictions first
2. Focus on declining trends
3. Implement preventive actions before reactive fixes

### 4. Model Improvement
- Track prediction accuracy (was_accurate field)
- Adjust thresholds based on false positive/negative rates
- Increase historical data window for better predictions

## Troubleshooting

### No Predictions Generated
- Check if sufficient historical data exists
- Verify edge function is running correctly
- Check database permissions

### Inaccurate Predictions
- Increase historical data window
- Adjust confidence thresholds
- Review and update ML algorithm parameters

### Missing Email Notifications
- Verify email service configuration
- Check proactive_warnings table for sent status
- Review GitHub Actions workflow logs

### High False Positive Rate
- Increase confidence threshold for warnings
- Adjust anomaly detection sensitivity
- Review goal thresholds for realism

## Future Enhancements

1. **Advanced ML Models**
   - ARIMA for time series forecasting
   - Neural networks for pattern recognition
   - Ensemble methods for improved accuracy

2. **Multi-Variable Analysis**
   - Correlation between different metrics
   - External factor integration (time of day, day of week)
   - Seasonal pattern detection

3. **Adaptive Learning**
   - Automatic model retraining
   - Feedback loop integration
   - Self-adjusting thresholds

4. **Enhanced Visualizations**
   - Interactive forecast charts
   - Prediction accuracy tracking
   - Historical prediction vs actual comparison

## Support

For issues or questions:
1. Check this documentation
2. Review edge function logs in Supabase
3. Examine GitHub Actions workflow runs
4. Contact system administrator
