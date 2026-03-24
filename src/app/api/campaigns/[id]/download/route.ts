import { NextResponse } from "next/server";
import { getUserId } from "@/lib/auth";
import { getCampaign } from "@/lib/campaigns";
import { query } from "@/lib/db";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userId = await getUserId();

    const campaign = await getCampaign(id, userId);
    if (!campaign) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }

    // Fetch all completed variants with their generation output URLs
    const result = await query<{
      variant_index: number;
      aspect_ratio: string;
      variable_overrides: Record<string, string>;
      generation_id: string;
      output_url: string;
      thumbnail_url: string | null;
    }>(
      `SELECT cv.variant_index, cv.aspect_ratio, cv.variable_overrides,
              g.id AS generation_id, g.output_url, g.thumbnail_url
       FROM campaign_variants cv
       JOIN generations g ON g.id = cv.generation_id
       WHERE cv.campaign_id = $1 AND cv.status = 'completed' AND g.output_url IS NOT NULL
       ORDER BY cv.variant_index ASC`,
      [id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: "No completed variants to download" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      campaign_id: id,
      campaign_name: campaign.name,
      total: result.rows.length,
      files: result.rows.map((row) => ({
        variant_index: row.variant_index,
        aspect_ratio: row.aspect_ratio,
        overrides: row.variable_overrides,
        generation_id: row.generation_id,
        output_url: row.output_url,
        thumbnail_url: row.thumbnail_url,
      })),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch downloads";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
