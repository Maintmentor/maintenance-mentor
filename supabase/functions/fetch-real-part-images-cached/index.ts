import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { query } = await req.json();
    
    if (!query) {
      throw new Error('Query parameter is required');
    }

    console.log('🔍 Searching for cached/real part images:', query);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Try cache first via image-cache-handler
    try {
      const cacheResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/image-cache-handler`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ searchQuery: query, forceRefresh: false })
      });

      if (cacheResponse.ok) {
        const cacheData = await cacheResponse.json();
        if (cacheData.success && cacheData.imageUrl) {
          console.log('✅ Cache hit:', cacheData.imageUrl);
          return new Response(JSON.stringify({
            success: true,
            image: cacheData.imageUrl,
            source: cacheData.source === 'cache' ? 'Cache (Google Images)' : 'Google Images',
            query,
            cached: true
          }), {
            headers: { 'Content-Type': 'application/json', ...corsHeaders }
          });
        }
      }
    } catch (error) {
      console.log('⚠️ Cache lookup failed, falling back to direct search:', error.message);
    }

    // Fallback to direct Google search if cache fails
    const googleApiKey = Deno.env.get('GOOGLE_API_KEY');
    const googleCseId = Deno.env.get('GOOGLE_CSE_ID');

    if (!googleApiKey || !googleCseId) {
      console.error('❌ Google API credentials not configured');
      return new Response(JSON.stringify({
        success: false,
        error: 'Image search not configured',
        image: null
      }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    const searchUrl = `https://www.googleapis.com/customsearch/v1?key=${googleApiKey}&cx=${googleCseId}&q=${encodeURIComponent(query + ' product photo')}&searchType=image&num=5`;
    const response = await fetch(searchUrl);

    if (!response.ok) {
      throw new Error('Google search failed');
    }

    const data = await response.json();

    if (data.items && data.items.length > 0) {
      // Try each result until we find one that's actually accessible
      for (const item of data.items) {
        const imageUrl = item.link;
        try {
          const headCheck = await fetch(imageUrl, {
            method: 'HEAD',
            signal: AbortSignal.timeout(5000),
          });
          if (headCheck.ok && headCheck.headers.get('content-type')?.startsWith('image')) {
            console.log('✅ Found accessible image (no cache):', imageUrl);
            return new Response(JSON.stringify({
              success: true,
              image: imageUrl,
              source: 'Google Images',
              query,
              cached: false
            }), {
              headers: { 'Content-Type': 'application/json', ...corsHeaders }
            });
          } else {
            console.log('⚠️ Image not accessible or not an image, trying next:', imageUrl);
          }
        } catch (err) {
          console.log('⚠️ Image URL validation failed, trying next:', imageUrl, err.message);
          continue;
        }
      }

      // If no validated images, return the first one as a last resort
      console.log('⚠️ No validated images, returning first result:', data.items[0].link);
      return new Response(JSON.stringify({
        success: true,
        image: data.items[0].link,
        source: 'Google Images',
        query,
        cached: false
      }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    return new Response(JSON.stringify({
      success: false,
      error: 'No images found',
      image: null
    }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });

  } catch (error: any) {
    console.error('Function error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      image: null
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
});
