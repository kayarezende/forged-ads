import { NextResponse } from "next/server";
import { getUserId } from "@/lib/auth";
import { query } from "@/lib/db";

export async function GET() {
  try {
    const userId = await getUserId();

    const result = await query<{
      id: string;
      name: string;
      primary_color: string | null;
      secondary_color: string | null;
      accent_color: string | null;
      is_default: boolean;
    }>(
      `SELECT id, name, primary_color, secondary_color, accent_color, is_default
       FROM brand_kits
       WHERE user_id = $1
       ORDER BY is_default DESC`,
      [userId]
    );

    return NextResponse.json(result.rows);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch brand kits" },
      { status: 500 }
    );
  }
}
