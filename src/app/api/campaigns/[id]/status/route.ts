import { NextResponse } from "next/server";
import { getUserId } from "@/lib/auth";
import { getCampaignStatus } from "@/lib/campaigns";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userId = await getUserId();

    const result = await getCampaignStatus(id, userId);
    if (!result) {
      return NextResponse.json({ error: "Campaign not found" }, { status: 404 });
    }

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to fetch campaign status";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
