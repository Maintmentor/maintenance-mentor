import { supabase } from '@/lib/supabase';

export interface KeyFrameCandidate {
  frame_number: number;
  timestamp_seconds: number;
  detected_objects: any[];
  importance_score: number;
  frame_image_url?: string;
}

// Capture frame as image and upload to storage
const captureAndUploadFrame = async (
  videoUrl: string,
  timestamp: number,
  analysisId: string,
  frameNumber: number
): Promise<string> => {
  const video = document.createElement('video');
  video.src = videoUrl;
  video.crossOrigin = 'anonymous';

  await new Promise((resolve) => {
    video.onloadedmetadata = resolve;
  });

  video.currentTime = timestamp;
  await new Promise((resolve) => {
    video.onseeked = resolve;
  });

  const canvas = document.createElement('canvas');
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(video, 0, 0);

  // Convert canvas to blob
  const blob = await new Promise<Blob>((resolve) => {
    canvas.toBlob((blob) => resolve(blob!), 'image/jpeg', 0.9);
  });

  // Upload to Supabase storage
  const { data: { user } } = await supabase.auth.getUser();
  const fileName = `${user?.id}/key-frames/${analysisId}/frame_${frameNumber}_${Date.now()}.jpg`;
  
  const { error: uploadError } = await supabase.storage
    .from('videos')
    .upload(fileName, blob, {
      contentType: 'image/jpeg',
      cacheControl: '3600'
    });

  if (uploadError) throw uploadError;

  const { data: { publicUrl } } = supabase.storage
    .from('videos')
    .getPublicUrl(fileName);

  return publicUrl;
};

export const extractKeyFrames = async (analysisId: string): Promise<KeyFrameCandidate[]> => {
  // Get video URL
  const { data: analysis } = await supabase
    .from('video_analysis')
    .select('video_url')
    .eq('id', analysisId)
    .single();

  if (!analysis) throw new Error('Analysis not found');

  // Get all detections
  const { data: detections, error } = await supabase
    .from('video_object_detections')
    .select('*')
    .eq('video_analysis_id', analysisId)
    .order('frame_number');

  if (error) throw error;

  // Group by frame
  const frameMap = new Map<number, any[]>();
  detections.forEach(det => {
    if (!frameMap.has(det.frame_number)) {
      frameMap.set(det.frame_number, []);
    }
    frameMap.get(det.frame_number)!.push(det);
  });

  // Score each frame
  const candidates: KeyFrameCandidate[] = [];
  frameMap.forEach((objects, frameNumber) => {
    const score = calculateImportanceScore(objects);
    if (score > 0.5) {
      candidates.push({
        frame_number: frameNumber,
        timestamp_seconds: objects[0].timestamp_seconds,
        detected_objects: objects,
        importance_score: score
      });
    }
  });

  // Sort by importance and select top frames
  candidates.sort((a, b) => b.importance_score - a.importance_score);
  const topFrames = candidates.slice(0, 20);

  // Capture and save frames with images
  for (const frame of topFrames) {
    try {
      const imageUrl = await captureAndUploadFrame(
        analysis.video_url,
        frame.timestamp_seconds,
        analysisId,
        frame.frame_number
      );

      await supabase.from('video_key_frames').insert({
        video_analysis_id: analysisId,
        frame_number: frame.frame_number,
        timestamp_seconds: frame.timestamp_seconds,
        frame_image_url: imageUrl,
        detected_objects: frame.detected_objects,
        importance_score: frame.importance_score
      });

      frame.frame_image_url = imageUrl;
    } catch (error) {
      console.error('Error capturing frame:', error);
    }
  }

  return topFrames;
};

const calculateImportanceScore = (objects: any[]): number => {
  let score = 0;
  
  // More objects = more important
  score += Math.min(objects.length * 0.15, 0.4);
  
  // High confidence objects
  const avgConfidence = objects.reduce((sum, obj) => sum + obj.confidence, 0) / objects.length;
  score += avgConfidence * 0.3;
  
  // Tool/part relevance
  const relevantClasses = ['scissors', 'knife', 'bottle', 'cup', 'bowl', 'laptop', 'mouse', 'keyboard', 'cell phone', 'book'];
  const relevantCount = objects.filter(obj => relevantClasses.includes(obj.object_class)).length;
  score += Math.min(relevantCount * 0.2, 0.3);
  
  return Math.min(score, 1.0);
};

export const getKeyFrames = async (analysisId: string) => {
  const { data, error } = await supabase
    .from('video_key_frames')
    .select('*')
    .eq('video_analysis_id', analysisId)
    .order('importance_score', { ascending: false });

  if (error) throw error;
  return data;
};

// Download individual frame
export const downloadFrame = async (frameImageUrl: string, frameNumber: number) => {
  const response = await fetch(frameImageUrl);
  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `frame_${frameNumber}.jpg`;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
};

// Export all frames as ZIP
export const exportAllFramesAsZip = async (keyFrames: any[]) => {
  // Dynamic import of JSZip
  const JSZip = (await import('jszip')).default;
  const zip = new JSZip();

  for (const frame of keyFrames) {
    if (frame.frame_image_url) {
      try {
        const response = await fetch(frame.frame_image_url);
        const blob = await response.blob();
        zip.file(`frame_${frame.frame_number}_${frame.timestamp_seconds.toFixed(2)}s.jpg`, blob);
      } catch (error) {
        console.error(`Error adding frame ${frame.frame_number} to zip:`, error);
      }
    }
  }

  const content = await zip.generateAsync({ type: 'blob' });
  const url = window.URL.createObjectURL(content);
  const a = document.createElement('a');
  a.href = url;
  a.download = `key_frames_${Date.now()}.zip`;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
};
