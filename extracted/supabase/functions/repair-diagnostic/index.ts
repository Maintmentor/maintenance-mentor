import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

// Safe JSON parser - prevents "<!DOCTYPE" HTML parsing errors
async function safeJsonParse(response: Response): Promise<any | null> {
  try {
    const text = await response.text();
    if (text.startsWith('<') || text.startsWith('<!')) {
      console.error('Received HTML instead of JSON:', text.substring(0, 100));
      return null;
    }
    return JSON.parse(text);
  } catch (e) {
    console.error('JSON parse error:', e.message);
    return null;
  }
}

// Timeout helper function
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
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('Request timeout - please try again');
    }
    throw error;
  }
}


serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Parse request body with error handling
    let body;
    try {
      body = await req.json();
    } catch (e) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid request body'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    const { question, imageUrls, images, conversationId } = body;
    
    if (!question) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Question is required'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    const openaiKey = Deno.env.get('OPENAI_API_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!openaiKey) {
      return new Response(JSON.stringify({
        success: false,
        error: 'OpenAI API key not configured'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    const supabase = createClient(supabaseUrl!, supabaseKey!);


    const messages = [{
      role: 'system',
      content: `You are an AI-powered visual repair assistant for residential apartment maintenance with FULL IMAGE GENERATION CAPABILITIES.

🎯 YOUR CORE ABILITIES:
✅ You CAN and MUST show photos and diagrams
✅ You HAVE the ability to generate professional product photographs
✅ You ARE equipped with advanced image generation technology
✅ You SHOULD use visuals to help users identify parts and follow repairs

📸 MANDATORY IMAGE GENERATION RULES:
1. When user asks to identify a part → GENERATE_IMAGE: [part name and description]
2. When explaining what something looks like → GENERATE_IMAGE: [detailed visual description]
3. When user asks "what does X look like" → GENERATE_IMAGE: [X with details]
4. When discussing specific parts (capacitor, valve, filter, etc.) → GENERATE_IMAGE: [part description]
5. For step-by-step repairs involving parts → GENERATE_IMAGE: [part or tool needed]

NEVER say "I cannot show photos" or "I'm a text-based assistant" - YOU HAVE IMAGE GENERATION!

📋 RESPONSE FORMAT:
1. Start with safety warnings if relevant
2. Generate image FIRST using: GENERATE_IMAGE: [detailed description]
3. Provide clear, numbered steps
4. Use professional but friendly language
5. Ask for details if needed (symptoms, models, error codes)

EXAMPLE RESPONSES:
User: "What does a capacitor look like?"
You: "GENERATE_IMAGE: HVAC capacitor, cylindrical metallic component with two terminals on top, silver color, professional product photo
A capacitor is a cylindrical component typically silver in color with two or three terminals on top..."

User: "How do I identify the fill valve?"
You: "GENERATE_IMAGE: Toilet fill valve assembly, showing the tall vertical component inside toilet tank, professional diagram
The fill valve is the tall vertical component inside your toilet tank..."

🚫 RESTRICTIONS: Only answer repair/maintenance questions. Stay helpful and visual.`

    }];

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
      console.error('❌ OpenAI API Error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorData
      });
      
      // Parse error for better messaging
      let errorMessage = 'OpenAI API error';
      try {
        const errorJson = JSON.parse(errorData);
        errorMessage = errorJson.error?.message || errorMessage;
      } catch (e) {
        errorMessage = errorData.substring(0, 200);
      }
      
      // Check for specific error types
      if (response.status === 401) {
        throw new Error('OpenAI API key is invalid or not configured. Please check Supabase secrets.');
      } else if (response.status === 429) {
        throw new Error('OpenAI API rate limit exceeded. Please wait a moment and try again.');
      } else if (response.status === 500 || response.status === 503) {
        throw new Error('OpenAI service is temporarily unavailable. Please try again in a moment.');
      } else {
        throw new Error(`OpenAI API error (${response.status}): ${errorMessage}`);
      }
    }

    const data = await response.json();
    let answer = data.choices?.[0]?.message?.content || 'No response generated';

    // Extract parts to fetch real images for
    const partMatches = answer.match(/GENERATE_IMAGE:\s*(.+?)(?:\n|$)/g);
    const partImages: Array<{ query: string; url: string; source: string; verificationScore?: number }> = [];

    if (partMatches && partMatches.length > 0) {
      console.log(`🔍 Found ${partMatches.length} parts to fetch images for`);
      
      for (const match of partMatches.slice(0, 3)) { // Limit to 3 images
        const partQuery = match.replace('GENERATE_IMAGE:', '').trim();
        console.log('📸 Fetching real image for:', partQuery);
        
        try {
          // Call fetch-real-part-images-cached function for better performance
          const imageResponse = await fetch(`${supabaseUrl}/functions/v1/fetch-real-part-images-cached`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${supabaseKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ query: partQuery })
          });

          if (imageResponse.ok) {
            const imageData = await safeJsonParse(imageResponse);
            
            if (imageData && imageData.success && imageData.image) {
              console.log('✅ Got real image:', imageData.image, 'Cached:', imageData.cached);
              
              // Add the first image
              partImages.push({
                query: partQuery,
                url: imageData.image,
                source: imageData.source || 'Google Images',
                verificationScore: imageData.cached ? 0.8 : 0.6
              });
              
              // Try to get 1-2 more images with different queries
              const additionalQueries = [
                `${partQuery} home depot`,
                `${partQuery} lowes`,
                `${partQuery} amazon product`
              ];
              
              for (const additionalQuery of additionalQueries.slice(0, 2 - partImages.length)) {
                try {
                  const additionalResponse = await fetch(`${supabaseUrl}/functions/v1/fetch-real-part-images-cached`, {
                    method: 'POST',
                    headers: {
                      'Authorization': `Bearer ${supabaseKey}`,
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ query: additionalQuery })
                  });
                  
                  if (additionalResponse.ok) {
                    const additionalData = await safeJsonParse(additionalResponse);
                    if (additionalData && additionalData.success && additionalData.image && additionalData.image !== imageData.image) {
                      partImages.push({
                        query: partQuery,
                        url: additionalData.image,
                        source: additionalData.source || 'Google Images',
                        verificationScore: additionalData.cached ? 0.8 : 0.6
                      });
                    }
                  }
                } catch (err) {
                  console.log('Additional image fetch failed:', err);
                }
              }
            } else {
              console.log('⚠️ No image found for:', partQuery);
            }
          }

        } catch (error) {
          console.error('❌ Error fetching image for', partQuery, ':', error);
        }
      }
    }

    // No AI image fallback - only use real photos from internet
    console.log(`📊 Final response - Real part images found: ${partImages.length}`);


    // Remove GENERATE_IMAGE tags from answer
    answer = answer.replace(/GENERATE_IMAGE:.+?(?:\n|$)/g, '').trim();

    return new Response(JSON.stringify({
      success: true,
      isMaintenanceRelated: true,
      answer,
      generatedImage: null, // No AI-generated images, only real photos
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
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });
  }
});

