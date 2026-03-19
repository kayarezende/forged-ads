"use server";

import { redirect } from "next/navigation";
import { stripe } from "@/lib/stripe/client";
import { createClient } from "@/lib/supabase/server";
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
    metadata: { supabase_user_id: userId },
  });

  const { createAdminClient } = await import("@/lib/supabase/admin");
  const admin = createAdminClient();
  await admin
    .from("profiles")
    .update({ stripe_customer_id: customer.id })
    .eq("id", userId);

  return customer.id;
}

export async function createSubscriptionCheckout(tier: SubscriptionTier) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: profile } = await supabase
    .from("profiles")
    .select("stripe_customer_id, email")
    .eq("id", user.id)
    .single();
  if (!profile) throw new Error("Profile not found");

  const priceId = STRIPE_PRICE_IDS[tier];
  if (!priceId) throw new Error(`No price configured for ${tier}`);

  const customerId = await getOrCreateStripeCustomer(
    user.id,
    profile.email,
    profile.stripe_customer_id
  );

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing/return?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing`,
    metadata: { supabase_user_id: user.id, tier },
  });

  redirect(session.url!);
}

export async function createTopUpCheckout(packageIndex: number) {
  const pkg = TOPUP_PACKAGES[packageIndex];
  if (!pkg?.priceId) throw new Error("Invalid top-up package");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: profile } = await supabase
    .from("profiles")
    .select("stripe_customer_id, email")
    .eq("id", user.id)
    .single();
  if (!profile) throw new Error("Profile not found");

  const customerId = await getOrCreateStripeCustomer(
    user.id,
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
      supabase_user_id: user.id,
      type: "topup",
      credits: String(pkg.credits),
    },
  });

  redirect(session.url!);
}

export async function createPortalSession() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");

  const { data: profile } = await supabase
    .from("profiles")
    .select("stripe_customer_id")
    .eq("id", user.id)
    .single();
  if (!profile?.stripe_customer_id) throw new Error("No Stripe customer");

  const session = await stripe.billingPortal.sessions.create({
    customer: profile.stripe_customer_id,
    return_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing`,
  });

  redirect(session.url);
}
