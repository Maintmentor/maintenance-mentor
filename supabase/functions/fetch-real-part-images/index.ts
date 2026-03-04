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

    console.log('🔍 Searching for real part images:', query);

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

    // Search Google Custom Search API
    const searchQueries = [
      `${query} product photo`,
      `${query} part`,
      query
    ];

    for (const searchQuery of searchQueries) {
      try {
        const searchUrl = `https://www.googleapis.com/customsearch/v1?key=${googleApiKey}&cx=${googleCseId}&q=${encodeURIComponent(searchQuery)}&searchType=image&num=5&imgSize=medium&safe=active`;

        console.log('🌐 Searching:', searchQuery);
        const response = await fetch(searchUrl);

        if (!response.ok) {
          console.error('Search API error:', response.status);
          continue;
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
                console.log('✅ Found accessible image:', imageUrl);
                return new Response(JSON.stringify({
                  success: true,
                  image: imageUrl,
                  source: 'Google Images',
                  query: searchQuery
                }), {
                  headers: { 'Content-Type': 'application/json', ...corsHeaders }
                });
              } else {
                console.log('⚠️ Image not accessible, trying next:', imageUrl);
              }
            } catch (err) {
              console.log('⚠️ Image validation failed, trying next:', imageUrl);
              continue;
            }
          }
        }
      } catch (error) {
        console.error('Search error:', error);
        continue;
      }
    }

    // No images found
    console.log('⚠️ No images found for:', query);
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
