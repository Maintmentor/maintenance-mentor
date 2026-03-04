// Netlify Function that handles the AI chat for repair diagnostics.
// Uses the Netlify AI Gateway for Anthropic API access (zero-config).

const SUPABASE_URL = "https://kudlclzjfihbphehhiii.supabase.co";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "content-type, authorization, x-client-info, apikey",
};

const SYSTEM_PROMPT = `You are an AI-powered visual repair assistant for residential apartment maintenance.

YOUR CORE ABILITIES:
- You help maintenance techs and property managers diagnose and fix issues
- You provide clear, numbered step-by-step repair instructions
- You can identify parts from descriptions
- You give safety warnings when relevant

RESPONSE FORMAT:
1. Start with safety warnings if relevant
2. If the user asks about a specific part, use: GENERATE_IMAGE: [detailed description of the part]
3. Provide clear, numbered steps
4. Use professional but friendly language
5. Ask for details if needed (symptoms, models, error codes)

RESTRICTIONS: Only answer repair/maintenance questions. Stay helpful and practical.`;

// Resolve the Anthropic API endpoint and key at invocation time.
// Netlify AI Gateway injects ANTHROPIC_API_KEY and ANTHROPIC_BASE_URL at runtime.
// We also support NETLIFY_AI_GATEWAY_KEY / NETLIFY_AI_GATEWAY_BASE_URL as fallback.
function getApiConfig() {
  const anthropicKey = process.env.ANTHROPIC_API_KEY;
  const anthropicBase = process.env.ANTHROPIC_BASE_URL;
  const gatewayKey = process.env.NETLIFY_AI_GATEWAY_KEY;
  const gatewayBase = process.env.NETLIFY_AI_GATEWAY_BASE_URL;

  // Prefer ANTHROPIC_* env vars (set by Netlify AI Gateway or manually)
  if (anthropicKey && anthropicBase) {
    const base = anthropicBase.endsWith("/") ? anthropicBase : anthropicBase + "/";
    const endpoint = base.includes("/v1") ? `${base}messages` : `${base}v1/messages`;
    return {
      endpoint,
      headers: {
        "x-api-key": anthropicKey,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
    };
  }

  // Fallback: use the generic Netlify AI Gateway endpoint
  if (gatewayKey && gatewayBase) {
    const base = gatewayBase.endsWith("/") ? gatewayBase : gatewayBase + "/";
    return {
      endpoint: `${base}anthropic/v1/messages`,
      headers: {
        Authorization: `Bearer ${gatewayKey}`,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
    };
  }

  // Last resort: construct the gateway URL from the site ID
  if (anthropicBase) {
    // We have the base URL but no key — the gateway might still accept keyless requests
    const base = anthropicBase.endsWith("/") ? anthropicBase : anthropicBase + "/";
    const endpoint = base.includes("/v1") ? `${base}messages` : `${base}v1/messages`;
    return {
      endpoint,
      headers: {
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
    };
  }

  if (anthropicKey) {
    // We have a key but no custom base URL — use the direct Anthropic API
    return {
      endpoint: "https://api.anthropic.com/v1/messages",
      headers: {
        "x-api-key": anthropicKey,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
    };
  }

  return null;
}

async function loadConversationHistory(conversationId) {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!conversationId || !serviceRoleKey) return [];

  try {
    const url = new URL(`${SUPABASE_URL}/rest/v1/messages`);
    url.searchParams.set("select", "content,role,images");
    url.searchParams.set("conversation_id", `eq.${conversationId}`);
    url.searchParams.set("order", "created_at.asc");
    url.searchParams.set("limit", "10");

    const resp = await fetch(url.toString(), {
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
      },
    });

    if (!resp.ok) return [];
    return await resp.json();
  } catch {
    return [];
  }
}

async function fetchPartImage(query) {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) return null;

  try {
    const resp = await fetch(
      `${SUPABASE_URL}/functions/v1/fetch-real-part-images-cached`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${serviceRoleKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query }),
      }
    );

    if (!resp.ok) return null;
    const data = await resp.json();
    if (data.success && data.image) {
      return {
        query,
        url: data.image,
        source: data.source || "Google Images",
      };
    }
  } catch {
    // Ignore image fetch errors
  }
  return null;
}

export default async function handler(req) {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS_HEADERS });
  }

  try {
    let body;
    try {
      body = await req.json();
    } catch {
      return Response.json(
        { success: false, error: "Invalid request body" },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    const { question, conversationId, images } = body;

    if (!question) {
      return Response.json(
        { success: false, error: "Question is required" },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    // Resolve API configuration at invocation time
    const apiConfig = getApiConfig();

    if (!apiConfig) {
      console.error("AI config missing. Available env vars:", {
        hasAnthropicKey: !!process.env.ANTHROPIC_API_KEY,
        hasAnthropicBase: !!process.env.ANTHROPIC_BASE_URL,
        hasGatewayKey: !!process.env.NETLIFY_AI_GATEWAY_KEY,
        hasGatewayBase: !!process.env.NETLIFY_AI_GATEWAY_BASE_URL,
      });
      return Response.json(
        { success: false, error: "AI service is not configured. Please check environment variables." },
        { status: 500, headers: CORS_HEADERS }
      );
    }

    console.log("Using AI endpoint:", apiConfig.endpoint);

    // Build messages array for Anthropic
    const messages = [];

    // Load conversation history
    const history = await loadConversationHistory(conversationId);
    for (const msg of history) {
      if (msg.role === "user") {
        messages.push({ role: "user", content: msg.content });
      } else if (msg.role === "assistant") {
        messages.push({ role: "assistant", content: msg.content });
      }
    }

    // Add the current user message
    const currentImages = images || [];
    if (currentImages.length > 0) {
      const content = [{ type: "text", text: question }];
      for (const url of currentImages) {
        content.push({
          type: "image",
          source: { type: "url", url },
        });
      }
      messages.push({ role: "user", content });
    } else {
      messages.push({ role: "user", content: question });
    }

    // Call Anthropic API via the resolved endpoint
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 55000);

    const response = await fetch(apiConfig.endpoint, {
      method: "POST",
      headers: apiConfig.headers,
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1500,
        system: SYSTEM_PROMPT,
        messages,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Anthropic API error:", response.status, errorText);

      if (response.status === 401) {
        throw new Error("AI API key is invalid.");
      } else if (response.status === 429) {
        throw new Error(
          "AI rate limit exceeded. Please wait a moment and try again."
        );
      } else {
        throw new Error(`AI service error (${response.status})`);
      }
    }

    const data = await response.json();
    let answer =
      data.content && data.content.length > 0
        ? data.content
            .filter((block) => block.type === "text")
            .map((block) => block.text)
            .join("\n")
        : "No response generated";

    // Extract part image requests
    const partMatches = answer.match(/GENERATE_IMAGE:\s*(.+?)(?:\n|$)/g);
    const partImages = [];

    if (partMatches && partMatches.length > 0) {
      const imagePromises = partMatches.slice(0, 3).map((match) => {
        const partQuery = match.replace("GENERATE_IMAGE:", "").trim();
        return fetchPartImage(partQuery);
      });

      const results = await Promise.all(imagePromises);
      for (const result of results) {
        if (result) partImages.push(result);
      }
    }

    // Clean GENERATE_IMAGE tags from the answer
    answer = answer.replace(/GENERATE_IMAGE:.+?(?:\n|$)/g, "").trim();

    return Response.json(
      {
        success: true,
        isMaintenanceRelated: true,
        answer,
        generatedImage: null,
        partImages,
        stepImages: [],
        videos: [],
        topic: "general",
      },
      { headers: CORS_HEADERS }
    );
  } catch (error) {
    console.error("repair-diagnostic error:", error.message);

    const isTimeout = error.name === "AbortError";
    const statusCode = isTimeout ? 504 : 500;
    const errorMessage = isTimeout
      ? "The request timed out. Please try again."
      : error.message || "Request failed - please try again";

    return Response.json(
      { success: false, error: errorMessage },
      { status: statusCode, headers: CORS_HEADERS }
    );
  }
}
