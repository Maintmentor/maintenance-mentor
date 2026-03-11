# Object Tracking System Documentation

## Overview
The Object Tracking System extends video analysis with frame-to-frame object tracking, trajectory visualization, and intelligent insights generation. It uses IoU (Intersection over Union) based matching to track objects across video frames.

## Database Schema

### video_object_tracks Table
```sql
- id: UUID (primary key)
- analysis_id: UUID (references video_analysis)
- track_id: TEXT (unique identifier for each track)
- object_class: TEXT (type of object being tracked)
- first_frame: INTEGER (starting frame number)
- last_frame: INTEGER (ending frame number)
- first_timestamp: NUMERIC (start time in seconds)
- last_timestamp: NUMERIC (end time in seconds)
- frame_count: INTEGER (number of frames object appears in)
- confidence_avg: NUMERIC (average detection confidence)
- positions: JSONB (array of frame positions and bboxes)
- trajectory_data: JSONB (movement analysis data)
- insights: TEXT[] (generated insights about the track)
```

## Core Features

### 1. Object Tracking Algorithm
- **IoU-Based Matching**: Calculates Intersection over Union between bounding boxes
- **Frame Gap Tolerance**: Allows up to 5 frames gap for tracking continuity
- **Class Filtering**: Only matches objects of the same class
- **Unique Track IDs**: Assigns persistent IDs to tracked objects

### 2. Trajectory Analysis
Tracks object movement and generates:
- Start and end positions
- Movement direction (left/right)
- Total distance traveled
- Movement patterns

### 3. Automated Insights
Generates human-readable insights:
- "wrench appeared in frames 10-45"
- "Visible for 5.2 seconds (12 frames)"
- "Moved from left to right"
- "Remained relatively stationary"

## Components

### ObjectTrackTimeline
Visual timeline showing:
- Color-coded tracks for each object
- Track duration bars
- Hover tooltips with detailed insights
- Movement indicators

### TrackInsightsPanel
Detailed insights panel displaying:
- Track metadata (ID, class, confidence)
- Time range and frame count
- Trajectory information
- Generated insights list

## API Functions

### objectTrackingService.ts

#### trackObjectsAcrossFrames(analysisId)
Processes all detections and creates tracks:
- Fetches video detections
- Matches objects across frames using IoU
- Generates trajectory data
- Saves tracks to database
- Returns array of Track objects

#### getObjectTracks(analysisId)
Retrieves all tracks for a video analysis:
- Queries video_object_tracks table
- Orders by first_frame
- Returns complete track data

## Tracking Parameters

### Configurable Thresholds
```typescript
const IOU_THRESHOLD = 0.3;      // Minimum IoU for matching
const MAX_FRAME_GAP = 5;        // Maximum frames between detections
```

### IoU Calculation
```typescript
IoU = intersection_area / union_area
```
- Values range from 0 (no overlap) to 1 (perfect overlap)
- 0.3 threshold balances accuracy and continuity

## Usage Flow

1. **Video Upload**: User uploads repair video
2. **Frame Analysis**: System detects objects in each frame
3. **Object Tracking**: Automatically runs after frame analysis
4. **Track Storage**: Saves tracks with trajectory data
5. **Visualization**: Display tracks on timeline
6. **Insights**: Show generated insights to user

## Integration Points

### Video Analysis Service
```typescript
// After frame-by-frame detection completes
await trackObjectsAcrossFrames(analysisId);
```

### UI Components
```typescript
<ObjectTrackTimeline analysisId={id} duration={duration} />
<TrackInsightsPanel analysisId={id} />
```

## Performance Considerations

- Tracking runs after all frames are analyzed
- Efficient IoU calculation using bbox coordinates
- Database indexes on analysis_id and track_id
- Batch processing of detections

## Future Enhancements

1. **Advanced Tracking**: Kalman filtering for prediction
2. **Multi-Object Tracking**: Handle occlusions better
3. **Speed Analysis**: Calculate object velocities
4. **Path Prediction**: Predict future positions
5. **Interaction Detection**: Identify when objects interact
6. **Export Tracks**: Export tracking data as JSON/CSV

## Example Insights

```
"wrench appeared in frames 10-45"
"Visible for 3.5 seconds (7 frames)"
"Moved from left to right"
"Average confidence: 87%"
```

## Benefits

- **Continuity**: Tracks same object across entire video
- **Context**: Understand object behavior over time
- **Insights**: Automatic analysis of object movements
- **Visualization**: Clear timeline representation
- **Repair Guides**: Better guide generation from tracked objects
