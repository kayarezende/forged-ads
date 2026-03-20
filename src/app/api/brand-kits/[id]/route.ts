import { NextResponse } from "next/server";
import { getUserId } from "@/lib/auth";
import { query, queryOne } from "@/lib/db";
import { removeFile } from "@/lib/storage";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getUserId();
    const { id } = await params;
    const body = await request.json();

    const {
      name,
      logo_url,
      primary_color,
      secondary_color,
      accent_color,
      background_color,
      font_heading,
      font_body,
      brand_voice,
      is_default,
    } = body as {
      name: string;
      logo_url?: string | null;
      primary_color?: string | null;
      secondary_color?: string | null;
      accent_color?: string | null;
      background_color?: string | null;
      font_heading?: string | null;
      font_body?: string | null;
      brand_voice?: string | null;
      is_default?: boolean;
    };

    if (!name?.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    if (is_default) {
      await query(
        "UPDATE brand_kits SET is_default = false WHERE user_id = $1",
        [userId]
      );
    }

    const result = await query(
      `UPDATE brand_kits SET
        name = $1, logo_url = $2, primary_color = $3, secondary_color = $4,
        accent_color = $5, background_color = $6, font_heading = $7,
        font_body = $8, brand_voice = $9, is_default = $10, updated_at = NOW()
      WHERE id = $11 AND user_id = $12`,
      [
        name.trim(),
        logo_url ?? null,
        primary_color ?? null,
        secondary_color ?? null,
        accent_color ?? null,
        background_color ?? null,
        font_heading ?? null,
        font_body ?? null,
        brand_voice ?? null,
        is_default ?? false,
        id,
        userId,
      ]
    );

    if (result.rowCount === 0) {
      return NextResponse.json({ error: "Brand kit not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Update brand kit error:", error);
    return NextResponse.json(
      { error: "Failed to update brand kit" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getUserId();
    const { id } = await params;

    const kit = await queryOne<{ logo_url: string | null }>(
      "SELECT logo_url FROM brand_kits WHERE id = $1 AND user_id = $2",
      [id, userId]
    );

    if (kit?.logo_url) {
      try {
        const url = new URL(kit.logo_url);
        const pathParts = url.pathname.split("/brand-logos/");
        if (pathParts[1]) {
          await removeFile("brand-logos", decodeURIComponent(pathParts[1]));
        }
      } catch {
        // Non-critical -- logo cleanup is best-effort
      }
    }

    const result = await query(
      "DELETE FROM brand_kits WHERE id = $1 AND user_id = $2",
      [id, userId]
    );

    if (result.rowCount === 0) {
      return NextResponse.json({ error: "Brand kit not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete brand kit error:", error);
    return NextResponse.json(
      { error: "Failed to delete brand kit" },
      { status: 500 }
    );
  }
}
