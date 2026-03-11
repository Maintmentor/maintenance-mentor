-- Create table for storing predicted object positions
CREATE TABLE IF NOT EXISTS video_object_predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  track_id UUID REFERENCES video_object_tracks(id) ON DELETE CASCADE,
  analysis_id UUID REFERENCES video_analyses(id) ON DELETE CASCADE,
  predicted_frame INTEGER NOT NULL,
  predicted_x FLOAT NOT NULL,
  predicted_y FLOAT NOT NULL,
  predicted_width FLOAT NOT NULL,
  predicted_height FLOAT NOT NULL,
  confidence FLOAT NOT NULL,
  velocity_x FLOAT,
  velocity_y FLOAT,
  acceleration_x FLOAT,
  acceleration_y FLOAT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create table for tracking warnings
CREATE TABLE IF NOT EXISTS video_tracking_warnings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  track_id UUID REFERENCES video_object_tracks(id) ON DELETE CASCADE,
  analysis_id UUID REFERENCES video_analyses(id) ON DELETE CASCADE,
  warning_type TEXT NOT NULL,
  frame_number INTEGER NOT NULL,
  severity TEXT NOT NULL,
  message TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes
CREATE INDEX idx_predictions_track ON video_object_predictions(track_id);
CREATE INDEX idx_predictions_analysis ON video_object_predictions(analysis_id);
CREATE INDEX idx_warnings_track ON video_tracking_warnings(track_id);
CREATE INDEX idx_warnings_analysis ON video_tracking_warnings(analysis_id);

-- Enable RLS
ALTER TABLE video_object_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_tracking_warnings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own predictions"
  ON video_object_predictions FOR SELECT
  USING (
    analysis_id IN (
      SELECT id FROM video_analyses WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own predictions"
  ON video_object_predictions FOR INSERT
  WITH CHECK (
    analysis_id IN (
      SELECT id FROM video_analyses WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view their own warnings"
  ON video_tracking_warnings FOR SELECT
  USING (
    analysis_id IN (
      SELECT id FROM video_analyses WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own warnings"
  ON video_tracking_warnings FOR INSERT
  WITH CHECK (
    analysis_id IN (
      SELECT id FROM video_analyses WHERE user_id = auth.uid()
    )
  );
