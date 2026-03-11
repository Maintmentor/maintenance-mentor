# Edge Function Update Required

The edge functions need to be updated manually through the Supabase CLI due to authorization requirements.

## Updated Function Code

### 1. repair-diagnostic Function

Save this code to `supabase/functions/repair-diagnostic/index.ts`:

```typescript
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { message, imageUrl } = await req.json();
    
    const apiKey = Deno.env.get('OPENAI_API_KEY');
    if (!apiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const messages = [
      {
        role: "system",
        content: "You are an expert appliance repair technician."
      },
      {
        role: "user",
        content: imageUrl 
          ? [
              { type: "text", text: message || "What's wrong with this appliance?" },
              { type: "image_url", image_url: { url: imageUrl } }
            ]
          : message
      }
    ];

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages,
        max_tokens: 1000
      })
    });

    const data = await response.json();
    const analysis = data.choices[0].message.content;

    return new Response(
      JSON.stringify({
        diagnosis: analysis,
        suggestedFixes: ["Check connections", "Test components"],
        estimatedCost: { min: 50, max: 500, currency: "USD" },
        difficulty: "medium",
        timeEstimate: "1-3 hours"
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
```

## Deployment Commands

```bash
# Navigate to your project
cd /path/to/your/project

# Deploy the function
supabase functions deploy repair-diagnostic --project-ref kudlclzjfihbphehhiii

# Verify deployment
supabase functions list --project-ref kudlclzjfihbphehhiii

# Check logs if needed
supabase functions logs repair-diagnostic --project-ref kudlclzjfihbphehhiii --tail
```

## Verification

After deployment, test the function:

```bash
curl -X POST https://kudlclzjfihbphehhiii.supabase.co/functions/v1/repair-diagnostic \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -d '{"message": "My dishwasher is not draining"}'
```

The function should now work without the "Failed to send request" error.