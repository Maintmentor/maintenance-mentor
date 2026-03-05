# Edge Function Error Fix

## Error
```
FunctionsFetchError: Failed to send a request to the Edge Function
```

## Quick Fixes

### 1. Check Edge Function Deployment
```bash
# List all deployed functions
supabase functions list

# Deploy missing functions
supabase functions deploy repair-diagnostic
supabase functions deploy fetch-real-part-images
supabase functions deploy generate-repair-image
```

### 2. Verify CORS Headers in Edge Functions
All edge functions MUST include CORS headers. Check that each function has:

```typescript
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

Deno.serve(async (req) => {
  // Handle OPTIONS request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  
  // Your function logic here
  
  // Return with CORS headers
  return new Response(JSON.stringify(data), {
    headers: { 'Content-Type': 'application/json', ...corsHeaders }
  });
});
```

### 3. Check Supabase URL Configuration
Verify `src/lib/supabase.ts` has correct URL:

```typescript
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'YOUR_SUPABASE_URL';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'YOUR_ANON_KEY';
```

### 4. Test Edge Function Directly
```bash
curl -i --location --request POST \
  'https://YOUR_PROJECT.supabase.co/functions/v1/repair-diagnostic' \
  --header 'Authorization: Bearer YOUR_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{"question":"test"}'
```

### 5. Add Error Handling Wrapper
Update function calls with better error handling:

```typescript
try {
  const { data, error } = await supabase.functions.invoke('repair-diagnostic', {
    body: { question: input }
  });
  
  if (error) {
    console.error('Function error:', error);
    throw new Error(`Function error: ${error.message}`);
  }
  
  if (!data?.success) {
    throw new Error(data?.error || 'Function returned unsuccessful response');
  }
  
  // Use data
} catch (error) {
  console.error('Failed to invoke function:', error);
  toast.error('Service temporarily unavailable');
}
```

## Most Common Cause
The edge functions are not deployed. Deploy them using the CI/CD pipeline or manually.
