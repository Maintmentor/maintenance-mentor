import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { searchQuery, forceRefresh = false } = await req.json();
    const startTime = Date.now();

    // Normalize query for cache lookup
    const normalizedQuery = searchQuery.toLowerCase().trim();
    const cacheKey = await crypto.subtle.digest(
      'SHA-256',
      new TextEncoder().encode(normalizedQuery)
    ).then(buf => Array.from(new Uint8Array(buf))
      .map(b => b.toString(16).padStart(2, '0')).join(''));

    // Check cache first (unless force refresh)
    if (!forceRefresh) {
      const { data: cached } = await supabase
        .from('image_cache')
        .select('*')
        .eq('cache_key', cacheKey)
        .eq('is_active', true)
        .gt('expires_at', new Date().toISOString())
        .single();

      if (cached) {
        // Log cache hit
        await supabase.from('image_cache_analytics').insert({
          cache_key: cacheKey,
          search_query: searchQuery,
          event_type: 'hit',
          response_time_ms: Date.now() - startTime,
          source: 'cache'
        });

        return new Response(JSON.stringify({
          success: true,
          source: 'cache',
          imageUrl: cached.cached_url,
          hitCount: cached.hit_count + 1
        }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
    }

    // Cache miss - fetch from Google API
    const googleApiKey = Deno.env.get('GOOGLE_API_KEY');
    const googleCseId = Deno.env.get('GOOGLE_CSE_ID');

    if (!googleApiKey || !googleCseId) {
      throw new Error('Google API credentials not configured');
    }

    const searchUrl = `https://www.googleapis.com/customsearch/v1?key=${googleApiKey}&cx=${googleCseId}&q=${encodeURIComponent(searchQuery)}&searchType=image&num=1`;
    const googleResponse = await fetch(searchUrl);
    const googleData = await googleResponse.json();

    if (!googleData.items?.[0]?.link) {
      throw new Error('No images found');
    }

    const imageUrl = googleData.items[0].link;

    // Download and store in Supabase
    const imageResponse = await fetch(imageUrl);
    const imageBlob = await imageResponse.blob();
    const fileName = `${cacheKey}.jpg`;
    const filePath = `cached-images/${fileName}`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('product-images')
      .upload(filePath, imageBlob, { contentType: 'image/jpeg', upsert: true });

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('product-images')
      .getPublicUrl(filePath);

    // Store in cache
    await supabase.from('image_cache').upsert({
      search_query: searchQuery,
      search_query_normalized: normalizedQuery,
      image_url: imageUrl,
      cached_url: publicUrl,
      cache_key: cacheKey,
      file_path: filePath,
      file_size: imageBlob.size,
      mime_type: 'image/jpeg',
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    });

    // Log analytics
    await supabase.from('image_cache_analytics').insert({
      cache_key: cacheKey,
      search_query: searchQuery,
      event_type: forceRefresh ? 'refresh' : 'miss',
      response_time_ms: Date.now() - startTime,
      source: 'google_api'
    });

    return new Response(JSON.stringify({
      success: true,
      source: 'google_api',
      imageUrl: publicUrl,
      cached: true
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
