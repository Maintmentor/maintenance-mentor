// Netlify Function to proxy external images and bypass CORS/hotlink restrictions
// This resolves "Unable to load image directly" errors when loading part images

export default async (request) => {
  // Handle CORS preflight
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  }

  const url = new URL(request.url);
  const imageUrl = url.searchParams.get("url");

  if (!imageUrl) {
    return new Response(JSON.stringify({ error: "Missing 'url' parameter" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Validate the URL
  let parsedUrl;
  try {
    parsedUrl = new URL(imageUrl);
  } catch {
    return new Response(JSON.stringify({ error: "Invalid URL" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Only allow HTTPS image URLs
  if (parsedUrl.protocol !== "https:") {
    return new Response(JSON.stringify({ error: "Only HTTPS URLs are allowed" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const response = await fetch(imageUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; MaintenanceMentor/1.0)",
        "Accept": "image/webp,image/avif,image/apng,image/svg+xml,image/*,*/*;q=0.8",
        "Referer": parsedUrl.origin,
      },
    });

    if (!response.ok) {
      return new Response(
        JSON.stringify({ error: `Image fetch failed with status ${response.status}` }),
        {
          status: response.status,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const contentType = response.headers.get("content-type") || "image/jpeg";

    // Verify it's actually an image
    if (!contentType.startsWith("image/")) {
      return new Response(
        JSON.stringify({ error: "URL did not return an image" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const imageData = await response.arrayBuffer();

    return new Response(imageData, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400, s-maxage=86400",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "Failed to fetch image", details: err.message }),
      {
        status: 502,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
