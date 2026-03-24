"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { getUserId } from "@/lib/auth";
import { createCampaign, processCampaign } from "@/lib/campaigns";
import { deductCampaignCredits } from "@/lib/credits";
import { query } from "@/lib/db";
import { CREDIT_COSTS } from "@/lib/constants";
import type { Campaign, CampaignInput } from "@/types";

type ActionResult =
  | { campaign: Campaign }
  | { error: string; required?: number };

export async function createCampaignAction(
  input: CampaignInput
): Promise<ActionResult> {
  let userId: string;
  try {
    userId = await getUserId();
  } catch {
    return { error: "Not authenticated" };
  }

  // Validate required fields
  if (!input.name || input.name.trim().length === 0) {
    return { error: "Campaign name is required" };
  }
  if (!input.brand_kit_id) {
    return { error: "Brand kit is required" };
  }
  if (!input.product_description || input.product_description.trim().length === 0) {
    return { error: "Product description is required" };
  }
  if (!input.content_type || (input.content_type !== "image" && input.content_type !== "video")) {
    return { error: "Valid content type is required" };
  }
  if (!input.placements || input.placements.length === 0) {
    return { error: "At least one placement is required" };
  }
  if (!input.ad_angles || input.ad_angles.length === 0) {
    return { error: "At least one ad angle is required" };
  }
  if (!input.visual_styles || input.visual_styles.length === 0) {
    return { error: "At least one visual style is required" };
  }

  const sanitizedInput: CampaignInput = {
    name: input.name.trim(),
    brand_kit_id: input.brand_kit_id,
    template_id: input.template_id,
    product_description: input.product_description.trim(),
    target_audience: input.target_audience?.trim() || undefined,
    content_type: input.content_type,
    placements: input.placements,
    ad_angles: input.ad_angles,
    visual_styles: input.visual_styles,
  };

  // Create campaign + variants (status: draft)
  let campaign: Campaign;
  try {
    campaign = await createCampaign(userId, sanitizedInput);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to create campaign";
    return { error: message };
  }

  // Deduct credits for the entire batch
  const totalCost = campaign.total_variants * CREDIT_COSTS[sanitizedInput.content_type];
  const credited = await deductCampaignCredits(
    userId,
    campaign.id,
    totalCost,
    `Campaign: ${sanitizedInput.name}`
  );

  if (!credited) {
    return { error: "Insufficient credits", required: totalCost };
  }

  // Move campaign to queued
  await query(
    `UPDATE campaigns SET status = 'queued' WHERE id = $1`,
    [campaign.id]
  );

  // Process campaign in the background after response is sent
  after(async () => {
    await processCampaign(campaign.id);
  });

  revalidatePath("/dashboard/campaigns");

  return { campaign: { ...campaign, status: "queued" } };
}
