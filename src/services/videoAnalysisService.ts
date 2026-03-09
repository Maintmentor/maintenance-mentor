import { supabase } from '@/lib/supabase';
import { detectObjects } from './objectDetectionService';
import { trackObjectsAcrossFrames } from './objectTrackingService';
import { PredictiveTracker, savePredictions, saveWarnings } from './predictiveTrackingService';



export interface VideoAnalysis {
  id: string;
  video_url: string;
  video_name: string;
  duration_seconds: number;
  total_frames: number;
  analyzed_frames: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress_percent: number;
}

export interface ObjectDetection {
  frame_number: number;
  timestamp_seconds: number;
  object_class: string;
  confidence: number;
  bbox: { x: number; y: number; width: number; height: number };
}

export interface KeyFrame {
  frame_number: number;
  timestamp_seconds: number;
  frame_image_url?: string;
  detected_objects: any[];
  importance_score: number;
}

export const analyzeVideo = async (
  videoFile: File,
  onProgress?: (progress: number) => void
): Promise<string> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Upload video to storage
  const fileName = `${user.id}/${Date.now()}_${videoFile.name}`;
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('videos')
    .upload(fileName, videoFile);

  if (uploadError) throw uploadError;

  const { data: { publicUrl } } = supabase.storage
    .from('videos')
    .getPublicUrl(fileName);

  // Create analysis record
  const { data: analysis, error } = await supabase
    .from('video_analysis')
    .insert({
      user_id: user.id,
      video_url: publicUrl,
      video_name: videoFile.name,
      status: 'pending'
    })
    .select()
    .single();

  if (error) throw error;

  // Start processing in background
  processVideo(analysis.id, publicUrl, onProgress);

  return analysis.id;
};

const processVideo = async (
  analysisId: string,
  videoUrl: string,
  onProgress?: (progress: number) => void
) => {
  try {
    await supabase
      .from('video_analysis')
      .update({ status: 'processing' })
      .eq('id', analysisId);

    const video = document.createElement('video');
    video.src = videoUrl;
    video.crossOrigin = 'anonymous';

    await new Promise((resolve) => {
      video.onloadedmetadata = resolve;
    });

    const duration = video.duration;
    const fps = 2; // Analyze 2 frames per second
    const totalFrames = Math.floor(duration * fps);

    await supabase
      .from('video_analysis')
      .update({ duration_seconds: duration, total_frames: totalFrames })
      .eq('id', analysisId);

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;

    for (let i = 0; i < totalFrames; i++) {
      const timestamp = i / fps;
      video.currentTime = timestamp;

      await new Promise((resolve) => {
        video.onseeked = resolve;
      });

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0);

      const detections = await detectObjects(canvas);

      for (const det of detections) {
        await supabase.from('video_object_detections').insert({
          video_analysis_id: analysisId,
          frame_number: i,
          timestamp_seconds: timestamp,
          object_class: det.class,
          confidence: det.score,
          bbox_x: det.bbox[0],
          bbox_y: det.bbox[1],
          bbox_width: det.bbox[2],
          bbox_height: det.bbox[3]
        });
      }

      const progress = Math.round(((i + 1) / totalFrames) * 100);
      await supabase
        .from('video_analysis')
        .update({ analyzed_frames: i + 1, progress_percent: progress })
        .eq('id', analysisId);

      onProgress?.(progress);
    }

    // Perform object tracking after all frames are analyzed
    const tracks = await trackObjectsAcrossFrames(analysisId);

    // Apply predictive tracking to each track
    for (const track of tracks) {
      const detections = track.detections.map((d: any) => ({
        frame: d.frame_number,
        timestamp: d.timestamp_seconds,
        bbox: d.bbox,
        confidence: d.confidence
      }));

      if (detections.length > 2) {
        const firstDet = detections[0];
        const centerX = firstDet.bbox.x + firstDet.bbox.width / 2;
        const centerY = firstDet.bbox.y + firstDet.bbox.height / 2;

        const predictor = new PredictiveTracker(
          centerX,
          centerY,
          canvas.width,
          canvas.height
        );

        // Smooth trajectory
        const smoothed = predictor.smoothTrajectory(detections);

        // Predict future positions
        const predictions = predictor.predictFuturePositions(smoothed, 10);

        // Generate warnings
        const warnings = predictor.generateWarnings(predictions);

        // Get track ID from database
        const { data: trackData } = await supabase
          .from('video_object_tracks')
          .select('id')
          .eq('track_id', track.trackId)
          .eq('analysis_id', analysisId)
          .single();

        if (trackData) {
          await savePredictions(trackData.id, analysisId, predictions);
          if (warnings.length > 0) {
            await saveWarnings(trackData.id, analysisId, warnings);
          }
        }
      }
    }


    await supabase
      .from('video_analysis')
      .update({ status: 'completed', completed_at: new Date().toISOString() })
      .eq('id', analysisId);

  } catch (error) {
    await supabase
      .from('video_analysis')
      .update({ status: 'failed' })
      .eq('id', analysisId);
    throw error;
  }
};

export const getVideoAnalysis = async (analysisId: string) => {
  const { data, error } = await supabase
    .from('video_analysis')
    .select('*')
    .eq('id', analysisId)
    .single();

  if (error) throw error;
  return data;
};

export const getObjectTimeline = async (analysisId: string) => {
  const { data, error } = await supabase
    .from('video_object_detections')
    .select('*')
    .eq('video_analysis_id', analysisId)
    .order('timestamp_seconds');

  if (error) throw error;
  return data;
};
