import { NextResponse } from "next/server";
import { getUserId } from "@/lib/auth";
import { queryOne } from "@/lib/db";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userId = await getUserId();
    const body = await request.json();

    const { tag } = body as { tag?: string | null };
    if (tag !== undefined && tag !== null && typeof tag !== "string") {
      return NextResponse.json({ error: "Tag must be a string or null" }, { status: 400 });
    }

    // Update the metadata JSONB with the tag (merge, don't replace)
    const updated = await queryOne<{ id: string; metadata: Record<string, unknown> }>(
      `UPDATE generations
       SET metadata = CASE
         WHEN $3::text IS NULL THEN metadata - 'tag'
         ELSE jsonb_set(metadata, '{tag}', to_jsonb($3::text))
       END
       WHERE id = $1 AND user_id = $2
       RETURNING id, metadata`,
      [id, userId, tag ?? null]
    );

    if (!updated) {
      return NextResponse.json({ error: "Generation not found" }, { status: 404 });
    }

    return NextResponse.json({
      id: updated.id,
      tag: (updated.metadata?.tag as string) ?? null,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to update tag";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
