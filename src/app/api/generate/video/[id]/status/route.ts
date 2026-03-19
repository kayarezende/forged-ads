import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { refundCredits } from "@/lib/credits";
import { pollVideoOperation } from "@/lib/ai/gemini-veo";
import { CREDIT_COSTS } from "@/lib/constants";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: generationId } = await params;

    // 1. Authenticate
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Fetch generation record (must belong to user)
    const admin = createAdminClient();
    const { data: generation } = await admin
      .from("generations")
      .select("*")
      .eq("id", generationId)
      .eq("user_id", user.id)
      .single();

    if (!generation) {
      return NextResponse.json(
        { error: "Generation not found" },
        { status: 404 }
      );
    }

    // Already completed or failed — return current state
    if (generation.status === "completed") {
      return NextResponse.json({
        id: generationId,
        status: "completed",
        outputUrl: generation.output_url,
        generationTimeMs: generation.generation_time_ms,
      });
    }

    if (generation.status === "failed") {
      return NextResponse.json({
        id: generationId,
        status: "failed",
        error: generation.error_message,
      });
    }

    // 3. Poll the Veo operation
    const metadata = generation.metadata as Record<string, unknown>;
    const operationName = metadata?.veo_operation_name as string | undefined;

    if (!operationName) {
      return NextResponse.json({
        id: generationId,
        status: "generating",
      });
    }

    const pollResult = await pollVideoOperation(operationName);

    if (!pollResult.done) {
      return NextResponse.json({
        id: generationId,
        status: "generating",
      });
    }

    // 4. Video is done — download and upload to Supabase Storage
    const generationTimeMs =
      new Date().getTime() - new Date(generation.created_at).getTime();

    try {
      const videoData = pollResult.result?.generatedVideos?.[0]?.video;
      if (!videoData?.uri) {
        throw new Error("No video URI in Veo response");
      }

      // Download the video from the temporary URI
      const videoResponse = await fetch(videoData.uri);
      if (!videoResponse.ok) {
        throw new Error("Failed to download generated video");
      }
      const videoBuffer = Buffer.from(await videoResponse.arrayBuffer());

      // Upload to Supabase Storage
      const filePath = `${user.id}/${generationId}.mp4`;
      const { error: uploadError } = await admin.storage
        .from("generations")
        .upload(filePath, videoBuffer, {
          contentType: "video/mp4",
          upsert: false,
        });

      if (uploadError) {
        throw new Error(`Storage upload failed: ${uploadError.message}`);
      }

      const {
        data: { publicUrl },
      } = admin.storage.from("generations").getPublicUrl(filePath);

      // 5. Update generation record
      await admin
        .from("generations")
        .update({
          status: "completed",
          output_url: publicUrl,
          generation_time_ms: generationTimeMs,
          metadata: {
            ...metadata,
            veo_operation_done: true,
          },
        })
        .eq("id", generationId);

      return NextResponse.json({
        id: generationId,
        status: "completed",
        outputUrl: publicUrl,
        generationTimeMs,
      });
    } catch (uploadError) {
      // Video generation succeeded but upload/processing failed — refund credits
      try {
        await refundCredits(user.id, CREDIT_COSTS.video, generationId);
      } catch {
        // Refund failed — log but don't mask original error
      }

      const errorMessage =
        uploadError instanceof Error
          ? uploadError.message
          : "Failed to process video";

      await admin
        .from("generations")
        .update({
          status: "failed",
          error_message: errorMessage,
        })
        .eq("id", generationId);

      return NextResponse.json({
        id: generationId,
        status: "failed",
        error: errorMessage,
      });
    }
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Status check failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
