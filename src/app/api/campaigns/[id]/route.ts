import { NextResponse } from "next/server";
import { getUserId } from "@/lib/auth";
import { getCampaign } from "@/lib/campaigns";

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

    return NextResponse.json(campaign);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch campaign";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
