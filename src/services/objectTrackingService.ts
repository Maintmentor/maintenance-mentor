import { supabase } from '@/lib/supabase';

interface Detection {
  frame_number: number;
  timestamp_seconds: number;
  object_class: string;
  confidence: number;
  bbox: { x: number; y: number; width: number; height: number };
}

interface Track {
  trackId: string;
  objectClass: string;
  detections: Detection[];
  firstFrame: number;
  lastFrame: number;
  firstTimestamp: number;
  lastTimestamp: number;
}

// Calculate Intersection over Union (IoU) for bbox matching
const calculateIoU = (
  bbox1: { x: number; y: number; width: number; height: number },
  bbox2: { x: number; y: number; width: number; height: number }
): number => {
  const x1 = Math.max(bbox1.x, bbox2.x);
  const y1 = Math.max(bbox1.y, bbox2.y);
  const x2 = Math.min(bbox1.x + bbox1.width, bbox2.x + bbox2.width);
  const y2 = Math.min(bbox1.y + bbox1.height, bbox2.y + bbox2.height);

  const intersection = Math.max(0, x2 - x1) * Math.max(0, y2 - y1);
  const area1 = bbox1.width * bbox1.height;
  const area2 = bbox2.width * bbox2.height;
  const union = area1 + area2 - intersection;

  return union > 0 ? intersection / union : 0;
};

// Generate insights from track data
const generateInsights = (track: Track): string[] => {
  const insights: string[] = [];
  const duration = track.lastTimestamp - track.firstTimestamp;
  
  insights.push(
    `${track.objectClass} appeared in frames ${track.firstFrame}-${track.lastFrame}`
  );
  
  insights.push(
    `Visible for ${duration.toFixed(1)} seconds (${track.detections.length} frames)`
  );

  const positions = track.detections.map(d => d.bbox);
  if (positions.length > 1) {
    const startX = positions[0].x + positions[0].width / 2;
    const endX = positions[positions.length - 1].x + positions[positions.length - 1].width / 2;
    const movement = endX - startX;
    
    if (Math.abs(movement) > 50) {
      insights.push(movement > 0 ? 'Moved from left to right' : 'Moved from right to left');
    } else {
      insights.push('Remained relatively stationary');
    }
  }

  return insights;
};

export const trackObjectsAcrossFrames = async (analysisId: string) => {
  // Fetch all detections
  const { data: detections, error } = await supabase
    .from('video_object_detections')
    .select('*')
    .eq('video_analysis_id', analysisId)
    .order('frame_number');

  if (error) throw error;

  const tracks: Map<string, Track> = new Map();
  let nextTrackId = 1;
  const IOU_THRESHOLD = 0.3;
  const MAX_FRAME_GAP = 5;

  for (const det of detections) {
    const detection: Detection = {
      frame_number: det.frame_number,
      timestamp_seconds: det.timestamp_seconds,
      object_class: det.object_class,
      confidence: det.confidence,
      bbox: {
        x: det.bbox_x,
        y: det.bbox_y,
        width: det.bbox_width,
        height: det.bbox_height
      }
    };

    let matched = false;

    for (const [trackId, track] of tracks) {
      if (track.objectClass !== detection.object_class) continue;
      if (detection.frame_number - track.lastFrame > MAX_FRAME_GAP) continue;

      const lastDet = track.detections[track.detections.length - 1];
      const iou = calculateIoU(lastDet.bbox, detection.bbox);

      if (iou > IOU_THRESHOLD) {
        track.detections.push(detection);
        track.lastFrame = detection.frame_number;
        track.lastTimestamp = detection.timestamp_seconds;
        matched = true;
        break;
      }
    }

    if (!matched) {
      const trackId = `track_${nextTrackId++}`;
      tracks.set(trackId, {
        trackId,
        objectClass: detection.object_class,
        detections: [detection],
        firstFrame: detection.frame_number,
        lastFrame: detection.frame_number,
        firstTimestamp: detection.timestamp_seconds,
        lastTimestamp: detection.timestamp_seconds
      });
    }
  }

  // Save tracks to database
  for (const track of tracks.values()) {
    const positions = track.detections.map(d => ({
      frame: d.frame_number,
      timestamp: d.timestamp_seconds,
      bbox: d.bbox,
      confidence: d.confidence
    }));

    const startPos = track.detections[0].bbox;
    const endPos = track.detections[track.detections.length - 1].bbox;
    
    const trajectoryData = {
      start_position: { x: startPos.x, y: startPos.y },
      end_position: { x: endPos.x, y: endPos.y },
      movement_direction: endPos.x > startPos.x ? 'right' : 'left',
      distance: Math.sqrt(
        Math.pow(endPos.x - startPos.x, 2) + Math.pow(endPos.y - startPos.y, 2)
      )
    };

    const avgConfidence = track.detections.reduce((sum, d) => sum + d.confidence, 0) / 
                          track.detections.length;

    await supabase.from('video_object_tracks').insert({
      analysis_id: analysisId,
      track_id: track.trackId,
      object_class: track.objectClass,
      first_frame: track.firstFrame,
      last_frame: track.lastFrame,
      first_timestamp: track.firstTimestamp,
      last_timestamp: track.lastTimestamp,
      frame_count: track.detections.length,
      confidence_avg: avgConfidence,
      positions,
      trajectory_data: trajectoryData,
      insights: generateInsights(track)
    });
  }

  return Array.from(tracks.values());
};

export const getObjectTracks = async (analysisId: string) => {
  const { data, error } = await supabase
    .from('video_object_tracks')
    .select('*')
    .eq('analysis_id', analysisId)
    .order('first_frame');

  if (error) throw error;
  return data;
};
