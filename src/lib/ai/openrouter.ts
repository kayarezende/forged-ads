import type { AspectRatio } from "@/types";

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";
const MODEL_ID = "google/gemini-3.1-flash-image-preview";

interface GenerateImageParams {
  prompt: string;
  aspectRatio?: AspectRatio;
}

interface OpenRouterResponse {
  content: string;
  usage: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
  model: string;
}

export async function generateImage({
  prompt,
  aspectRatio = "1:1",
}: GenerateImageParams): Promise<OpenRouterResponse> {
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
      messages: [{ role: "user", content: prompt }],
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
