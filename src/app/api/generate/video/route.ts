import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { deductCredits, refundCredits } from "@/lib/credits";
import { submitVideoGeneration } from "@/lib/ai/gemini-veo";
import { CREDIT_COSTS, RATE_LIMITS, AI_MODELS, PLANS } from "@/lib/constants";
import type { SubscriptionTier } from "@/types";

type VideoAspectRatio = "16:9" | "9:16";

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

    // 2. Check subscription tier allows video
    const admin = createAdminClient();
    const { data: profile } = await admin
      .from("profiles")
      .select("subscription_tier, credits_balance")
      .eq("id", userId)
      .single();

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

    // 6. Create pending generation record
    const { data: generation, error: genError } = await admin
      .from("generations")
      .insert({
        user_id: userId,
        content_type: "video" as const,
        model: AI_MODELS.video,
        prompt: prompt.trim(),
        aspect_ratio: aspectRatio,
        status: "pending" as const,
        credits_cost: CREDIT_COSTS.video,
        metadata: { original_prompt: prompt.trim() },
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
      CREDIT_COSTS.video,
      generationId,
      "Video generation"
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

    // 8. Submit to Veo API
    await admin
      .from("generations")
      .update({ status: "generating" })
      .eq("id", generationId);

    const veoResult = await submitVideoGeneration({
      prompt: prompt.trim(),
      aspectRatio: aspectRatio as "16:9" | "9:16",
    });

    // 9. Store operation name in metadata for polling
    const operationName = veoResult.name;
    if (!operationName) {
      throw new Error("No operation name returned from Veo API");
    }

    await admin
      .from("generations")
      .update({
        metadata: {
          original_prompt: prompt.trim(),
          veo_operation_name: operationName,
        },
      })
      .eq("id", generationId);

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
      error instanceof Error ? error.message : "Video generation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
