import { NextResponse } from "next/server";
import { getUserId } from "@/lib/auth";
import { retryFailedVariants, processCampaign, getCampaign } from "@/lib/campaigns";

export async function POST(
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

    // Reset failed variants back to pending
    const { retryCount } = await retryFailedVariants(id, userId);

    // Trigger processing for any pending variants (handles both retry and resume)
    processCampaign(id).catch((e) =>
      console.error("Campaign processing failed:", e)
    );

    return NextResponse.json({ retryCount, status: "processing" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to retry campaign";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
