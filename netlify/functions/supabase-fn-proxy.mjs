// Netlify Function that proxies requests to Supabase Edge Functions.
// This eliminates CORS issues and "Failed to send to edge function" errors
// by making the calls server-side instead of from the browser.

const SUPABASE_URL = process.env.SUPABASE_URL || "https://kudlclzjfihbphehhiii.supabase.co";
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

export default async function handler(req, context) {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "content-type, authorization, x-client-info, apikey, x-function-name",
      },
    });
  }

  const functionName = req.headers.get("x-function-name");
  if (!functionName) {
    return Response.json({ success: false, error: "Missing x-function-name header" }, { status: 400 });
  }

  // Only allow known function names to prevent abuse
  const allowedFunctions = [
    "repair-diagnostic",
    "fetch-real-part-images",
    "fetch-real-part-images-cached",
    "image-cache-handler",
    "generate-repair-image",
    "edge-function-deployment-manager",
    "translation-service",
    "validate-api-key",
  ];

  if (!allowedFunctions.includes(functionName)) {
    return Response.json({ success: false, error: "Function not allowed" }, { status: 403 });
  }

  const targetUrl = `${SUPABASE_URL}/functions/v1/${functionName}`;

  // Forward the authorization header from the client, or use the service role key
  const clientAuth = req.headers.get("authorization");
  const authHeader = clientAuth || (SUPABASE_SERVICE_ROLE_KEY ? `Bearer ${SUPABASE_SERVICE_ROLE_KEY}` : null);

  const headers = {
    "Content-Type": "application/json",
  };

  if (authHeader) {
    headers["Authorization"] = authHeader;
  }

  // Forward apikey header if present, otherwise use the anon key
  const clientApiKey = req.headers.get("apikey");
  if (clientApiKey) {
    headers["apikey"] = clientApiKey;
  } else if (SUPABASE_ANON_KEY) {
    headers["apikey"] = SUPABASE_ANON_KEY;
  }

  // Forward x-client-info if present
  const clientInfo = req.headers.get("x-client-info");
  if (clientInfo) {
    headers["x-client-info"] = clientInfo;
  }

  try {
    let body;
    try {
      body = await req.text();
    } catch {
      body = null;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 55000);

    const response = await fetch(targetUrl, {
      method: req.method,
      headers,
      body: body || undefined,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const responseBody = await response.text();

    return new Response(responseBody, {
      status: response.status,
      headers: {
        "Content-Type": response.headers.get("Content-Type") || "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error) {
    console.error("Supabase proxy error:", error.message);

    const isTimeout = error.name === "AbortError";
    const statusCode = isTimeout ? 504 : 502;
    const errorMessage = isTimeout
      ? "The request to the AI service timed out. Please try again."
      : "Unable to reach the AI service. Please try again in a moment.";

    return Response.json(
      { success: false, error: errorMessage },
      {
        status: statusCode,
        headers: { "Access-Control-Allow-Origin": "*" },
      }
    );
  }
}
