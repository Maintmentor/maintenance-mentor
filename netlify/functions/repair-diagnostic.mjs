// Netlify Function to proxy repair-diagnostic calls to Supabase Edge Function
// This handles the /api/repair-diagnostic route defined in _redirects

const SUPABASE_URL = "https://kudlclzjfihbphehhiii.supabase.co";

export default async (request) => {
  // Handle CORS preflight
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization, apikey",
      },
    });
  }

  if (request.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const body = await request.text();
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

    if (!supabaseAnonKey) {
      return new Response(
        JSON.stringify({ error: "Server configuration error: missing Supabase key" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Forward the authorization header if present, otherwise use the anon key
    const authHeader = request.headers.get("Authorization") || `Bearer ${supabaseAnonKey}`;

    const response = await fetch(`${SUPABASE_URL}/functions/v1/repair-diagnostic`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": authHeader,
        "apikey": supabaseAnonKey,
      },
      body,
    });

    const data = await response.text();

    return new Response(data, {
      status: response.status,
      headers: {
        "Content-Type": response.headers.get("content-type") || "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "Failed to reach repair diagnostic service", details: err.message }),
      {
        status: 502,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
