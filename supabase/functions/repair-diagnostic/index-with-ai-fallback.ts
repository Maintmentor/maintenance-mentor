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

async function generateAIImage(prompt: string, openaiKey: string): Promise<string | null> {
  try {
    console.log('🎨 Generating AI image for:', prompt);
    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'dall-e-3',
        prompt: `Professional product photograph: ${prompt}, white background, detailed, realistic, high quality`,
        n: 1,
        size: '1024x1024',
        quality: 'standard'
      }),
    });

    if (!response.ok) {
      console.error('DALL-E error:', await response.text());
      return null;
    }

    const data = await response.json();
    const imageUrl = data.data?.[0]?.url;
    if (imageUrl) {
      console.log('✅ AI image generated successfully');
      return imageUrl;
    }
    return null;
  } catch (error) {
    console.error('AI image generation error:', error);
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
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
    const googleApiKey = Deno.env.get('GOOGLE_API_KEY');
    const googleCseId = Deno.env.get('GOOGLE_CSE_ID');

    if (!openaiKey) {
      return new Response(JSON.stringify({
        success: false,
        error: 'OpenAI API key not configured'
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    const hasGoogleSearch = googleApiKey && googleCseId;
    console.log(hasGoogleSearch ? '🌐 Google API configured - will use real photos' : '🎨 Google API not configured - using AI images');

    const supabase = createClient(supabaseUrl!, supabaseKey!);

    const messages = [{
      role: 'system',
      content: `You are an AI repair assistant with IMAGE GENERATION capabilities.

CRITICAL: When users ask about parts or repairs, ALWAYS use GENERATE_IMAGE tags!

Format: GENERATE_IMAGE: [detailed part description]

Examples:
- User: "What does a capacitor look like?"
  You: "GENERATE_IMAGE: HVAC capacitor cylindrical silver component
  A capacitor is a cylindrical component..."

- User: "Show me a fill valve"
  You: "GENERATE_IMAGE: toilet fill valve assembly
  The fill valve is located..."

ALWAYS include GENERATE_IMAGE when discussing specific parts!`
    }];

    if (conversationId) {
      const { data: history } = await supabase
        .from('messages')
        .select('content, role')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })
        .limit(10);

      if (history) {
        for (const msg of history) {
          messages.push({ role: msg.role === 'user' ? 'user' : 'assistant', content: msg.content });
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
      throw new Error(`OpenAI error: ${response.status}`);
    }

    const data = await response.json();
    let answer = data.choices?.[0]?.message?.content || 'No response';

    const partMatches = answer.match(/GENERATE_IMAGE:\s*(.+?)(?:\n|$)/g);
    const partImages: Array<{ query: string; url: string; source: string }> = [];
    let generatedImage: string | null = null;

    if (partMatches && partMatches.length > 0) {
      console.log(`🔍 Found ${partMatches.length} image requests`);
      
      for (const match of partMatches.slice(0, 2)) {
        const partQuery = match.replace('GENERATE_IMAGE:', '').trim();
        
        if (hasGoogleSearch) {
          try {
            const imgResp = await fetch(`${supabaseUrl}/functions/v1/fetch-real-part-images`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${supabaseKey}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ query: partQuery })
            });

            if (imgResp.ok) {
              const imgData = await imgResp.json();
              if (imgData.success && imgData.image) {
                partImages.push({
                  query: partQuery,
                  url: imgData.image,
                  source: 'Google Images'
                });
                continue;
              }
            }
          } catch (e) {
            console.error('Google search failed:', e);
          }
        }
        
        if (!generatedImage) {
          generatedImage = await generateAIImage(partQuery, openaiKey);
        }
      }
    }

    console.log(`✅ Images: ${partImages.length} real, ${generatedImage ? '1 AI' : '0 AI'}`);

    answer = answer.replace(/GENERATE_IMAGE:.+?(?:\n|$)/g, '').trim();

    return new Response(JSON.stringify({
      success: true,
      answer,
      generatedImage,
      partImages
    }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });

  } catch (error) {
    console.error('Error:', error);
    return new Response(JSON.stringify({
      success: false,
      error: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
});
