// Netlify Function that handles the AI chat for repair diagnostics.
// Replaces the broken Supabase edge function by calling the Anthropic API directly.

const SUPABASE_URL =
  process.env.SUPABASE_URL || "https://kudlclzjfihbphehhiii.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
const ANTHROPIC_BASE_URL = process.env.ANTHROPIC_BASE_URL || "https://api.anthropic.com/v1/";

// Netlify AI Gateway only works via the .netlify.app domain.
// If the base URL uses a custom domain, rewrite it to the .netlify.app domain.
const SITE_ID = process.env.SITE_ID || "c377b852-9dd0-41b9-ac74-3feca1bc56c0";
function getAnthropicEndpoint() {
  // If the base URL already contains .netlify.app or api.anthropic.com, use it directly
  if (ANTHROPIC_BASE_URL.includes(".netlify.app") || ANTHROPIC_BASE_URL.includes("api.anthropic.com")) {
    const base = ANTHROPIC_BASE_URL.endsWith("/") ? ANTHROPIC_BASE_URL : ANTHROPIC_BASE_URL + "/";
    const needsV1 = !base.includes("/v1");
    return needsV1 ? `${base}v1/messages` : `${base}messages`;
  }
  // Otherwise, construct the URL from the site ID
  return `https://${SITE_ID}.netlify.app/.netlify/ai/v1/messages`;
}

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

async function loadConversationHistory(conversationId) {
  if (!conversationId || !SUPABASE_SERVICE_ROLE_KEY) return [];

  try {
    const url = new URL(`${SUPABASE_URL}/rest/v1/messages`);
    url.searchParams.set(
      "select",
      "content,role,images"
    );
    url.searchParams.set("conversation_id", `eq.${conversationId}`);
    url.searchParams.set("order", "created_at.asc");
    url.searchParams.set("limit", "10");

    const resp = await fetch(url.toString(), {
      headers: {
        apikey: SUPABASE_SERVICE_ROLE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      },
    });

    if (!resp.ok) return [];
    return await resp.json();
  } catch {
    return [];
  }
}

async function fetchPartImage(query) {
  if (!SUPABASE_SERVICE_ROLE_KEY) return null;

  try {
    const resp = await fetch(
      `${SUPABASE_URL}/functions/v1/fetch-real-part-images-cached`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
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

    if (!ANTHROPIC_API_KEY) {
      return Response.json(
        { success: false, error: "AI API key not configured" },
        { status: 500, headers: CORS_HEADERS }
      );
    }

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

    // Call Anthropic API
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 55000);

    const anthropicEndpoint = getAnthropicEndpoint();

    const response = await fetch(anthropicEndpoint, {
      method: "POST",
      headers: {
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
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
      { headers: { "Content-Type": "application/json", ...CORS_HEADERS } }
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
