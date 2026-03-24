import { query, queryOne } from "@/lib/db";
import type {
  Campaign,
  CampaignInput,
  CampaignVariant,
} from "@/types";
import { CAMPAIGN_PLACEMENTS, CREDIT_COSTS } from "@/lib/constants";

// ============================================================
// Campaign CRUD
// ============================================================

export async function createCampaign(
  userId: string,
  input: CampaignInput
): Promise<Campaign> {
  // Build the variant matrix: placements x angles x styles
  const variants: {
    placement: string;
    ad_angle: string;
    visual_style: string;
    aspect_ratio: string;
  }[] = [];

  for (const placement of input.placements) {
    const placementMeta = CAMPAIGN_PLACEMENTS.find((p) => p.value === placement);
    const aspectRatio = placementMeta?.aspectRatio ?? "1:1";
    for (const angle of input.ad_angles) {
      for (const style of input.visual_styles) {
        variants.push({
          placement,
          ad_angle: angle,
          visual_style: style,
          aspect_ratio: aspectRatio,
        });
      }
    }
  }

  const totalVariants = variants.length;
  if (totalVariants === 0) {
    throw new Error("Campaign must have at least one variant (placement x angle x style)");
  }

  const metadata = {
    product_description: input.product_description,
    target_audience: input.target_audience ?? null,
    content_type: input.content_type,
    placements: input.placements,
    ad_angles: input.ad_angles,
    visual_styles: input.visual_styles,
  };

  const creditCost = CREDIT_COSTS[input.content_type];

  // Insert campaign
  const campaign = await queryOne<Campaign>(
    `INSERT INTO campaigns (user_id, brand_kit_id, template_id, name, status, total_variants, metadata)
     VALUES ($1, $2, $3, $4, 'draft', $5, $6)
     RETURNING *`,
    [
      userId,
      input.brand_kit_id,
      input.template_id ?? null,
      input.name,
      totalVariants,
      JSON.stringify(metadata),
    ]
  );

  if (!campaign) {
    throw new Error("Failed to create campaign");
  }

  // Insert all variants
  const valuesClauses: string[] = [];
  const params: unknown[] = [campaign.id];
  let paramIndex = 2;

  for (let i = 0; i < variants.length; i++) {
    const v = variants[i];
    const overrides = JSON.stringify({
      placement: v.placement,
      ad_angle: v.ad_angle,
      visual_style: v.visual_style,
    });
    valuesClauses.push(
      `($1, $${paramIndex}, $${paramIndex + 1}, $${paramIndex + 2}, $${paramIndex + 3})`
    );
    params.push(i, overrides, v.aspect_ratio, creditCost);
    paramIndex += 4;
  }

  await query(
    `INSERT INTO campaign_variants (campaign_id, variant_index, variable_overrides, aspect_ratio, credits_cost)
     VALUES ${valuesClauses.join(", ")}`,
    params
  );

  return campaign;
}

export async function listCampaigns(
  userId: string,
  opts?: { limit?: number; offset?: number }
): Promise<{ campaigns: Campaign[]; total: number }> {
  const limit = opts?.limit ?? 20;
  const offset = opts?.offset ?? 0;

  const [result, countResult] = await Promise.all([
    query<Campaign>(
      `SELECT * FROM campaigns
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    ),
    queryOne<{ count: string }>(
      `SELECT COUNT(*) AS count FROM campaigns WHERE user_id = $1`,
      [userId]
    ),
  ]);

  return {
    campaigns: result.rows,
    total: parseInt(countResult?.count ?? "0", 10),
  };
}

export async function getCampaign(
  campaignId: string,
  userId: string
): Promise<Campaign | null> {
  return queryOne<Campaign>(
    `SELECT * FROM campaigns WHERE id = $1 AND user_id = $2`,
    [campaignId, userId]
  );
}

export async function getCampaignStatus(
  campaignId: string,
  userId: string
): Promise<{
  campaign: Campaign;
  variants: CampaignVariant[];
} | null> {
  const campaign = await getCampaign(campaignId, userId);
  if (!campaign) return null;

  const result = await query<CampaignVariant>(
    `SELECT * FROM campaign_variants
     WHERE campaign_id = $1
     ORDER BY variant_index ASC`,
    [campaignId]
  );

  return { campaign, variants: result.rows };
}

// ============================================================
// Campaign Processing
// ============================================================

export async function processCampaign(
  campaignId: string
): Promise<void> {
  // Mark campaign as generating
  await query(
    `UPDATE campaigns SET status = 'generating' WHERE id = $1 AND status = 'queued'`,
    [campaignId]
  );

  // Get pending variants
  const result = await query<CampaignVariant>(
    `SELECT * FROM campaign_variants
     WHERE campaign_id = $1 AND status = 'pending'
     ORDER BY variant_index ASC`,
    [campaignId]
  );

  for (const variant of result.rows) {
    await query(
      `UPDATE campaign_variants SET status = 'generating' WHERE id = $1`,
      [variant.id]
    );
  }
}

export async function retryFailedVariants(
  campaignId: string,
  userId: string
): Promise<{ retryCount: number }> {
  // Verify ownership
  const campaign = await getCampaign(campaignId, userId);
  if (!campaign) {
    throw new Error("Campaign not found");
  }

  if (campaign.failed_variants === 0) {
    return { retryCount: 0 };
  }

  // Reset failed variants back to pending
  const result = await query(
    `UPDATE campaign_variants
     SET status = 'pending', error_message = NULL, generation_id = NULL
     WHERE campaign_id = $1 AND status = 'failed'`,
    [campaignId]
  );

  const retryCount = result.rowCount ?? 0;

  if (retryCount > 0) {
    // Reset campaign counters and set back to queued
    await query(
      `UPDATE campaigns
       SET status = 'queued',
           failed_variants = 0
       WHERE id = $1`,
      [campaignId]
    );
  }

  return { retryCount };
}
