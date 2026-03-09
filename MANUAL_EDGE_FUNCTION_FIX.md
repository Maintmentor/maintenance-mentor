# Manual Edge Function Fix Instructions

## The Problem
The AI agent is not working because the edge function needs to be updated with better error handling and the OpenAI API key needs to be properly configured.

## Manual Fix Steps

### Step 1: Set OpenAI API Key in Supabase

1. **Via Supabase CLI:**
```bash
supabase secrets set OPENAI_API_KEY=your-actual-openai-api-key-here
```

2. **Via Supabase Dashboard:**
   - Go to your Supabase project dashboard
   - Navigate to Settings → Edge Functions
   - Click on "Secrets"
   - Add a new secret:
     - Name: `OPENAI_API_KEY`
     - Value: Your OpenAI API key (starts with `sk-`)

### Step 2: Update the repair-diagnostic Edge Function

1. Go to Supabase Dashboard
2. Navigate to Edge Functions
3. Find `repair-diagnostic` function
4. Click "Edit"
5. Replace the entire content with this code:

```typescript
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

async function fetchWithTimeout(url: string, options: any, timeoutMs = 55000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('Request timeout - please try again');
    }
    throw error;
  }
}

function extractPartsFromText(text: string): string[] {
  const parts = [];
  const commonParts = [
    'flapper', 'fill valve', 'flush valve', 'wax ring', 'toilet tank',
    'faucet cartridge', 'aerator', 'washer', 'o-ring', 'gasket',
    'thermostat', 'filter', 'capacitor', 'relay', 'switch',
    'breaker', 'outlet', 'light fixture', 'ballast', 'bulb',
    'door hinge', 'door knob', 'lock', 'strike plate',
    'garbage disposal', 'drain', 'trap', 'p-trap', 'strainer'
  ];
  
  const lowerText = text.toLowerCase();
  for (const part of commonParts) {
    if (lowerText.includes(part)) {
      parts.push(part);
    }
  }
  
  return [...new Set(parts)];
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    console.log('repair-diagnostic function called');
    const { question, imageUrls, images, conversationId, userId } = await req.json();
    
    // Check for OpenAI API key
    const openaiKey = Deno.env.get('OPENAI_API_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    console.log('Environment check:', {
      hasOpenAI: !!openaiKey,
      hasSupabaseUrl: !!supabaseUrl,
      hasSupabaseKey: !!supabaseKey,
      openaiKeyPrefix: openaiKey ? openaiKey.substring(0, 7) : 'not set'
    });

    if (!openaiKey || openaiKey === 'your-openai-api-key-here') {
      console.error('OpenAI API key not configured properly');
      return new Response(JSON.stringify({
        success: false,
        error: 'AI service not configured. Please contact support.',
        answer: 'I apologize, but the AI service is not properly configured. Please ensure the OpenAI API key is set in the Supabase secrets.',
        isMaintenanceRelated: true
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    const supabase = createClient(supabaseUrl!, supabaseKey!);

    // Build messages array
    const messages = [{
      role: 'system',
      content: `You are a professional AI assistant for residential apartment maintenance. Provide concise, helpful answers.

RESPONSE RULES:
1. Begin with safety tips if relevant
2. Number each step clearly
3. Use simple, professional language
4. Identify specific parts needed with: PART: [brand] [part name] [model/number]
5. Stay concise and helpful

Examples of part identification:
- PART: Fluidmaster 400A Fill Valve
- PART: Kohler Faucet Cartridge
- PART: Honeywell Thermostat Battery

RESTRICTIONS: Only answer repair/maintenance questions. Stay friendly and helpful.`
    }];

    // Add conversation history if available
    if (conversationId) {
      const { data: history } = await supabase
        .from('messages')
        .select('content, role, images')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })
        .limit(10);

      if (history && history.length > 0) {
        for (const msg of history) {
          if (msg.role === 'user') {
            messages.push({ role: 'user', content: msg.content });
          } else if (msg.role === 'assistant') {
            messages.push({ role: 'assistant', content: msg.content });
          }
        }
      }
    }

    // Add current message with images if present
    const currentImages = images || imageUrls || [];
    if (currentImages.length > 0) {
      const content = [{ type: 'text', text: question }];
      for (const url of currentImages) {
        content.push({ type: 'image_url', image_url: { url, detail: 'high' } });
      }
      messages.push({ role: 'user', content });
    } else {
      messages.push({ role: 'user', content: question });
    }

    console.log('Calling OpenAI API with', messages.length, 'messages');
    
    // Call OpenAI API
    const response = await fetchWithTimeout('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: currentImages.length > 0 ? 'gpt-4o' : 'gpt-4',
        messages,
        temperature: 0.7,
        max_tokens: 1500
      }),
    }, 50000);

    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenAI API error:', response.status, errorData);
      
      // Check for specific error types
      if (response.status === 401) {
        return new Response(JSON.stringify({
          success: false,
          error: 'Invalid API key',
          answer: 'The OpenAI API key is invalid. Please check the configuration.',
          isMaintenanceRelated: true
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json', ...corsHeaders },
        });
      }
      
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    let answer = data.choices?.[0]?.message?.content || 'No response generated';
    console.log('AI Response received, length:', answer.length);

    // Extract parts to fetch images for
    const partMatches = [...answer.matchAll(/PART:\s*(.+?)(?:\n|$)/g)];
    const partsToFetch = new Set<string>();
    
    for (const match of partMatches) {
      partsToFetch.add(match[1].trim());
    }

    const detectedParts = extractPartsFromText(question + ' ' + answer);
    for (const part of detectedParts) {
      partsToFetch.add(part);
    }

    console.log('Parts to fetch:', Array.from(partsToFetch));

    // Fetch real part images
    const partImages = [];
    for (const partInfo of Array.from(partsToFetch).slice(0, 3)) {
      try {
        console.log('Fetching real image for:', partInfo);
        const partResponse = await fetchWithTimeout(
          `${supabaseUrl}/functions/v1/fetch-real-part-images`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${supabaseKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ query: partInfo }),
          },
          15000
        );

        if (partResponse.ok) {
          const partData = await partResponse.json();
          
          if (partData.success && partData.imageUrl) {
            console.log('Real image found:', partData.imageUrl);
            partImages.push({
              query: partInfo,
              url: partData.imageUrl,
              source: partData.source || 'Internet',
              verificationScore: partData.verificationScore,
              verificationReasoning: partData.verificationReasoning
            });
          }
        }
      } catch (partError) {
        console.error('Part image fetch error for', partInfo, ':', partError);
      }
    }

    // Clean up the answer by removing PART: markers
    answer = answer.replace(/PART:.+?(?:\n|$)/g, '').trim();

    console.log('Final response - Part images:', partImages.length);

    return new Response(JSON.stringify({
      success: true,
      isMaintenanceRelated: true,
      answer,
      generatedImage: null,
      partImages,
      stepImages: [],
      videos: [],
      topic: 'general'
    }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });

  } catch (error) {
    console.error('Function error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Request failed - please try again',
      answer: 'I apologize, but I encountered an error. Please try again or contact support if the issue persists.',
      isMaintenanceRelated: true
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
});
```

6. Click "Save" or "Deploy"

### Step 3: Test the Function

1. **In Browser Console:**
```javascript
// First, get your Supabase client (should be available in your app)
const { data, error } = await supabase.functions.invoke('repair-diagnostic', {
  body: { question: 'How do I fix a leaky faucet?' }
});
console.log('Response:', data);
console.log('Error:', error);
```

2. **Check Logs:**
   - Go to Supabase Dashboard → Edge Functions → repair-diagnostic → Logs
   - Look for any error messages

### Step 4: Common Issues and Solutions

| Issue | Solution |
|-------|----------|
| "OpenAI API key not configured" | Add OPENAI_API_KEY to Supabase secrets |
| "Invalid API key" | Check that your OpenAI API key is correct and has credits |
| "Function not found" | Deploy the function using the dashboard or CLI |
| "CORS error" | Make sure the corsHeaders are included in the function |
| "Timeout error" | The function is working but slow - this is normal for AI responses |

### Step 5: Frontend Configuration

Make sure your frontend is NOT using OpenAI directly:

1. Check `.env` file - remove `VITE_OPENAI_API_KEY`
2. Check Netlify environment variables - remove `VITE_OPENAI_API_KEY`
3. The frontend should only call the edge function, not OpenAI directly

### Step 6: Verify Everything is Working

1. Go to your app
2. Open the chat interface
3. Type: "How do I fix a leaky faucet?"
4. You should get a response within 10-15 seconds

If you still have issues:
1. Check the edge function logs in Supabase Dashboard
2. Verify your OpenAI API key has available credits
3. Make sure the edge function is deployed and active

## Need More Help?

If the AI agent is still not working after following these steps:

1. **Check OpenAI API Status:** https://status.openai.com/
2. **Verify API Key:** Log into OpenAI and check your API key and usage
3. **Test with curl:**
```bash
curl -X POST https://your-project.supabase.co/functions/v1/repair-diagnostic \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"question": "test"}'
```

The most common issue is a missing or invalid OpenAI API key in Supabase secrets!