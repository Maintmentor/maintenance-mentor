import type { Context } from "@netlify/functions";
import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic();

const SYSTEM_PROMPT = `You are an expert maintenance and repair assistant called "Maintenance Mentor". You help maintenance technicians and property managers diagnose and fix issues with:
- HVAC systems (heating, ventilation, air conditioning)
- Plumbing (water heaters, pipes, faucets, toilets, drains)
- Electrical systems (outlets, switches, breakers, wiring)
- Appliances (refrigerators, washers, dryers, dishwashers, ovens)
- General building maintenance (doors, windows, locks, drywall, painting)
- Fire safety equipment (smoke detectors, fire extinguishers, sprinklers)

When answering:
1. First identify the likely problem based on the description and any images provided
2. Provide clear step-by-step troubleshooting instructions
3. List safety precautions when applicable
4. Recommend specific replacement parts with model numbers when possible
5. Indicate when a licensed professional should be called
6. Include estimated difficulty level (Easy/Medium/Hard/Professional Only)
7. Provide estimated time to complete the repair

If images are provided, analyze them to help identify the issue, the equipment model, and visible damage or wear.

Format your responses with clear headings, numbered steps, and bullet points for readability.`;

export default async (req: Request, context: Context) => {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers":
      "Content-Type, Authorization, apikey, x-client-info",
  };

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const {
      question,
      message,
      userId,
      conversationId,
      images,
      conversationHistory,
    } = body;

    const userQuestion = question || message || "Hello";

    // Build messages array
    const messages: Anthropic.MessageParam[] = [];

    // Add conversation history if provided
    if (conversationHistory && Array.isArray(conversationHistory)) {
      for (const msg of conversationHistory) {
        if (msg.role === "user" || msg.role === "assistant") {
          messages.push({ role: msg.role, content: msg.content });
        }
      }
    }

    // Build the current user message content
    const userContent: Anthropic.ContentBlockParam[] = [];

    // Add images if provided
    if (images && Array.isArray(images) && images.length > 0) {
      for (const img of images) {
        if (typeof img === "string" && img.startsWith("data:")) {
          // Parse base64 data URI
          const match = img.match(
            /^data:(image\/[a-zA-Z+]+);base64,(.+)$/
          );
          if (match) {
            const mediaType = match[1] as
              | "image/jpeg"
              | "image/png"
              | "image/gif"
              | "image/webp";
            const data = match[2];
            userContent.push({
              type: "image",
              source: { type: "base64", media_type: mediaType, data },
            });
          }
        } else if (typeof img === "string" && img.startsWith("http")) {
          userContent.push({
            type: "image",
            source: { type: "url", url: img },
          });
        }
      }
    }

    userContent.push({ type: "text", text: userQuestion });
    messages.push({ role: "user", content: userContent });

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 2048,
      system: SYSTEM_PROMPT,
      messages,
    });

    const answer =
      response.content[0].type === "text"
        ? response.content[0].text
        : "No response generated";

    // Extract part names from the answer for image search suggestions
    const partImages = extractPartSuggestions(answer, userQuestion);

    return new Response(
      JSON.stringify({
        success: true,
        answer,
        partImages,
        generatedImage: null,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Repair diagnostic error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "AI service error",
        answer: `I encountered an issue processing your request. Please try again. Error: ${error.message || "Unknown error"}`,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
};

function extractPartSuggestions(
  answer: string,
  question: string
): Array<{
  url: string;
  query: string;
  source: string;
  verificationScore: number;
}> {
  const partImages: Array<{
    url: string;
    query: string;
    source: string;
    verificationScore: number;
  }> = [];

  // Common part patterns in repair answers
  const partPatterns = [
    /(?:replace|install|need|get|buy|order)\s+(?:a\s+|the\s+)?([A-Z][a-zA-Z0-9\s\-]+(?:valve|filter|element|capacitor|motor|pump|switch|thermostat|gasket|seal|belt|hose|faucet|cartridge|flapper|sensor|igniter|relay|compressor|fan|blower|coil|board|fuse|breaker))/gi,
    /(?:part\s*(?:number|#)?:?\s*)([A-Z0-9][A-Z0-9\-]+)/gi,
    /(?:model\s*(?:number|#)?:?\s*)([A-Z0-9][A-Z0-9\-]+)/gi,
  ];

  const foundParts = new Set<string>();

  for (const pattern of partPatterns) {
    let match;
    while ((match = pattern.exec(answer)) !== null) {
      const partName = match[1].trim();
      if (partName.length > 3 && partName.length < 60) {
        foundParts.add(partName);
      }
    }
  }

  for (const part of Array.from(foundParts).slice(0, 4)) {
    const searchQuery = encodeURIComponent(part);
    partImages.push({
      url: `https://www.homedepot.com/s/${searchQuery}`,
      query: part,
      source: "Home Depot Search",
      verificationScore: 0.8,
    });
  }

  return partImages;
}

export const config = {
  path: "/api/repair-diagnostic",
};
