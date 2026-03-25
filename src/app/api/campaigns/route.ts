import { NextResponse } from "next/server";
import { after } from "next/server";
import { getUserId } from "@/lib/auth";
import { createCampaign, listCampaigns, processCampaign } from "@/lib/campaigns";
import { deductCampaignCredits } from "@/lib/credits";
import { CREDIT_COSTS } from "@/lib/constants";
import type { CampaignInput } from "@/types";

export async function POST(request: Request) {
  try {
    const userId = await getUserId();
    const body = (await request.json()) as Partial<CampaignInput>;

    // Validate required fields
    if (!body.name || typeof body.name !== "string" || body.name.trim().length === 0) {
      return NextResponse.json({ error: "Campaign name is required" }, { status: 400 });
    }
    // brand_kit_id is optional
    if (!body.product_description || body.product_description.trim().length === 0) {
      return NextResponse.json({ error: "Product description is required" }, { status: 400 });
    }
    if (!body.content_type || (body.content_type !== "image" && body.content_type !== "video")) {
      return NextResponse.json({ error: "Valid content_type is required" }, { status: 400 });
    }
    if (!body.placements || body.placements.length === 0) {
      return NextResponse.json({ error: "At least one placement is required" }, { status: 400 });
    }
    if (!body.ad_angles || body.ad_angles.length === 0) {
      return NextResponse.json({ error: "At least one ad angle is required" }, { status: 400 });
    }
    if (!body.visual_styles || body.visual_styles.length === 0) {
      return NextResponse.json({ error: "At least one visual style is required" }, { status: 400 });
    }

    const input: CampaignInput = {
      name: body.name.trim(),
      brand_kit_id: body.brand_kit_id || "",
      template_id: body.template_id,
      product_description: body.product_description.trim(),
      target_audience: body.target_audience?.trim() || undefined,
      content_type: body.content_type,
      placements: body.placements,
      ad_angles: body.ad_angles,
      visual_styles: body.visual_styles,
    };

    // Create campaign + variants
    const campaign = await createCampaign(userId, input);

    // Deduct credits for the entire batch
    const totalCost = campaign.total_variants * CREDIT_COSTS[input.content_type];
    const credited = await deductCampaignCredits(
      userId,
      campaign.id,
      totalCost,
      `Campaign: ${input.name}`
    );

    if (!credited) {
      return NextResponse.json(
        { error: "Insufficient credits", required: totalCost },
        { status: 402 }
      );
    }

    // Fire-and-forget background processing (works in both dev and production)
    processCampaign(campaign.id).catch((e) =>
      console.error("Campaign processing failed:", e)
    );

    return NextResponse.json(campaign, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to create campaign";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const userId = await getUserId();
    const { searchParams } = new URL(request.url);

    const limit = Math.min(50, Math.max(1, Number(searchParams.get("limit") ?? 20)));
    const offset = Math.max(0, Number(searchParams.get("offset") ?? 0));

    const { campaigns, total } = await listCampaigns(userId, { limit, offset });

    return NextResponse.json({ campaigns, total });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch campaigns";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
