# Image Annotation Feature Documentation

## Overview
Users can now draw annotations on captured/uploaded photos before sending them to the AI for analysis. This helps highlight problem areas and provide visual context.

## Features Implemented

### 1. Drawing Tools
- **Pen Tool**: Freehand drawing to circle or mark areas
- **Arrow Tool**: Point to specific problem areas
- **Circle Tool**: Highlight circular regions
- **Rectangle Tool**: Mark rectangular areas
- **Text Tool**: Add text labels to images

### 2. Color Selection
8 preset colors available:
- Red (#FF0000)
- Green (#00FF00)
- Blue (#0000FF)
- Yellow (#FFFF00)
- Magenta (#FF00FF)
- Cyan (#00FFFF)
- Orange (#FFA500)
- White (#FFFFFF)

### 3. Annotation Workflow
1. User captures photo or uploads image
2. Clicks on thumbnail to open annotation editor
3. Selects drawing tool and color
4. Draws on the image to mark problem areas
5. Can undo mistakes with undo button
6. Saves annotated image
7. Sends to AI for analysis

### 4. Components Created

#### ImageAnnotationEditor.tsx
- Canvas-based drawing interface
- Tool selection (pen, arrow, circle, rectangle, text)
- Color picker with 8 preset colors
- Undo functionality with history tracking
- Save/Cancel actions
- Mouse event handling for drawing

#### Updated ImageUploadModal.tsx
- Integrated annotation editor
- Edit button on image thumbnails
- Modal switches between capture/upload view and annotation view
- Supports multiple image annotation
- Annotated images saved as JPEG with high quality (0.9)

## Usage Instructions

### For Users
1. Click the camera button in chat interface
2. Capture photo or upload from device
3. Click the edit icon (appears on hover) on any thumbnail
4. Use drawing tools to mark problem areas:
   - Select pen tool and draw circles around issues
   - Use arrow tool to point at specific parts
   - Add text labels to describe problems
   - Choose different colors for clarity
5. Click "Save Annotation" when done
6. Click "Send" to submit annotated images to AI

### For Developers

#### Integration with Chat
```typescript
// Images are automatically uploaded to Supabase storage
// Annotated images are saved with prefix "annotated-"
const fileName = `annotated-${Date.now()}-${i}.jpg`;

// AI receives annotated image URLs in the images array
await supabase.functions.invoke('repair-diagnostic', {
  body: { 
    question: userMsg.content, 
    images: annotatedImageUrls // URLs of annotated images
  }
});
```

#### Canvas Drawing Implementation
- Uses HTML5 Canvas API for drawing
- Maintains drawing history for undo functionality
- Converts canvas to data URL for saving
- Scales mouse coordinates for responsive canvas

## Technical Details

### Drawing Tools Implementation

**Pen Tool**: Continuous path drawing
```typescript
ctx.beginPath();
ctx.moveTo(startX, startY);
ctx.lineTo(currentX, currentY);
ctx.stroke();
```

**Arrow Tool**: Line with arrowhead
```typescript
drawArrow(ctx, fromX, fromY, toX, toY);
// Calculates angle and draws arrowhead
```

**Circle Tool**: Radius-based circle
```typescript
const radius = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
```

**Rectangle Tool**: Bounding box
```typescript
ctx.strokeRect(x1, y1, width, height);
```

**Text Tool**: Click to place text
```typescript
ctx.font = '24px Arial';
ctx.fillText(text, x, y);
```

### Storage
- Annotated images stored in Supabase Storage bucket: `repair-photos`
- Path format: `{userId}/{timestamp}_annotated-{index}.jpg`
- Public URLs generated for AI analysis
- Original images replaced with annotated versions

### Performance
- Canvas rendering: Real-time drawing with no lag
- Image quality: 90% JPEG compression for optimal size/quality
- History tracking: Stores ImageData for undo (memory efficient)

## Benefits

1. **Better AI Analysis**: Annotated images help AI focus on specific problem areas
2. **Clear Communication**: Users can visually indicate exactly what's broken
3. **Multiple Issues**: Different colors can mark different problems in one image
4. **Text Context**: Labels provide additional context for AI
5. **Professional**: Makes repair requests more detailed and actionable

## Future Enhancements

- [ ] Eraser tool to remove annotations
- [ ] Adjustable line thickness
- [ ] More shapes (polygon, ellipse)
- [ ] Custom color picker (not just presets)
- [ ] Zoom/pan for detailed annotations
- [ ] Save annotation templates
- [ ] Export annotated images separately

## Testing

### Test Scenarios
1. ✅ Capture photo and annotate with pen
2. ✅ Upload image and add arrows
3. ✅ Add text labels with different colors
4. ✅ Undo multiple drawing actions
5. ✅ Annotate multiple images in one session
6. ✅ Send annotated images to AI for analysis
7. ✅ Display annotated images in chat history

### Browser Compatibility
- Chrome/Edge: Full support
- Firefox: Full support
- Safari: Full support
- Mobile browsers: Touch events supported

## Troubleshooting

**Issue**: Drawing not appearing
- **Solution**: Check canvas context initialization

**Issue**: Annotations lost after save
- **Solution**: Verify canvas.toDataURL() is working

**Issue**: Mouse coordinates off
- **Solution**: Check canvas scaling calculation

**Issue**: Undo not working
- **Solution**: Verify history array is being populated

## Related Files
- `src/components/chat/ImageAnnotationEditor.tsx` - Main annotation component
- `src/components/chat/ImageUploadModal.tsx` - Modal with annotation integration
- `src/components/chat/EnhancedChatInterface.tsx` - Chat interface displaying images
- `CAMERA_IMAGE_UPLOAD_FEATURE.md` - Camera upload documentation
