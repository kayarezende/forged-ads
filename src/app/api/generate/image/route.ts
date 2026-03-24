import { NextResponse } from "next/server";
import { getUserId } from "@/lib/auth";
import { query, queryOne } from "@/lib/db";
import { saveBase64File } from "@/lib/storage";
import { deductCredits, refundCredits, checkRateLimit } from "@/lib/credits";
import { buildPrompt } from "@/lib/ai/prompt-builder";
import { generateImage } from "@/lib/ai/gemini-image";
import { CREDIT_COSTS, AI_MODELS } from "@/lib/constants";
import type { AspectRatio, BrandKit, Template } from "@/types";

export async function POST(request: Request) {
  let generationId = "";
  let userId = "";

  try {
    // 1. Authenticate
    userId = await getUserId();

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
      template = await queryOne<Template>(
        `SELECT * FROM public.templates WHERE id = $1 AND is_active = true`,
        [templateId]
      );
      if (!template) {
        return NextResponse.json(
          { error: "Template not found" },
          { status: 404 }
        );
      }
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
    const withinLimit = await checkRateLimit(userId);
    if (!withinLimit) {
      return NextResponse.json(
        {
          error: "Rate limit exceeded. Please wait before generating again.",
          retryAfter: 60,
        },
        {
          status: 429,
          headers: { "Retry-After": "60" },
        }
      );
    }

    // 4. Fetch optional brand kit
    let brandKit: BrandKit | null = null;
    if (brandKitId) {
      brandKit = await queryOne<BrandKit>(
        `SELECT * FROM public.brand_kits WHERE id = $1`,
        [brandKitId]
      );
    }

    // 5. Build the prompt
    const finalPrompt = buildPrompt({
      userPrompt: prompt?.trim() ?? "",
      brandKit,
      template,
      variables,
    });

    // 6. Create pending generation record
    const generation = await queryOne<{ id: string }>(
      `INSERT INTO public.generations
        (user_id, brand_kit_id, template_id, content_type, model, prompt,
         aspect_ratio, status, credits_cost, metadata)
       VALUES ($1, $2, $3, 'image', $4, $5, $6, 'pending', $7, $8)
       RETURNING id`,
      [
        userId,
        brandKitId ?? null,
        templateId ?? null,
        AI_MODELS.image,
        finalPrompt,
        effectiveAspectRatio,
        CREDIT_COSTS.image,
        JSON.stringify({
          original_prompt: prompt?.trim() ?? null,
          template_id: templateId ?? null,
          template_variables: variables ?? null,
        }),
      ]
    );

    if (!generation) {
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
      await query(
        `UPDATE public.generations SET status = 'failed', error_message = 'Insufficient credits' WHERE id = $1`,
        [generationId]
      );

      return NextResponse.json(
        { error: "Insufficient credits" },
        { status: 402 }
      );
    }

    // 8. Update status to generating
    await query(
      `UPDATE public.generations SET status = 'generating' WHERE id = $1`,
      [generationId]
    );

    // 9. Call Gemini API
    const startTime = Date.now();
    const result = await generateImage({
      prompt: finalPrompt,
      aspectRatio: effectiveAspectRatio,
    });
    const generationTimeMs = Date.now() - startTime;

    // 10. Save to local storage
    const publicUrl = await saveBase64File(result.base64, {
      directory: "generations",
      filename: `${generationId}.png`,
      extension: "png",
    });

    // 12. Update generation record to completed
    await query(
      `UPDATE public.generations
       SET status = 'completed', output_url = $1, thumbnail_url = $1,
           generation_time_ms = $2, metadata = $3
       WHERE id = $4`,
      [
        publicUrl,
        generationTimeMs,
        JSON.stringify({
          original_prompt: prompt?.trim() ?? null,
          template_id: templateId ?? null,
          model_used: result.model,
        }),
        generationId,
      ]
    );

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

      await query(
        `UPDATE public.generations SET status = 'failed', error_message = $1 WHERE id = $2`,
        [error instanceof Error ? error.message : "Unknown error", generationId]
      );
    }

    const message =
      error instanceof Error ? error.message : "Image generation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
