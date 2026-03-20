import { NextResponse } from "next/server";
import { getUserId } from "@/lib/auth";
import { query, queryOne } from "@/lib/db";
import { PLANS } from "@/lib/constants";
import type { SubscriptionTier } from "@/types";

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

export async function POST(request: Request) {
  try {
    const userId = await getUserId();
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

    // Check tier-based brand kit limit
    const profile = await queryOne<{ subscription_tier: string }>(
      "SELECT subscription_tier FROM profiles WHERE id = $1",
      [userId]
    );
    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const tier = profile.subscription_tier as SubscriptionTier;
    const plan = PLANS[tier];

    const countResult = await queryOne<{ count: string }>(
      "SELECT COUNT(*)::text AS count FROM brand_kits WHERE user_id = $1",
      [userId]
    );
    const count = parseInt(countResult?.count ?? "0", 10);

    if (count >= plan.maxBrandKits) {
      return NextResponse.json(
        { error: `Brand kit limit reached (${plan.maxBrandKits} for ${plan.name} plan)` },
        { status: 403 }
      );
    }

    if (is_default) {
      await query(
        "UPDATE brand_kits SET is_default = false WHERE user_id = $1",
        [userId]
      );
    }

    const { rows } = await query(
      `INSERT INTO brand_kits (
        user_id, name, logo_url, primary_color, secondary_color,
        accent_color, background_color, font_heading, font_body,
        brand_voice, is_default
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
      RETURNING id`,
      [
        userId,
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
      ]
    );

    if (!rows[0]) {
      return NextResponse.json(
        { error: "Failed to create brand kit" },
        { status: 500 }
      );
    }

    return NextResponse.json({ id: rows[0].id }, { status: 201 });
  } catch (error) {
    console.error("Create brand kit error:", error);
    return NextResponse.json(
      { error: "Failed to create brand kit" },
      { status: 500 }
    );
  }
}
