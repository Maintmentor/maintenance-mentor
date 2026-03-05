# AI Image Quality Verification System

## Overview
This system uses OpenAI Vision API to verify that fetched product images actually match the requested parts, with automatic retry logic and user feedback collection to continuously improve accuracy.

## Features Implemented

### 1. **OpenAI Vision API Verification**
- Each fetched image is analyzed by GPT-4 Vision to verify it matches the part
- AI provides a confidence score (0.0-1.0) and reasoning for its assessment
- Images with score >= 0.7 are considered verified matches
- Verification results are displayed to users with match percentage badges

### 2. **Automatic Retry with Alternative Search Terms**
- If no verified images found, system automatically tries alternative search queries
- Generates variations like:
  - `{brand} {partNumber}`
  - `{partName} replacement`
  - `{brand} {partName}`
- Stops when a verified image is found or all alternatives exhausted

### 3. **User Feedback System**
- Thumbs up/down buttons on every product image
- Feedback stored in `image_quality_feedback` table with:
  - Part number and search query
  - Image URL and source
  - User feedback (positive/negative)
  - AI verification score and reasoning
  - Timestamp and user ID
- Feedback helps improve future search algorithms

### 4. **Visual Indicators**
- Match percentage badge (green for >=70%, gray for <70%)
- AI reasoning displayed below images
- Feedback buttons highlight when clicked
- Source badges show where image came from

## Database Schema

```sql
CREATE TABLE image_quality_feedback (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  message_id UUID,
  part_number TEXT NOT NULL,
  image_url TEXT NOT NULL,
  search_query TEXT NOT NULL,
  feedback_type TEXT CHECK (feedback_type IN ('positive', 'negative')),
  ai_verification_score DECIMAL(3,2),
  ai_verification_reasoning TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Edge Function Updates

### fetch-real-part-images
- Added `verifyImageWithAI()` function using OpenAI Vision API
- Added `searchAndVerifyImages()` for primary search with verification
- Added `generateAlternativeSearchTerms()` for retry logic
- Returns verification score and reasoning with each image

## Frontend Components

### EnhancedChatInterface.tsx
- Displays verification scores as badges
- Shows AI reasoning below images
- Thumbs up/down buttons for user feedback
- Feedback state management and submission

### imageFeedbackService.ts
- `submitFeedback()` - Save user feedback to database
- `getFeedbackStats()` - Get positive/negative counts for a part
- `getSearchQueryPerformance()` - Calculate success rate for search terms

## How It Works

1. **User asks repair question** → AI generates REAL_PART commands
2. **System fetches images** from Google Custom Search and direct URLs
3. **AI verifies each image** using GPT-4 Vision API
   - Checks if image matches part name, number, and brand
   - Returns confidence score and reasoning
4. **If no verified images found** → Try alternative search terms
5. **Display best verified image** with match percentage badge
6. **User provides feedback** via thumbs up/down buttons
7. **Feedback stored** for future algorithm improvements

## Benefits

- **Higher Accuracy**: Only show images verified by AI to match the part
- **Better User Experience**: Users see relevant images, not random results
- **Continuous Improvement**: User feedback trains the system over time
- **Transparency**: Users see AI confidence scores and reasoning
- **Fallback Logic**: Multiple attempts with different search terms

## Future Enhancements

- Use feedback data to weight search sources (prefer sources with high positive feedback)
- Train custom model on feedback data for better verification
- Implement A/B testing of different search strategies
- Add "report incorrect image" feature with detailed reasons
- Show aggregated feedback stats (e.g., "95% of users found this helpful")
