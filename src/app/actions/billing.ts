"use server";

import { redirect } from "next/navigation";
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

export async function createSubscriptionCheckout(tier: SubscriptionTier) {
  const userId = await getUserId();

  const profile = await queryOne<{
    stripe_customer_id: string | null;
    email: string;
  }>("SELECT stripe_customer_id, email FROM profiles WHERE id = $1", [userId]);
  if (!profile) throw new Error("Profile not found");

  const priceId = STRIPE_PRICE_IDS[tier];
  if (!priceId) throw new Error(`No price configured for ${tier}`);

  const customerId = await getOrCreateStripeCustomer(
    userId,
    profile.email,
    profile.stripe_customer_id
  );

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing/return?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing`,
    metadata: { user_id: userId, tier },
  });

  redirect(session.url!);
}

export async function createTopUpCheckout(packageIndex: number) {
  const pkg = TOPUP_PACKAGES[packageIndex];
  if (!pkg?.priceId) throw new Error("Invalid top-up package");

  const userId = await getUserId();

  const profile = await queryOne<{
    stripe_customer_id: string | null;
    email: string;
  }>("SELECT stripe_customer_id, email FROM profiles WHERE id = $1", [userId]);
  if (!profile) throw new Error("Profile not found");

  const customerId = await getOrCreateStripeCustomer(
    userId,
    profile.email,
    profile.stripe_customer_id
  );

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer: customerId,
    line_items: [{ price: pkg.priceId, quantity: 1 }],
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing/return?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing`,
    metadata: {
      user_id: userId,
      type: "topup",
      credits: String(pkg.credits),
    },
  });

  redirect(session.url!);
}

export async function createPortalSession() {
  const userId = await getUserId();

  const profile = await queryOne<{ stripe_customer_id: string | null }>(
    "SELECT stripe_customer_id FROM profiles WHERE id = $1",
    [userId]
  );
  if (!profile?.stripe_customer_id) throw new Error("No Stripe customer");

  const session = await stripe.billingPortal.sessions.create({
    customer: profile.stripe_customer_id,
    return_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing`,
  });

  redirect(session.url);
}
