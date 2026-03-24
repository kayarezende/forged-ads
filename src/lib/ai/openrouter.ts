import type { AspectRatio } from "@/types";

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";
const MODEL_ID = "google/gemini-3.1-flash-image-preview";

interface ReferenceImage {
  base64: string;
  mimeType: string;
}

interface GenerateImageParams {
  prompt: string;
  aspectRatio?: AspectRatio;
  referenceImages?: ReferenceImage[];
}

interface OpenRouterResponse {
  content: string;
  usage: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
  model: string;
}

export async function generateImage({
  prompt,
  aspectRatio = "1:1",
  referenceImages,
}: GenerateImageParams): Promise<OpenRouterResponse> {
  // Build message content: text-only string when no references,
  // multimodal content array when reference images are provided.
  let messageContent: string | Array<Record<string, unknown>> = prompt;

  if (referenceImages && referenceImages.length > 0) {
    const parts: Array<Record<string, unknown>> = referenceImages.map((img) => ({
      type: "image_url",
      image_url: { url: `data:${img.mimeType};base64,${img.base64}` },
    }));
    parts.push({ type: "text", text: prompt });
    messageContent = parts;
  }

  const response = await fetch(OPENROUTER_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL!,
      "X-Title": "ForgedAds",
    },
    body: JSON.stringify({
      model: MODEL_ID,
      messages: [{ role: "user", content: messageContent }],
      modalities: ["image", "text"],
      image_config: { aspect_ratio: aspectRatio },
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(
      `OpenRouter error: ${error.error?.message || response.statusText}`
    );
  }

  const data = await response.json();
  const content = data.choices[0]?.message?.content;

  return {
    content,
    usage: data.usage,
    model: data.model,
  };
}
