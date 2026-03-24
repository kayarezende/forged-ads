import type { AspectRatio } from "@/types";

const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-image-preview:generateContent";

interface ReferenceImage {
  base64: string;
  mimeType: string;
}

interface GenerateImageParams {
  prompt: string;
  aspectRatio?: AspectRatio;
  referenceImages?: ReferenceImage[];
}

interface GeminiImageResult {
  base64: string;
  mimeType: string;
  model: string;
}

export async function generateImage({
  prompt,
  aspectRatio = "1:1",
  referenceImages,
}: GenerateImageParams): Promise<GeminiImageResult> {
  const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GOOGLE_GEMINI_API_KEY is not configured");
  }

  // Build content parts
  const parts: Array<Record<string, unknown>> = [];

  // Add reference images if provided
  if (referenceImages && referenceImages.length > 0) {
    for (const img of referenceImages) {
      parts.push({
        inlineData: {
          mimeType: img.mimeType,
          data: img.base64,
        },
      });
    }
  }

  // Add text prompt (include aspect ratio hint)
  parts.push({
    text: `${prompt}\n\nAspect ratio: ${aspectRatio}`,
  });

  const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ role: "user", parts }],
      generationConfig: {
        responseModalities: ["TEXT", "IMAGE"],
      },
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    const message =
      (error as Record<string, Record<string, string>>)?.error?.message ??
      response.statusText;
    throw new Error(`Gemini API error: ${message}`);
  }

  const data = await response.json();
  const candidates = data.candidates;

  if (!candidates || candidates.length === 0) {
    throw new Error("Gemini API returned no candidates");
  }

  const contentParts = candidates[0].content?.parts;
  if (!contentParts || contentParts.length === 0) {
    throw new Error("Gemini API returned no content parts");
  }

  // Find the inline image data in the response parts
  for (const part of contentParts) {
    if (part.inlineData?.data) {
      return {
        base64: part.inlineData.data,
        mimeType: part.inlineData.mimeType ?? "image/png",
        model: "gemini-3.1-flash-image-preview",
      };
    }
  }

  throw new Error("No image data in Gemini response");
}
