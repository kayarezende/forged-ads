const GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta";
const VEO_MODEL = "veo-3.1-fast-generate-preview";

interface GenerateVideoParams {
  prompt: string;
  aspectRatio?: "16:9" | "9:16";
  resolution?: "720p" | "1080p";
}

export async function submitVideoGeneration({
  prompt,
  aspectRatio = "16:9",
  resolution = "720p",
}: GenerateVideoParams) {
  const response = await fetch(
    `${GEMINI_API_BASE}/models/${VEO_MODEL}:generateVideos?key=${process.env.GOOGLE_GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        prompt,
        config: { aspect_ratio: aspectRatio, resolution },
      }),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(
      `Veo error: ${error.error?.message || response.statusText}`
    );
  }

  return await response.json();
}

export async function pollVideoOperation(operationName: string) {
  const response = await fetch(
    `${GEMINI_API_BASE}/${operationName}?key=${process.env.GOOGLE_GEMINI_API_KEY}`
  );

  const operation = await response.json();

  if (operation.done) {
    return { done: true as const, result: operation.response };
  }

  return { done: false as const };
}
