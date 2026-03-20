import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe/client";
import { queryOne } from "@/lib/db";
import { getUserId } from "@/lib/auth";

export async function POST() {
  try {
    const userId = await getUserId();

    const profile = await queryOne<{ stripe_customer_id: string | null }>(
      "SELECT stripe_customer_id FROM profiles WHERE id = $1",
      [userId]
    );

    if (!profile?.stripe_customer_id) {
      return NextResponse.json(
        { error: "No billing account found" },
        { status: 400 }
      );
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: profile.stripe_customer_id,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/billing`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Billing portal error:", error);
    return NextResponse.json(
      { error: "Failed to create portal session" },
      { status: 500 }
    );
  }
}
