import { notFound } from "next/navigation";
import { getUserId } from "@/lib/auth";
import { getCampaign } from "@/lib/campaigns";
import { query } from "@/lib/db";
import { CampaignDetailContent } from "@/components/campaigns/campaign-detail-content";
import type { GenerationStatus } from "@/types";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return {
    title: `Campaign ${id.slice(0, 8)}`,
    description: "Campaign detail and variant tracking.",
  };
}

// Raw DB row shape for campaign_variants (variable_overrides is JSONB)
interface RawVariantRow {
  id: string;
  campaign_id: string;
  generation_id: string | null;
  variant_index: number;
  variable_overrides: { placement?: string; ad_angle?: string; visual_style?: string };
  aspect_ratio: string;
  status: GenerationStatus;
  error_message: string | null;
  created_at: string;
}

export default async function CampaignDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const userId = await getUserId();

  const campaign = await getCampaign(id, userId);
  if (!campaign) notFound();

  // Query variants with raw shape (variable_overrides is JSONB)
  const variantsResult = await query<RawVariantRow>(
    `SELECT id, campaign_id, generation_id, variant_index, variable_overrides,
            aspect_ratio, status, error_message, created_at
     FROM campaign_variants
     WHERE campaign_id = $1
     ORDER BY variant_index ASC`,
    [id]
  );

  // Flatten variable_overrides into top-level fields for the UI
  const variants = variantsResult.rows.map((row) => ({
    id: row.id,
    campaign_id: row.campaign_id,
    generation_id: row.generation_id,
    variant_index: row.variant_index,
    placement: row.variable_overrides?.placement ?? "unknown",
    ad_angle: row.variable_overrides?.ad_angle ?? "unknown",
    visual_style: row.variable_overrides?.visual_style ?? "unknown",
    aspect_ratio: row.aspect_ratio,
    status: row.status,
    error_message: row.error_message,
    created_at: row.created_at,
  }));

  // Fetch download data for completed variants
  const downloadResult = await query<{
    variant_index: number;
    generation_id: string;
    output_url: string;
    thumbnail_url: string | null;
    variable_overrides: Record<string, string>;
  }>(
    `SELECT cv.variant_index, g.id AS generation_id, g.output_url, g.thumbnail_url,
            cv.variable_overrides
     FROM campaign_variants cv
     JOIN generations g ON g.id = cv.generation_id
     WHERE cv.campaign_id = $1 AND cv.status = 'completed' AND g.output_url IS NOT NULL
     ORDER BY cv.variant_index ASC`,
    [id]
  );

  const downloadFiles = downloadResult.rows.map((row) => ({
    variant_index: row.variant_index,
    generation_id: row.generation_id,
    output_url: row.output_url,
    thumbnail_url: row.thumbnail_url,
    overrides: row.variable_overrides,
  }));

  return (
    <CampaignDetailContent
      campaign={campaign}
      variants={variants}
      downloadFiles={downloadFiles}
    />
  );
}
