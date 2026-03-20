import { NextResponse } from "next/server";
import { getUserId } from "@/lib/auth";
import { query, queryOne } from "@/lib/db";

export async function GET() {
  try {
    const userId = await getUserId();

    const profile = await queryOne<{
      display_name: string | null;
      email: string;
      avatar_url: string | null;
      subscription_tier: string;
      credits_balance: number;
    }>(
      `SELECT p.display_name, p.email, p.avatar_url,
              p.subscription_tier, p.credits_balance
       FROM profiles p
       WHERE p.id = $1`,
      [userId]
    );

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    return NextResponse.json(profile);
  } catch (error) {
    console.error("Get settings error:", error);
    return NextResponse.json(
      { error: "Failed to fetch settings" },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const userId = await getUserId();
    const body = await request.json();

    const { display_name } = body as { display_name?: string };

    if (display_name !== undefined) {
      const trimmed = display_name.trim();
      if (!trimmed) {
        return NextResponse.json(
          { error: "Display name cannot be empty" },
          { status: 400 }
        );
      }
      if (trimmed.length > 100) {
        return NextResponse.json(
          { error: "Display name is too long" },
          { status: 400 }
        );
      }

      await query("UPDATE profiles SET display_name = $1 WHERE id = $2", [
        trimmed,
        userId,
      ]);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Update settings error:", error);
    return NextResponse.json(
      { error: "Failed to update settings" },
      { status: 500 }
    );
  }
}
