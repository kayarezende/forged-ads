import { NextResponse } from "next/server";
import { getUserId } from "@/lib/auth";
import { retryFailedVariants } from "@/lib/campaigns";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userId = await getUserId();

    const { retryCount } = await retryFailedVariants(id, userId);

    return NextResponse.json({ retryCount });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to retry campaign";
    const status = message === "Campaign not found" ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
