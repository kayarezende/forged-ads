"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
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
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("subscription_tier")
    .eq("id", user.id)
    .single();
  if (!profile) return { error: "Profile not found" };

  const tier = profile.subscription_tier as SubscriptionTier;
  const plan = PLANS[tier];

  const { count } = await supabase
    .from("brand_kits")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id);

  if ((count ?? 0) >= plan.maxBrandKits) {
    return {
      error: `Brand kit limit reached (${plan.maxBrandKits} for ${plan.name} plan)`,
    };
  }

  if (input.is_default) {
    await supabase
      .from("brand_kits")
      .update({ is_default: false })
      .eq("user_id", user.id);
  }

  const { error } = await supabase.from("brand_kits").insert({
    user_id: user.id,
    name: input.name,
    logo_url: input.logo_url ?? null,
    primary_color: input.primary_color ?? null,
    secondary_color: input.secondary_color ?? null,
    accent_color: input.accent_color ?? null,
    background_color: input.background_color ?? null,
    font_heading: input.font_heading ?? null,
    font_body: input.font_body ?? null,
    brand_voice: input.brand_voice ?? null,
    is_default: input.is_default ?? false,
  });

  if (error) return { error: error.message };

  revalidatePath("/dashboard/brand-kits");
  return {};
}

export async function updateBrandKit(
  id: string,
  input: BrandKitInput
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  if (input.is_default) {
    await supabase
      .from("brand_kits")
      .update({ is_default: false })
      .eq("user_id", user.id);
  }

  const { error } = await supabase
    .from("brand_kits")
    .update({
      name: input.name,
      logo_url: input.logo_url ?? null,
      primary_color: input.primary_color ?? null,
      secondary_color: input.secondary_color ?? null,
      accent_color: input.accent_color ?? null,
      background_color: input.background_color ?? null,
      font_heading: input.font_heading ?? null,
      font_body: input.font_body ?? null,
      brand_voice: input.brand_voice ?? null,
      is_default: input.is_default ?? false,
    })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/brand-kits");
  return {};
}

export async function deleteBrandKit(
  id: string
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not authenticated" };

  const { data: kit } = await supabase
    .from("brand_kits")
    .select("logo_url")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (kit?.logo_url) {
    try {
      const url = new URL(kit.logo_url);
      const pathParts = url.pathname.split("/brand-logos/");
      if (pathParts[1]) {
        await supabase.storage
          .from("brand-logos")
          .remove([decodeURIComponent(pathParts[1])]);
      }
    } catch {
      // Non-critical — logo cleanup is best-effort
    }
  }

  const { error } = await supabase
    .from("brand_kits")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/brand-kits");
  return {};
}
