# AI Assistant Image Fetch Fix

## Problem
Users were getting "No images available" message when asking repair questions, even though the system was supposed to fetch real product images from the internet.

## Root Cause
The `repair-diagnostic` edge function was NOT calling the `fetch-real-part-images` function at all. It was only generating AI images when explicitly requested, but never fetching real product photos.

## Solution Implemented

### 1. Updated repair-diagnostic Function
- Added automatic part detection from AI responses using `PART:` markers
- Added intelligent part extraction from user questions (detects common parts like "flapper", "fill valve", etc.)
- Integrated calls to `fetch-real-part-images` for each detected part
- Returns `partImages` array with real product photos

### 2. Enhanced fetch-real-part-images Function
- Added comprehensive logging for debugging
- Improved error handling and fallback searches
- Added alternative search terms when primary search fails
- Lowered verification threshold from 0.7 to 0.6 for more results
- Added generic fallback search with "replacement part product" keywords
- Better handling when Google API is not configured

### 3. Automatic Part Detection
The system now automatically detects these common parts:
- Toilet parts: flapper, fill valve, flush valve, wax ring
- Faucet parts: cartridge, aerator, washer, o-ring, gasket
- HVAC parts: thermostat, filter, capacitor, relay
- Electrical: breaker, outlet, light fixture, ballast
- Plumbing: garbage disposal, drain, trap, p-trap, strainer
- Hardware: door hinge, door knob, lock, strike plate

## How It Works Now

1. **User asks question**: "My toilet is running"
2. **AI analyzes**: Identifies parts needed (e.g., "PART: Fluidmaster 400A Fill Valve")
3. **Auto-detection**: Also detects "fill valve" from the question
4. **Image fetch**: Calls `fetch-real-part-images` for each part
5. **Google Search**: Searches Google Images with multiple queries
6. **Direct URLs**: Tries direct links to parts supplier websites
7. **AI Verification**: Uses GPT-4o-mini to verify image accuracy
8. **Display**: Shows real product photos with verification scores

## Testing

Test with these questions:
- "My toilet is running" → Should show fill valve images
- "Leaky faucet" → Should show faucet cartridge images  
- "Garbage disposal not working" → Should show disposal images
- "Thermostat not working" → Should show thermostat images

## Debugging

Check Supabase edge function logs for:
- "Parts to fetch:" - Shows detected parts
- "Fetching image for:" - Shows each fetch attempt
- "Part image response:" - Shows API response
- "Final part images count:" - Shows how many images returned
- "Google API configured:" - Verifies API keys are set

## Configuration Required

Ensure these environment variables are set in Supabase:
- `GOOGLE_API_KEY` - For Google Custom Search API
- `GOOGLE_CSE_ID` - Custom Search Engine ID
- `OPENAI_API_KEY` - For AI verification

## Fallback Behavior

If no images are found:
1. System tries alternative search terms
2. Tries generic "replacement part" search
3. Falls back to AI-generated images if available
4. Shows "No images available" only as last resort

## Benefits

✅ Real product photos from the internet
✅ Automatic part detection - no manual tagging needed
✅ AI verification for image accuracy
✅ User feedback system for continuous improvement
✅ Multiple fallback strategies
✅ Comprehensive error handling
