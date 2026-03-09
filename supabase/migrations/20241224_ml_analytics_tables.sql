-- ML Analytics Tables for Advanced Machine Learning Capabilities

-- ML Models table for storing trained models and metadata
CREATE TABLE IF NOT EXISTS ml_models (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(100) NOT NULL, -- 'anomaly_detection', 'predictive', 'pattern_recognition'
  algorithm VARCHAR(100) NOT NULL, -- 'autoencoder', 'lstm', 'random_forest', etc.
  version INTEGER DEFAULT 1,
  model_data JSONB, -- Serialized model weights/parameters
  training_config JSONB, -- Training hyperparameters
  performance_metrics JSONB, -- Accuracy, precision, recall, etc.
  status VARCHAR(50) DEFAULT 'training', -- 'training', 'ready', 'deprecated'
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_trained_at TIMESTAMP WITH TIME ZONE
);

-- Training Sessions table for tracking model training progress
CREATE TABLE IF NOT EXISTS ml_training_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  model_id UUID REFERENCES ml_models(id) ON DELETE CASCADE,
  dataset_size INTEGER,
  training_progress DECIMAL(5,2) DEFAULT 0.0, -- Percentage complete
  current_epoch INTEGER DEFAULT 0,
  total_epochs INTEGER,
  loss_history JSONB, -- Array of loss values per epoch
  validation_metrics JSONB,
  status VARCHAR(50) DEFAULT 'running', -- 'running', 'completed', 'failed', 'stopped'
  error_message TEXT,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES auth.users(id)
);

-- ML Predictions table for storing model predictions and results
CREATE TABLE IF NOT EXISTS ml_predictions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  model_id UUID REFERENCES ml_models(id),
  input_data JSONB NOT NULL,
  prediction_result JSONB NOT NULL,
  confidence_score DECIMAL(5,4),
  prediction_type VARCHAR(100), -- 'anomaly_score', 'forecast', 'classification'
  actual_value JSONB, -- For performance tracking when ground truth is available
  is_correct BOOLEAN, -- Whether prediction was accurate (when known)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Pattern Recognition Results table
CREATE TABLE IF NOT EXISTS pattern_recognition_results (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  model_id UUID REFERENCES ml_models(id),
  data_source VARCHAR(100), -- 'user_behavior', 'security_events', 'system_metrics'
  pattern_type VARCHAR(100), -- 'seasonal', 'trend', 'anomaly', 'cluster'
  pattern_data JSONB NOT NULL,
  confidence_level DECIMAL(5,4),
  time_window_start TIMESTAMP WITH TIME ZONE,
  time_window_end TIMESTAMP WITH TIME ZONE,
  detected_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  validated BOOLEAN DEFAULT FALSE,
  validation_feedback TEXT
);

-- Business Metrics Forecasts table
CREATE TABLE IF NOT EXISTS business_metrics_forecasts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  model_id UUID REFERENCES ml_models(id),
  metric_name VARCHAR(100) NOT NULL, -- 'user_growth', 'revenue', 'churn_rate', etc.
  forecast_horizon INTEGER, -- Days into the future
  predicted_values JSONB NOT NULL, -- Array of predicted values with timestamps
  confidence_intervals JSONB, -- Upper and lower bounds
  model_accuracy DECIMAL(5,4),
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  valid_until TIMESTAMP WITH TIME ZONE,
  actual_values JSONB -- For performance tracking
);

-- ML Model Performance Tracking table
CREATE TABLE IF NOT EXISTS ml_model_performance (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  model_id UUID REFERENCES ml_models(id),
  evaluation_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metric_name VARCHAR(100), -- 'accuracy', 'precision', 'recall', 'f1_score', 'mse', 'mae'
  metric_value DECIMAL(10,6),
  dataset_size INTEGER,
  evaluation_type VARCHAR(50), -- 'training', 'validation', 'test', 'production'
  additional_metrics JSONB
);

-- Automated Pattern Alerts table
CREATE TABLE IF NOT EXISTS automated_pattern_alerts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  pattern_id UUID REFERENCES pattern_recognition_results(id),
  alert_type VARCHAR(100), -- 'anomaly_detected', 'trend_change', 'threshold_breach'
  severity VARCHAR(50), -- 'low', 'medium', 'high', 'critical'
  message TEXT NOT NULL,
  recommended_actions JSONB,
  is_acknowledged BOOLEAN DEFAULT FALSE,
  acknowledged_by UUID REFERENCES auth.users(id),
  acknowledged_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_ml_models_type ON ml_models(type);
CREATE INDEX IF NOT EXISTS idx_ml_models_status ON ml_models(status);
CREATE INDEX IF NOT EXISTS idx_ml_predictions_model_id ON ml_predictions(model_id);
CREATE INDEX IF NOT EXISTS idx_ml_predictions_created_at ON ml_predictions(created_at);
CREATE INDEX IF NOT EXISTS idx_pattern_recognition_data_source ON pattern_recognition_results(data_source);
CREATE INDEX IF NOT EXISTS idx_pattern_recognition_detected_at ON pattern_recognition_results(detected_at);
CREATE INDEX IF NOT EXISTS idx_business_forecasts_metric_name ON business_metrics_forecasts(metric_name);
CREATE INDEX IF NOT EXISTS idx_model_performance_model_id ON ml_model_performance(model_id);
CREATE INDEX IF NOT EXISTS idx_pattern_alerts_severity ON automated_pattern_alerts(severity);

-- Enable RLS
ALTER TABLE ml_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE ml_training_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ml_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE pattern_recognition_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_metrics_forecasts ENABLE ROW LEVEL SECURITY;
ALTER TABLE ml_model_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE automated_pattern_alerts ENABLE ROW LEVEL SECURITY;