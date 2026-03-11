# Video Analysis System with TensorFlow.js Object Detection

## Overview
The Video Analysis System extends TensorFlow.js object detection to work with uploaded repair videos, providing frame-by-frame analysis, timeline visualization, key frame extraction, and automated repair guide generation.

## Features

### 1. Video Upload & Processing
- Upload repair videos in MP4, MOV, AVI formats
- Automatic frame extraction (2 FPS default)
- Real-time progress tracking
- Background processing with status updates

### 2. Frame-by-Frame Object Detection
- Uses TensorFlow.js COCO-SSD model
- Detects 80+ object classes including tools and parts
- Confidence scoring for each detection
- Bounding box coordinates stored for each frame

### 3. Timeline Visualization
- Visual timeline showing when objects appear throughout video
- Color-coded by object type
- Hover to see timestamp and confidence
- Interactive scrubbing through detections

### 4. Key Frame Extraction with Image Capture
- Automatic identification of important frames
- **Actual frame images captured and stored in Supabase storage**
- Importance scoring based on:
  - Number of detected objects
  - Average confidence scores
  - Relevance of detected items (tools, parts)
- Top 20 frames extracted and saved with images
- **Download individual frames as JPEG**
- **Export all key frames as ZIP file**

### 5. Video Annotations
- Add timestamped notes, warnings, tips
- Part identification annotations
- Edit and delete annotations
- Linked to detected objects

### 6. Repair Guide Generation
- Automatically generates step-by-step guides
- Based on detected objects throughout video
- Includes difficulty level estimation
- Time estimates per step
- Export functionality

## Database Schema

### video_analysis
```sql
- id: UUID (primary key)
- user_id: UUID (foreign key)
- video_url: TEXT
- video_name: TEXT
- duration_seconds: DECIMAL
- total_frames: INTEGER
- analyzed_frames: INTEGER
- status: TEXT (pending/processing/completed/failed)
- progress_percent: INTEGER
- created_at: TIMESTAMPTZ
- completed_at: TIMESTAMPTZ
```

### video_object_detections
```sql
- id: UUID (primary key)
- video_analysis_id: UUID (foreign key)
- frame_number: INTEGER
- timestamp_seconds: DECIMAL
- object_class: TEXT
- confidence: DECIMAL
- bbox_x, bbox_y, bbox_width, bbox_height: DECIMAL
- is_key_frame: BOOLEAN
- created_at: TIMESTAMPTZ
```

### video_key_frames
```sql
- id: UUID (primary key)
- video_analysis_id: UUID (foreign key)
- frame_number: INTEGER
- timestamp_seconds: DECIMAL
- frame_image_url: TEXT
- detected_objects: JSONB
- importance_score: DECIMAL
- description: TEXT
- created_at: TIMESTAMPTZ
```

### video_annotations
```sql
- id: UUID (primary key)
- video_analysis_id: UUID (foreign key)
- user_id: UUID (foreign key)
- timestamp_seconds: DECIMAL
- annotation_type: TEXT (note/warning/tip/part_identification)
- content: TEXT
- related_objects: JSONB
- created_at: TIMESTAMPTZ
- updated_at: TIMESTAMPTZ
```

### video_repair_guides
```sql
- id: UUID (primary key)
- video_analysis_id: UUID (foreign key)
- user_id: UUID (foreign key)
- title: TEXT
- steps: JSONB
- detected_parts: JSONB
- difficulty_level: TEXT
- estimated_time_minutes: INTEGER
- created_at: TIMESTAMPTZ
```

## Usage

### Upload and Analyze Video
```typescript
import { analyzeVideo } from '@/services/videoAnalysisService';

const handleUpload = async (videoFile: File) => {
  const analysisId = await analyzeVideo(videoFile, (progress) => {
    console.log(`Progress: ${progress}%`);
  });
};
```

### View Object Timeline
```typescript
import { getObjectTimeline } from '@/services/videoAnalysisService';

const timeline = await getObjectTimeline(analysisId);
// Returns array of detections with timestamps
```

### Extract Key Frames with Images
```typescript
import { extractKeyFrames, downloadFrame, exportAllFramesAsZip } from '@/services/keyFrameExtractor';

// Extract key frames and capture images
const keyFrames = await extractKeyFrames(analysisId);
// Returns top 20 most important frames with frame_image_url

// Download individual frame
await downloadFrame(keyFrame.frame_image_url, keyFrame.frame_number);

// Export all frames as ZIP
await exportAllFramesAsZip(keyFrames);
```


### Add Annotation
```typescript
await supabase
  .from('video_annotations')
  .insert({
    video_analysis_id: analysisId,
    user_id: userId,
    timestamp_seconds: 45.5,
    annotation_type: 'tip',
    content: 'Use a wrench here'
  });
```

## Components

### VideoUploadAnalyzer
Upload interface with progress tracking
- File selection
- Upload progress bar
- Error handling

### ObjectTimeline
Visual timeline of detected objects
- Color-coded object tracks
- Hover tooltips with details
- Time scrubbing

### KeyFrameGallery
Grid display of extracted key frames with actual captured images
- **Displays actual frame images from Supabase storage**
- Importance score badges
- Detected object counts
- Timestamp labels
- **Download individual frames as JPEG (hover to reveal button)**
- **Export all frames as ZIP file**

### VideoAnnotationTool
Add and manage video annotations
- Type selection (note/warning/tip/part_id)
- Timestamp-based annotations
- Edit/delete functionality

### RepairGuideGenerator
Generate repair guides from video
- Automatic step generation
- Difficulty estimation
- Export functionality

## Access
Navigate to `/video-analysis` when logged in to access the video analysis system.

## Storage Structure
Key frame images are stored in Supabase storage bucket 'videos' with the following structure:
```
{user_id}/key-frames/{analysis_id}/frame_{frame_number}_{timestamp}.jpg
```

## Performance Considerations
- Videos are analyzed at 2 FPS to balance accuracy and speed
- Object detection runs client-side using TensorFlow.js
- Large videos may take several minutes to process
- Progress updates provided in real-time
- Frame images are captured as JPEG with 90% quality
- Key frames are stored in Supabase storage for persistent access

## Future Enhancements
- Video playback with synchronized detections
- Advanced filtering by object type
- Batch video processing
- Cloud-based processing for faster analysis
- Frame-by-frame object tracking across video
- Automatic scene detection and segmentation
