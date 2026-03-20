import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe/client";
import { query, queryOne } from "@/lib/db";
import { getUserId } from "@/lib/auth";
import { STRIPE_PRICE_IDS, TOPUP_PACKAGES } from "@/lib/constants";
import type { SubscriptionTier } from "@/types";

async function getOrCreateStripeCustomer(
  userId: string,
  email: string,
  existingCustomerId: string | null
): Promise<string> {
  if (existingCustomerId) return existingCustomerId;

  const customer = await stripe.customers.create({
    email,
    metadata: { user_id: userId },
  });

  await query("UPDATE profiles SET stripe_customer_id = $1 WHERE id = $2", [
    customer.id,
    userId,
  ]);

  return customer.id;
}

export async function POST(request: Request) {
  try {
    const userId = await getUserId();
    const body = await request.json();

    const profile = await queryOne<{
      stripe_customer_id: string | null;
      email: string;
    }>("SELECT stripe_customer_id, email FROM profiles WHERE id = $1", [userId]);
    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const customerId = await getOrCreateStripeCustomer(
      userId,
      profile.email,
      profile.stripe_customer_id
    );

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

    if (body.type === "topup") {
      const pkg = TOPUP_PACKAGES[body.packageIndex as number];
      if (!pkg?.priceId) {
        return NextResponse.json({ error: "Invalid top-up package" }, { status: 400 });
      }

      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        customer: customerId,
        line_items: [{ price: pkg.priceId, quantity: 1 }],
        success_url: `${appUrl}/billing/return?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${appUrl}/billing`,
        metadata: {
          user_id: userId,
          type: "topup",
          credits: String(pkg.credits),
        },
      });

      return NextResponse.json({ url: session.url });
    }

    // Subscription checkout
    const tier = body.tier as SubscriptionTier;
    if (!tier || !STRIPE_PRICE_IDS[tier]) {
      return NextResponse.json({ error: "Invalid subscription tier" }, { status: 400 });
    }

    const priceId = STRIPE_PRICE_IDS[tier]!;

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${appUrl}/billing/return?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/billing`,
      metadata: { user_id: userId, tier },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Billing checkout error:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
