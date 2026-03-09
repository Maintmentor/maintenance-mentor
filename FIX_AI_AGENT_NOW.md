# AI Agent Fix - Complete Solution

## Problem Identified
The AI agent is not working because:
1. The frontend is trying to use OpenAI directly with `import.meta.env.VITE_OPENAI_API_KEY`
2. The edge function expects the OpenAI API key in environment variables
3. There may be a mismatch in how the edge function is being called

## Solution Steps

### Step 1: Check OpenAI API Key in Supabase
```bash
# List current secrets
supabase secrets list

# If OPENAI_API_KEY is not set, add it:
supabase secrets set OPENAI_API_KEY=your-actual-openai-api-key-here
```

### Step 2: Update the Edge Function
The edge function needs to be redeployed to ensure it has the latest code:

```bash
# Deploy the repair-diagnostic function
supabase functions deploy repair-diagnostic
```

### Step 3: Test the Edge Function Directly
Test if the edge function is working:

```bash
# Get your Supabase URL and anon key from your project settings
curl -X POST https://kudlclzjfihbphehhiii.supabase.co/functions/v1/repair-diagnostic \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"question": "How do I fix a leaky faucet?"}'
```

### Step 4: Update Frontend Service
The frontend should NOT use OpenAI directly. Update `src/services/aiVisionService.ts`:

```typescript
import { supabase } from '@/lib/supabase';
import { analyzeFallback } from './fallbackAnalysisService';

export interface PartSource {
  part: string;
  retailers: string[];
  estimatedPrice: string;
  partNumber?: string;
  notes?: string;
}

export interface AIAnalysisResult {
  diagnosis: string;
  severity: 'low' | 'medium' | 'high';
  recommendations: string[];
  estimatedCost: string;
  difficulty: 'easy' | 'medium' | 'hard';
  tools: string[];
  safetyWarnings?: string[];
  partsSources?: PartSource[];
}

export const analyzeRepairImage = async (imageData: string, imageFile?: File): Promise<AIAnalysisResult> => {
  try {
    // Call the edge function instead of OpenAI directly
    const { data, error } = await supabase.functions.invoke('repair-diagnostic', {
      body: { 
        question: 'Please analyze this image and provide repair recommendations',
        images: [imageData]
      }
    });

    if (error) throw error;

    if (data && data.success) {
      return {
        diagnosis: data.answer || 'Unable to analyze image',
        severity: 'medium',
        recommendations: data.answer ? [data.answer] : ['Consult a professional'],
        estimatedCost: '$50-200',
        difficulty: 'medium',
        tools: ['Basic tools'],
        safetyWarnings: undefined,
        partsSources: data.partImages?.map((img: any) => ({
          part: img.query,
          retailers: ['HD Supply', 'Home Depot', 'Lowes'],
          estimatedPrice: '$10-50',
          partNumber: `HD-${Date.now()}`,
          notes: img.source
        }))
      };
    }

    // Fallback if edge function fails
    return await analyzeFallback(imageFile);
  } catch (error) {
    console.error('AI Vision API Error:', error);
    return await analyzeFallback(imageFile);
  }
};
```

### Step 5: Remove VITE_OPENAI_API_KEY from Frontend
1. Remove `VITE_OPENAI_API_KEY` from your `.env` file
2. Remove it from Netlify environment variables
3. The OpenAI API key should ONLY be in Supabase secrets

### Step 6: Quick Debug Checklist

#### ✅ Verify Supabase Connection
```javascript
// Run in browser console
const { data, error } = await supabase.functions.invoke('repair-diagnostic', {
  body: { question: 'test' }
});
console.log('Response:', data, 'Error:', error);
```

#### ✅ Check Network Tab
1. Open DevTools (F12)
2. Go to Network tab
3. Send a message in the chat
4. Look for `repair-diagnostic` request
5. Check the response

#### ✅ Common Error Messages and Fixes

| Error | Fix |
|-------|-----|
| "OpenAI API key not configured" | Set OPENAI_API_KEY in Supabase secrets |
| "Failed to send a request" | Redeploy edge function |
| "Request timeout" | Edge function is working but slow |
| "CORS error" | Edge function needs redeployment |

### Step 7: Emergency Fallback
If the edge function still doesn't work, the app will automatically use the fallback analysis service which provides basic functionality without AI.

## Verification
After completing these steps, test the AI agent:
1. Go to the chat interface
2. Type "How do I fix a leaky faucet?"
3. You should get a response within 10-15 seconds

## Still Not Working?
If it's still not working, check:
1. Supabase Dashboard → Edge Functions → repair-diagnostic → Logs
2. Browser console for errors
3. Network tab for failed requests

The issue is most likely:
- Missing OPENAI_API_KEY in Supabase secrets
- Edge function not deployed
- Frontend still trying to use OpenAI directly instead of edge function