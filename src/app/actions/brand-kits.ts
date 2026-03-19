"use server";

import { revalidatePath } from "next/cache";
import { query, queryOne } from "@/lib/db";
import { getUserId } from "@/lib/auth";
import { removeFile } from "@/lib/storage";
import { PLANS } from "@/lib/constants";
import type { SubscriptionTier } from "@/types";

interface BrandKitInput {
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
}

export async function createBrandKit(
  input: BrandKitInput
): Promise<{ error?: string }> {
  let userId: string;
  try {
    userId = await getUserId();
  } catch {
    return { error: "Not authenticated" };
  }

  const profile = await queryOne<{ subscription_tier: string }>(
    "SELECT subscription_tier FROM profiles WHERE id = $1",
    [userId]
  );
  if (!profile) return { error: "Profile not found" };

  const tier = profile.subscription_tier as SubscriptionTier;
  const plan = PLANS[tier];

  const countResult = await queryOne<{ count: string }>(
    "SELECT COUNT(*)::text AS count FROM brand_kits WHERE user_id = $1",
    [userId]
  );
  const count = parseInt(countResult?.count ?? "0", 10);

  if (count >= plan.maxBrandKits) {
    return {
      error: `Brand kit limit reached (${plan.maxBrandKits} for ${plan.name} plan)`,
    };
  }

  if (input.is_default) {
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
      input.name,
      input.logo_url ?? null,
      input.primary_color ?? null,
      input.secondary_color ?? null,
      input.accent_color ?? null,
      input.background_color ?? null,
      input.font_heading ?? null,
      input.font_body ?? null,
      input.brand_voice ?? null,
      input.is_default ?? false,
    ]
  );

  if (!rows[0]) return { error: "Failed to create brand kit" };

  revalidatePath("/dashboard/brand-kits");
  return {};
}

export async function updateBrandKit(
  id: string,
  input: BrandKitInput
): Promise<{ error?: string }> {
  let userId: string;
  try {
    userId = await getUserId();
  } catch {
    return { error: "Not authenticated" };
  }

  if (input.is_default) {
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
      input.name,
      input.logo_url ?? null,
      input.primary_color ?? null,
      input.secondary_color ?? null,
      input.accent_color ?? null,
      input.background_color ?? null,
      input.font_heading ?? null,
      input.font_body ?? null,
      input.brand_voice ?? null,
      input.is_default ?? false,
      id,
      userId,
    ]
  );

  if (result.rowCount === 0) return { error: "Brand kit not found" };

  revalidatePath("/dashboard/brand-kits");
  return {};
}

export async function deleteBrandKit(
  id: string
): Promise<{ error?: string }> {
  let userId: string;
  try {
    userId = await getUserId();
  } catch {
    return { error: "Not authenticated" };
  }

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
      // Non-critical — logo cleanup is best-effort
    }
  }

  const result = await query(
    "DELETE FROM brand_kits WHERE id = $1 AND user_id = $2",
    [id, userId]
  );

  if (result.rowCount === 0) return { error: "Brand kit not found" };

  revalidatePath("/dashboard/brand-kits");
  return {};
}
