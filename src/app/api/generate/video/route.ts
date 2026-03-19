import { NextResponse } from "next/server";
import { getUserId } from "@/lib/auth";
import { query, queryOne } from "@/lib/db";
import { deductCredits, refundCredits, checkRateLimit } from "@/lib/credits";
import { submitVideoGeneration } from "@/lib/ai/gemini-veo";
import { CREDIT_COSTS, AI_MODELS, PLANS } from "@/lib/constants";
import type { SubscriptionTier } from "@/types";

type VideoAspectRatio = "16:9" | "9:16";

export async function POST(request: Request) {
  let generationId = "";
  let userId = "";

  try {
    // 1. Authenticate
    userId = await getUserId();

    // 2. Check subscription tier allows video
    const profile = await queryOne<{
      subscription_tier: string;
      credits_balance: number;
    }>(
      `SELECT subscription_tier, credits_balance FROM public.profiles WHERE id = $1`,
      [userId]
    );

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const tier = profile.subscription_tier as SubscriptionTier;
    if (!PLANS[tier]?.videoEnabled) {
      return NextResponse.json(
        { error: "Video generation requires a Pro or Business plan" },
        { status: 403 }
      );
    }

    // 3. Check credits >= 5
    if (profile.credits_balance < CREDIT_COSTS.video) {
      return NextResponse.json(
        { error: `Insufficient credits. Video generation costs ${CREDIT_COSTS.video} credits.` },
        { status: 402 }
      );
    }

    // 4. Parse & validate body
    const body = await request.json();
    const { prompt, aspectRatio = "16:9" } = body as {
      prompt?: string;
      aspectRatio?: string;
    };

    if (!prompt || typeof prompt !== "string" || prompt.trim().length === 0) {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 }
      );
    }

    if (prompt.length > 2000) {
      return NextResponse.json(
        { error: "Prompt must be under 2000 characters" },
        { status: 400 }
      );
    }

    const validRatios: VideoAspectRatio[] = ["16:9", "9:16"];
    if (!validRatios.includes(aspectRatio as VideoAspectRatio)) {
      return NextResponse.json(
        { error: "Video aspect ratio must be 16:9 or 9:16" },
        { status: 400 }
      );
    }

    // 5. Rate limit check
    const withinLimit = await checkRateLimit(userId);
    if (!withinLimit) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Please wait a moment." },
        { status: 429 }
      );
    }

    // 6. Create pending generation record
    const generation = await queryOne<{ id: string }>(
      `INSERT INTO public.generations
        (user_id, content_type, model, prompt, aspect_ratio, status, credits_cost, metadata)
       VALUES ($1, 'video', $2, $3, $4, 'pending', $5, $6)
       RETURNING id`,
      [
        userId,
        AI_MODELS.video,
        prompt.trim(),
        aspectRatio,
        CREDIT_COSTS.video,
        JSON.stringify({ original_prompt: prompt.trim() }),
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
      CREDIT_COSTS.video,
      generationId,
      "Video generation"
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

    // 8. Submit to Veo API
    await query(
      `UPDATE public.generations SET status = 'generating' WHERE id = $1`,
      [generationId]
    );

    const veoResult = await submitVideoGeneration({
      prompt: prompt.trim(),
      aspectRatio: aspectRatio as "16:9" | "9:16",
    });

    // 9. Store operation name in metadata for polling
    const operationName = veoResult.name;
    if (!operationName) {
      throw new Error("No operation name returned from Veo API");
    }

    await query(
      `UPDATE public.generations SET metadata = $1 WHERE id = $2`,
      [
        JSON.stringify({
          original_prompt: prompt.trim(),
          veo_operation_name: operationName,
        }),
        generationId,
      ]
    );

    return NextResponse.json({
      id: generationId,
      status: "generating",
      operationName,
    });
  } catch (error) {
    // Refund credits on failure
    if (generationId && userId) {
      try {
        await refundCredits(userId, CREDIT_COSTS.video, generationId);
      } catch {
        // Refund failed — log but don't mask original error
      }

      await query(
        `UPDATE public.generations SET status = 'failed', error_message = $1 WHERE id = $2`,
        [error instanceof Error ? error.message : "Unknown error", generationId]
      );
    }

    const message =
      error instanceof Error ? error.message : "Video generation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
