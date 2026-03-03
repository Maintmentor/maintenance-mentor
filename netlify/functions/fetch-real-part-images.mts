import type { Context } from "@netlify/functions";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, apikey, x-client-info",
};

// Simple in-memory cache for the function lifetime
const imageCache = new Map<string, { image: string; source: string; timestamp: number }>();

async function searchProductImage(
  query: string
): Promise<{ image: string; source: string } | null> {
  // Build search URLs for major retailers
  const searchQuery = encodeURIComponent(query);

  // Try to find a product image via retailer search pages
  const retailers = [
    {
      name: "Home Depot",
      searchUrl: `https://www.homedepot.com/s/${searchQuery}`,
      imagePattern: "Home Depot Search",
    },
    {
      name: "Lowe's",
      searchUrl: `https://www.lowes.com/search?searchTerm=${searchQuery}`,
      imagePattern: "Lowe's Search",
    },
    {
      name: "Amazon",
      searchUrl: `https://www.amazon.com/s?k=${searchQuery}`,
      imagePattern: "Amazon Search",
    },
  ];

  // Return the first retailer's search URL as a link
  // (actual image scraping from these sites would require their APIs)
  return {
    image: retailers[0].searchUrl,
    source: retailers[0].name,
  };
}

export default async (req: Request, context: Context) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { query } = body;

    if (!query) {
      return new Response(
        JSON.stringify({ success: false, error: "Query parameter required" }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Check cache first
    const cached = imageCache.get(query);
    if (cached && Date.now() - cached.timestamp < 30 * 60 * 1000) {
      return new Response(
        JSON.stringify({
          success: true,
          image: cached.image,
          source: cached.source,
          cached: true,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const result = await searchProductImage(query);

    if (result) {
      // Cache the result
      imageCache.set(query, { ...result, timestamp: Date.now() });

      return new Response(
        JSON.stringify({
          success: true,
          image: result.image,
          source: result.source,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: false,
        error: "No images found",
        image: null,
        source: null,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Image fetch error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Image search failed",
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
};

export const config = {
  path: ["/api/fetch-real-part-images", "/api/fetch-real-part-images-cached"],
};
