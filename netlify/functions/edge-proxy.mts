import type { Context } from "@netlify/functions";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, apikey, x-client-info",
};

const SUPABASE_URL = "https://kudlclzjfihbphehhiii.supabase.co";

export default async (req: Request, context: Context) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    // Extract function name from the path
    const url = new URL(req.url);
    const pathParts = url.pathname.split("/");
    // path is /api/edge-proxy/<function-name>
    const functionName = pathParts[pathParts.length - 1];

    if (!functionName) {
      return new Response(
        JSON.stringify({ success: false, error: "Function name required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Get the Supabase anon key from env or from the request headers
    const supabaseKey =
      process.env.SUPABASE_ANON_KEY ||
      req.headers.get("apikey") ||
      req.headers.get("authorization")?.replace("Bearer ", "");

    // Forward the request to the actual Supabase edge function
    const targetUrl = `${SUPABASE_URL}/functions/v1/${functionName}`;
    const body = req.method === "POST" ? await req.text() : undefined;

    const proxyResponse = await fetch(targetUrl, {
      method: req.method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${supabaseKey}`,
        apikey: supabaseKey || "",
      },
      body,
    });

    const responseData = await proxyResponse.text();

    return new Response(responseData, {
      status: proxyResponse.status,
      headers: {
        ...corsHeaders,
        "Content-Type":
          proxyResponse.headers.get("Content-Type") || "application/json",
      },
    });
  } catch (error: any) {
    console.error("Edge proxy error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Proxy error",
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
};

export const config = {
  path: "/api/edge-proxy/*",
};
