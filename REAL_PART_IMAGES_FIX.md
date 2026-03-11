# Real Part Images - Manual Edge Function Update Required

## Status
✅ **fetch-real-part-images** - Successfully updated (accepts 'query' parameter)
⚠️ **repair-diagnostic** - Needs manual update (network error)

## Issue
The AI assistant is not consistently providing real product photographs because the system prompt in the `repair-diagnostic` edge function is not strong enough to force the AI to include REAL_PART commands.

## Solution
Manually update the `repair-diagnostic` edge function in Supabase Dashboard with a strengthened system prompt.

## Manual Update Instructions

### Step 1: Access Supabase Dashboard
1. Go to https://supabase.com/dashboard
2. Select your project
3. Navigate to **Edge Functions** in the left sidebar
4. Find and click on **repair-diagnostic**

### Step 2: Update the System Prompt
Find the `systemPrompt` variable (around line 23) and replace it with this STRENGTHENED version:

```typescript
const systemPrompt = `You are an expert apartment maintenance advisor. Your PRIMARY MISSION is to identify REAL, PURCHASABLE parts with EXACT part numbers.

🚨 CRITICAL RULES - YOU MUST FOLLOW THESE:

1. EVERY SINGLE RESPONSE must include AT LEAST ONE "REAL_PART:" command
2. Use REAL part numbers that exist and can be searched on Google/Amazon/Home Depot
3. Be SPECIFIC - include brand names, model numbers, and exact part numbers
4. Use parts from major brands: Whirlpool, GE, Moen, Delta, Kohler, Fluidmaster, InSinkErator, etc.

MANDATORY FORMAT:
REAL_PART: [Brand] [Part Number] [Product Description]

✅ PERFECT EXAMPLES:

Q: "Toilet running"
A: "Your toilet flapper is worn out and needs replacement. I recommend the Fluidmaster 502P21 PerforMAX universal flapper.
REAL_PART: Fluidmaster 502P21 PerforMAX toilet flapper
This 2-inch flapper fits 98% of toilets and is available at any hardware store for about $8."

Q: "Dishwasher not draining"
A: "The drain pump has likely failed. For Whirlpool dishwashers, you need part W10348269.
REAL_PART: Whirlpool W10348269 dishwasher drain pump assembly
This OEM pump fits models manufactured 2015-2024. Cost is around $45-60."

Q: "Kitchen faucet dripping"
A: "Replace the cartridge. For Delta single-handle faucets, use the RP50587.
REAL_PART: Delta RP50587 single handle cartridge
For Moen faucets, use the 1224 cartridge.
REAL_PART: Moen 1224 replacement cartridge
Identify your faucet brand first - it's usually stamped on the base."

🚫 NEVER DO THIS:
- Generic answers without part numbers
- Made-up part numbers
- Vague descriptions like "replace the part"
- Responses without at least one REAL_PART command

✅ ALWAYS DO THIS:
- Include specific, searchable part numbers
- Use real brands that exist
- Provide model numbers when possible
- Include at least ONE REAL_PART command in EVERY response
- Make parts easy to find on Google, Amazon, or Home Depot

REMEMBER: Your job is to help people find and buy the EXACT parts they need. Be specific!`;
```

### Step 3: Add Better Logging
After the OpenAI API call (around line 140), add this logging:

```typescript
console.log('AI Response received, extracting REAL_PART commands...');
```

And after extracting part images (around line 170):

```typescript
if (partImages.length === 0) {
  console.warn('⚠️ WARNING: AI did not provide any REAL_PART commands. Prompt may need strengthening.');
} else {
  console.log(`✓ Successfully fetched ${partImages.length} real product images`);
}
```

### Step 4: Deploy
Click **Deploy** button in the Supabase Dashboard

## Testing After Update

### Test 1: Image Test Page
1. Navigate to `/image-test` in your browser
2. Test query: "Fluidmaster 502P21 toilet flapper"
3. Should see real product image from Google

### Test 2: Chat Interface
1. Go to `/dashboard`
2. Start new conversation
3. Ask: "My toilet keeps running"
4. Expected: AI response includes REAL_PART command
5. Expected: Real product photo of Fluidmaster flapper appears

### Test 3: Console Logs
Open browser console and check for:
```
✓ Calling repair-diagnostic function...
✓ AI Response received, extracting REAL_PART commands...
✓ Fetching real product image for: Fluidmaster 502P21...
✓ Found real product image from Google Images
✓ Successfully fetched 1 real product images
```

## What Changed

### fetch-real-part-images (✅ Updated)
- Now accepts `query` parameter (single string)
- Better Google API integration
- Improved error logging
- Part number extraction from query strings

### repair-diagnostic (⚠️ Needs Manual Update)
- **Strengthened system prompt** with mandatory REAL_PART requirements
- Added emojis and formatting to make rules more visible
- More specific examples with real part numbers
- Explicit "NEVER/ALWAYS" rules
- Better logging for debugging

## Why This Fixes The Issue

The original prompt was too weak - it suggested using REAL_PART but didn't enforce it. The new prompt:

1. **Uses strong language**: "CRITICAL RULES", "MUST FOLLOW", "EVERY SINGLE RESPONSE"
2. **Makes it mandatory**: "AT LEAST ONE REAL_PART command"
3. **Provides clear examples**: Shows exactly what good responses look like
4. **Uses visual markers**: Emojis (🚨, ✅, 🚫) make rules stand out
5. **Emphasizes specificity**: Repeatedly stresses using real, searchable part numbers

## Verification

After manual update, the AI should:
- ✅ Always include REAL_PART commands
- ✅ Use specific part numbers (W10348269, RP50587, etc.)
- ✅ Include brand names (Whirlpool, Moen, Delta, etc.)
- ✅ Trigger real product image fetching
- ✅ Display actual photos from Google Images

## Support

If issues persist after manual update:
1. Check Supabase Edge Function logs
2. Verify GOOGLE_API_KEY and GOOGLE_CSE_ID are set
3. Test image fetching directly at `/image-test`
4. Check browser console for detailed error messages
