import { NextResponse } from "next/server";
import { getUserId } from "@/lib/auth";
import { query, queryOne } from "@/lib/db";
import { saveFile } from "@/lib/storage";
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
    const userId = await getUserId();

    // 2. Fetch generation record (must belong to user)
    const generation = await queryOne<{
      id: string;
      user_id: string;
      status: string;
      output_url: string | null;
      generation_time_ms: number | null;
      error_message: string | null;
      metadata: Record<string, unknown>;
      created_at: string;
    }>(
      `SELECT id, user_id, status, output_url, generation_time_ms, error_message, metadata, created_at
       FROM public.generations
       WHERE id = $1 AND user_id = $2`,
      [generationId, userId]
    );

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
    const metadata = generation.metadata;
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

    // 4. Video is done — download and save to local storage
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

      // Save to local storage
      const publicUrl = await saveFile(videoBuffer, {
        directory: "generations",
        filename: `${generationId}.mp4`,
        extension: "mp4",
      });

      // 5. Update generation record
      await query(
        `UPDATE public.generations
         SET status = 'completed', output_url = $1, generation_time_ms = $2, metadata = $3
         WHERE id = $4`,
        [
          publicUrl,
          generationTimeMs,
          JSON.stringify({
            ...metadata,
            veo_operation_done: true,
          }),
          generationId,
        ]
      );

      return NextResponse.json({
        id: generationId,
        status: "completed",
        outputUrl: publicUrl,
        generationTimeMs,
      });
    } catch (uploadError) {
      // Video generation succeeded but save/processing failed — refund credits
      try {
        await refundCredits(userId, CREDIT_COSTS.video, generationId);
      } catch {
        // Refund failed — log but don't mask original error
      }

      const errorMessage =
        uploadError instanceof Error
          ? uploadError.message
          : "Failed to process video";

      await query(
        `UPDATE public.generations SET status = 'failed', error_message = $1 WHERE id = $2`,
        [errorMessage, generationId]
      );

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
