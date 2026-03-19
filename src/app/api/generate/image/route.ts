import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { deductCredits, refundCredits } from "@/lib/credits";
import { buildPrompt } from "@/lib/ai/prompt-builder";
import { generateImage } from "@/lib/ai/openrouter";
import { CREDIT_COSTS, RATE_LIMITS, AI_MODELS } from "@/lib/constants";
import type { AspectRatio, BrandKit, Template } from "@/types";

export async function POST(request: Request) {
  let generationId = "";
  let userId = "";

  try {
    // 1. Authenticate
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    userId = user.id;

    // 2. Parse & validate body
    const body = await request.json();
    const {
      prompt,
      templateId,
      variables,
      aspectRatio = "1:1",
      brandKitId,
    } = body as {
      prompt?: string;
      templateId?: string;
      variables?: Record<string, string>;
      aspectRatio?: AspectRatio;
      brandKitId?: string;
    };

    // Either prompt (freeform) or templateId+variables (guided) is required
    if (!templateId && (!prompt || typeof prompt !== "string" || prompt.trim().length === 0)) {
      return NextResponse.json(
        { error: "Prompt or template is required" },
        { status: 400 }
      );
    }

    if (prompt && prompt.length > 2000) {
      return NextResponse.json(
        { error: "Prompt must be under 2000 characters" },
        { status: 400 }
      );
    }

    // Fetch template if using guided mode
    let template: Template | null = null;
    if (templateId) {
      const { data } = await supabase
        .from("templates")
        .select("*")
        .eq("id", templateId)
        .eq("is_active", true)
        .single();
      if (!data) {
        return NextResponse.json(
          { error: "Template not found" },
          { status: 404 }
        );
      }
      template = data as Template;
    }

    // Use template aspect ratio if in guided mode, otherwise use provided
    const effectiveAspectRatio = template ? (template.aspect_ratio as AspectRatio) : aspectRatio;

    const validRatios: AspectRatio[] = ["1:1", "4:5", "9:16", "16:9"];
    if (!validRatios.includes(effectiveAspectRatio)) {
      return NextResponse.json(
        { error: "Invalid aspect ratio" },
        { status: 400 }
      );
    }

    // 3. Rate limit check
    const admin = createAdminClient();
    const { data: withinLimit } = await admin.rpc("check_rate_limit", {
      p_user_id: userId,
      p_window_seconds: RATE_LIMITS.windowSeconds,
      p_max_requests: RATE_LIMITS.maxRequests,
    });

    if (!withinLimit) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Please wait a moment." },
        { status: 429 }
      );
    }

    // 4. Fetch optional brand kit
    let brandKit: BrandKit | null = null;
    if (brandKitId) {
      const { data } = await supabase
        .from("brand_kits")
        .select("*")
        .eq("id", brandKitId)
        .single();
      brandKit = data;
    }

    // 5. Build the prompt
    const finalPrompt = buildPrompt({
      userPrompt: prompt?.trim() ?? "",
      brandKit,
      template,
      variables,
    });

    // 6. Create pending generation record
    const { data: generation, error: genError } = await admin
      .from("generations")
      .insert({
        user_id: userId,
        brand_kit_id: brandKitId ?? null,
        template_id: templateId ?? null,
        content_type: "image" as const,
        model: AI_MODELS.image,
        prompt: finalPrompt,
        aspect_ratio: effectiveAspectRatio,
        status: "pending" as const,
        credits_cost: CREDIT_COSTS.image,
        metadata: {
          original_prompt: prompt?.trim() ?? null,
          template_id: templateId ?? null,
          template_variables: variables ?? null,
        },
      })
      .select("id")
      .single();

    if (genError || !generation) {
      return NextResponse.json(
        { error: "Failed to create generation record" },
        { status: 500 }
      );
    }
    generationId = generation.id;

    // 7. Deduct credits
    const deductResult = await deductCredits(
      userId,
      CREDIT_COSTS.image,
      generationId,
      "Image generation"
    );

    if (deductResult === null) {
      await admin
        .from("generations")
        .update({ status: "failed", error_message: "Insufficient credits" })
        .eq("id", generationId);

      return NextResponse.json(
        { error: "Insufficient credits" },
        { status: 402 }
      );
    }

    // 8. Update status to generating
    await admin
      .from("generations")
      .update({ status: "generating" })
      .eq("id", generationId);

    // 9. Call OpenRouter
    const startTime = Date.now();
    const result = await generateImage({
      prompt: finalPrompt,
      aspectRatio: effectiveAspectRatio,
    });
    const generationTimeMs = Date.now() - startTime;

    // 10. Extract base64 image from response
    const imageData = extractBase64Image(result.content);
    if (!imageData) {
      throw new Error("No image data in response");
    }

    // 11. Upload to Supabase Storage
    const filePath = `${userId}/${generationId}.png`;
    const buffer = Buffer.from(imageData.base64, "base64");

    const { error: uploadError } = await admin.storage
      .from("generations")
      .upload(filePath, buffer, {
        contentType: imageData.mimeType,
        upsert: false,
      });

    if (uploadError) {
      throw new Error(`Storage upload failed: ${uploadError.message}`);
    }

    const {
      data: { publicUrl },
    } = admin.storage.from("generations").getPublicUrl(filePath);

    // 12. Update generation record to completed
    await admin
      .from("generations")
      .update({
        status: "completed",
        output_url: publicUrl,
        thumbnail_url: publicUrl,
        generation_time_ms: generationTimeMs,
        metadata: {
          original_prompt: prompt?.trim() ?? null,
          template_id: templateId ?? null,
          model_used: result.model,
          usage: result.usage,
        },
      })
      .eq("id", generationId);

    return NextResponse.json({
      id: generationId,
      outputUrl: publicUrl,
      status: "completed",
      generationTimeMs,
    });
  } catch (error) {
    // Refund credits on failure if we already deducted them
    if (generationId && userId) {
      try {
        await refundCredits(userId, CREDIT_COSTS.image, generationId);
      } catch {
        // Refund failed — log but don't mask original error
      }

      const admin = createAdminClient();
      await admin
        .from("generations")
        .update({
          status: "failed",
          error_message:
            error instanceof Error ? error.message : "Unknown error",
        })
        .eq("id", generationId);
    }

    const message =
      error instanceof Error ? error.message : "Image generation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/** Extract base64 image data from OpenRouter multimodal response content. */
function extractBase64Image(
  content: string | Array<Record<string, unknown>>
): { base64: string; mimeType: string } | null {
  // Array of content parts (multimodal response)
  if (Array.isArray(content)) {
    for (const part of content) {
      if (part.type === "image_url") {
        const url = (part.image_url as Record<string, string>)?.url;
        if (url) return parseDataUri(url);
      }
    }
    // Fall through to string parsing if no image_url parts
    const textParts = content
      .filter((p) => p.type === "text")
      .map((p) => p.text as string)
      .join("");
    if (textParts) return extractFromMarkdown(textParts);
  }

  // String content — look for data URI in markdown image syntax
  if (typeof content === "string") {
    return extractFromMarkdown(content) ?? parseDataUri(content);
  }

  return null;
}

function parseDataUri(
  uri: string
): { base64: string; mimeType: string } | null {
  const match = uri.match(/^data:(image\/[^;]+);base64,([\s\S]+)$/);
  if (!match) return null;
  return { mimeType: match[1], base64: match[2] };
}

function extractFromMarkdown(
  text: string
): { base64: string; mimeType: string } | null {
  const match = text.match(/!\[.*?\]\((data:image\/[^;]+;base64,[^)]+)\)/);
  if (!match) return null;
  return parseDataUri(match[1]);
}
