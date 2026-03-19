import { NextResponse } from "next/server";
import { getUserId } from "@/lib/auth";
import { query } from "@/lib/db";
import type { Generation } from "@/types";

export async function GET(request: Request) {
  try {
    const userId = await getUserId();
    const { searchParams } = new URL(request.url);

    const contentType = searchParams.get("content_type");
    const offset = Math.max(0, Number(searchParams.get("offset") ?? 0));
    const limit = Math.min(50, Math.max(1, Number(searchParams.get("limit") ?? 12)));

    const conditions = ["user_id = $1"];
    const params: unknown[] = [userId];
    let paramIndex = 2;

    if (contentType && (contentType === "image" || contentType === "video")) {
      conditions.push(`content_type = $${paramIndex}`);
      params.push(contentType);
      paramIndex++;
    }

    params.push(limit, offset);

    const result = await query<Generation>(
      `SELECT * FROM generations
       WHERE ${conditions.join(" AND ")}
       ORDER BY created_at DESC
       LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
      params
    );

    return NextResponse.json(result.rows);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch generations" },
      { status: 500 }
    );
  }
}
