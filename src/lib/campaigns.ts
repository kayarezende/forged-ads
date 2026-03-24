import { query, queryOne } from "@/lib/db";
import type {
  Campaign,
  CampaignInput,
  CampaignVariant,
  BrandKit,
  AdAngle,
  VisualStyle,
  CampaignPlacement,
  AspectRatio,
} from "@/types";
import { CAMPAIGN_PLACEMENTS, CREDIT_COSTS, AI_MODELS } from "@/lib/constants";
import { generateImage } from "@/lib/ai/openrouter";
import { buildCampaignPrompt } from "@/lib/ai/campaign-prompt";
import { saveBase64File } from "@/lib/storage";
import { refundCampaignCredit } from "@/lib/credits";

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

const SORT_OPTIONS = {
  newest: "created_at DESC",
  oldest: "created_at ASC",
  name_asc: "name ASC",
  name_desc: "name DESC",
} as const;

export type CampaignSortKey = keyof typeof SORT_OPTIONS;

export async function listCampaigns(
  userId: string,
  opts?: { limit?: number; offset?: number; status?: string; sort?: string }
): Promise<{ campaigns: Campaign[]; total: number }> {
  const limit = opts?.limit ?? 20;
  const offset = opts?.offset ?? 0;
  const orderBy = SORT_OPTIONS[(opts?.sort ?? "newest") as CampaignSortKey] ?? SORT_OPTIONS.newest;

  let whereClause = "WHERE user_id = $1";
  const params: unknown[] = [userId];

  if (opts?.status && opts.status !== "all") {
    params.push(opts.status);
    whereClause += ` AND status = $${params.length}`;
  }

  params.push(limit, offset);
  const limitIdx = params.length - 1;
  const offsetIdx = params.length;

  const [result, countResult] = await Promise.all([
    query<Campaign>(
      `SELECT * FROM campaigns
       ${whereClause}
       ORDER BY ${orderBy}
       LIMIT $${limitIdx} OFFSET $${offsetIdx}`,
      params
    ),
    queryOne<{ count: string }>(
      `SELECT COUNT(*) AS count FROM campaigns ${whereClause}`,
      params.slice(0, -2)
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
  // 1. Load campaign
  const campaign = await queryOne<Campaign & { metadata: Record<string, unknown> }>(
    `SELECT * FROM campaigns WHERE id = $1`,
    [campaignId]
  );
  if (!campaign) {
    throw new Error(`Campaign not found: ${campaignId}`);
  }

  // Mark campaign as generating
  const updateResult = await query(
    `UPDATE campaigns SET status = 'generating' WHERE id = $1 AND status = 'queued'`,
    [campaignId]
  );
  if ((updateResult.rowCount ?? 0) === 0) {
    throw new Error(`Campaign ${campaignId} is not in queued status`);
  }

  // Parse campaign metadata for prompt building
  const meta = typeof campaign.metadata === "string"
    ? JSON.parse(campaign.metadata as string)
    : campaign.metadata;
  const productDescription: string = meta.product_description ?? "";
  const targetAudience: string | null = meta.target_audience ?? null;

  // 2. If brand_kit_id exists, fetch the brand kit
  let brandKit: BrandKit | null = null;
  if (campaign.brand_kit_id) {
    brandKit = await queryOne<BrandKit>(
      `SELECT * FROM brand_kits WHERE id = $1`,
      [campaign.brand_kit_id]
    );
  }

  // 3. Get all pending variants
  const result = await query<CampaignVariant & {
    variable_overrides: Record<string, string> | string;
    aspect_ratio: string;
    credits_cost: number;
  }>(
    `SELECT * FROM campaign_variants
     WHERE campaign_id = $1 AND status = 'pending'
     ORDER BY variant_index ASC`,
    [campaignId]
  );
  const pendingVariants = result.rows;

  if (pendingVariants.length === 0) {
    // No pending variants — finalize campaign status
    await queryOne(`SELECT update_campaign_progress($1)`, [campaignId]);
    return;
  }

  // 4. Process in batches of 5
  const BATCH_SIZE = 5;
  for (let i = 0; i < pendingVariants.length; i += BATCH_SIZE) {
    const batch = pendingVariants.slice(i, i + BATCH_SIZE);

    const settled = await Promise.allSettled(
      batch.map((variant) => processVariant(variant, {
        campaignId,
        userId: campaign.user_id,
        productDescription,
        targetAudience,
        brandKit,
      }))
    );

    // Handle results
    for (let j = 0; j < settled.length; j++) {
      const outcome = settled[j];
      const variant = batch[j];

      if (outcome.status === "rejected") {
        const errorMsg = outcome.reason instanceof Error
          ? outcome.reason.message
          : String(outcome.reason);

        // 6. On failure: mark variant failed, refund credit
        await query(
          `UPDATE campaign_variants
           SET status = 'failed', error_message = $1
           WHERE id = $2`,
          [errorMsg.slice(0, 500), variant.id]
        );

        try {
          await refundCampaignCredit(
            campaign.user_id,
            campaignId,
            variant.credits_cost ?? CREDIT_COSTS.image
          );
        } catch {
          // Best-effort refund — don't mask the variant error
        }
      }
    }
  }

  // 7. After all batches: update campaign status via DB function
  await queryOne(`SELECT update_campaign_progress($1)`, [campaignId]);
}

// ---- Helpers for processCampaign ----

interface VariantContext {
  campaignId: string;
  userId: string;
  productDescription: string;
  targetAudience: string | null;
  brandKit: BrandKit | null;
}

async function processVariant(
  variant: CampaignVariant & {
    variable_overrides: Record<string, string> | string;
    aspect_ratio: string;
    credits_cost: number;
  },
  ctx: VariantContext
): Promise<void> {
  // Mark variant as generating
  await query(
    `UPDATE campaign_variants SET status = 'generating' WHERE id = $1`,
    [variant.id]
  );

  // 5a. Parse variable_overrides
  const overrides = typeof variant.variable_overrides === "string"
    ? JSON.parse(variant.variable_overrides)
    : variant.variable_overrides;

  const placement = overrides.placement as CampaignPlacement;
  const adAngle = overrides.ad_angle as AdAngle;
  const visualStyle = overrides.visual_style as VisualStyle;

  // 5b. Build prompt
  const prompt = buildCampaignPrompt({
    productDescription: ctx.productDescription,
    targetAudience: ctx.targetAudience,
    adAngle,
    visualStyle,
    placement,
    brandKit: ctx.brandKit,
  });

  // 5c. Get aspect ratio from the variant column
  const aspectRatio = (variant.aspect_ratio || "1:1") as AspectRatio;

  // 5d. Call image generation API
  const startTime = Date.now();
  const result = await generateImage({ prompt, aspectRatio });
  const generationTimeMs = Date.now() - startTime;

  // 5e-f. Save image to disk (Gemini returns base64 directly)
  const generationId = crypto.randomUUID();
  const publicUrl = await saveBase64File(result.base64, {
    directory: "generations",
    filename: `${generationId}.png`,
    extension: "png",
  });

  // 5g. INSERT into generations table
  await query(
    `INSERT INTO generations
      (id, user_id, brand_kit_id, campaign_id, content_type, model, prompt,
       aspect_ratio, ad_angle, visual_style, placement,
       output_url, thumbnail_url, status, credits_cost, generation_time_ms, metadata)
     VALUES ($1, $2, $3, $4, 'image', $5, $6,
             $7, $8, $9, $10,
             $11, $11, 'completed', $12, $13, $14)`,
    [
      generationId,
      ctx.userId,
      ctx.brandKit?.id ?? null,
      ctx.campaignId,
      AI_MODELS.image,
      prompt,
      aspectRatio,
      adAngle,
      visualStyle,
      placement,
      publicUrl,
      variant.credits_cost ?? CREDIT_COSTS.image,
      generationTimeMs,
      JSON.stringify({
        model_used: result.model,
        variant_id: variant.id,
      }),
    ]
  );

  // 5h. UPDATE variant: set generation_id, status='completed'
  await query(
    `UPDATE campaign_variants
     SET generation_id = $1, status = 'completed'
     WHERE id = $2`,
    [generationId, variant.id]
  );
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
