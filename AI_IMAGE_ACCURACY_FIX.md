# AI Image Accuracy Fix - Critical Response Parsing Issue

## Problem Identified
The AI assistant is showing "No images available" because the `repair-diagnostic` edge function is checking for the wrong field names in the response from `fetch-real-part-images`.

## Root Cause
**Mismatch between what fetch-real-part-images returns vs what repair-diagnostic expects:**

### What fetch-real-part-images RETURNS:
```json
{
  "success": true,
  "image": "https://...",           // ← Returns "image"
  "allImages": [...],
  "searchQuery": "...",
  "message": "..."
}
```

### What repair-diagnostic is CHECKING FOR:
```javascript
if (imageData.success && imageData.imageUrl) {  // ← Looking for "imageUrl" (WRONG!)
  // This never executes because imageUrl doesn't exist
}
```

## Fix Required in Supabase Dashboard

### Step 1: Open repair-diagnostic Function
1. Go to Supabase Dashboard
2. Navigate to Edge Functions
3. Find and open `repair-diagnostic`

### Step 2: Find This Code (around line 120-135):
```javascript
if (imageResponse.ok) {
  const imageData = await imageResponse.json();
  console.log('Image fetch response:', imageData);
  
  if (imageData.success && imageData.imageUrl) {  // ← WRONG FIELD NAME
    partImages.push({
      query: partQuery,
      url: imageData.imageUrl,  // ← WRONG FIELD NAME
      source: imageData.source || 'Product Image'
    });
    console.log(`✓ Found real product image: ${imageData.imageUrl}`);
  } else {
    console.log('✗ No image found for:', partQuery);
  }
}
```

### Step 3: Replace With This Fixed Code:
```javascript
if (imageResponse.ok) {
  const imageData = await imageResponse.json();
  console.log('Image fetch response:', imageData);
  
  if (imageData.success && imageData.image) {  // ← CORRECT: "image"
    partImages.push({
      query: partQuery,
      url: imageData.image,  // ← CORRECT: "image"
      source: imageData.allImages?.[0]?.source || 'Product Image',
      allImages: imageData.allImages || []
    });
    console.log(`✓ Found real product image: ${imageData.image}`);
  } else {
    console.log('✗ No image found for:', partQuery);
  }
}
```

## Changes Made:
1. ✅ Changed `imageData.imageUrl` to `imageData.image` (2 places)
2. ✅ Fixed source extraction to use `imageData.allImages?.[0]?.source`
3. ✅ Added `allImages` array to response
4. ✅ Updated console.log to use correct field

## Testing After Fix

### Test 1: Simple Repair Question
Ask: "My toilet is running constantly"

Expected Response:
- AI should mention "Fluidmaster 502P21" or similar specific part
- Should include `REAL_PART: Fluidmaster 502P21 PerforMAX toilet flapper`
- Should display a real product photo from Google Images or direct link

### Test 2: Appliance Repair
Ask: "My Whirlpool dishwasher won't drain"

Expected Response:
- AI should mention specific part number like "W10348269"
- Should include `REAL_PART: Whirlpool W10348269 dishwasher drain pump`
- Should display actual product photograph

### Test 3: Check Console Logs
Open browser console and look for:
```
✓ Found real product image: https://...
Total part images found: 1 (or more)
```

## Verification Checklist
- [ ] Edge function updated in Supabase Dashboard
- [ ] Function deployed successfully
- [ ] Test query returns real product images
- [ ] Console shows "Found real product image" messages
- [ ] No more "No images available" warnings

## Additional Notes
- The `fetch-real-part-images` function is working correctly
- The Google Custom Search API is configured properly
- The issue is ONLY in how repair-diagnostic parses the response
- This is a simple field name mismatch - easy fix!
