import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe/client";
import { createAdminClient } from "@/lib/supabase/admin";
import { grantCredits } from "@/lib/credits";
import { PLANS, STRIPE_PRICE_IDS } from "@/lib/constants";
import type Stripe from "stripe";
import type { SubscriptionTier } from "@/types";

export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const supabase = createAdminClient();

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.supabase_user_id;
      if (!userId) break;

      if (session.mode === "subscription" && session.subscription) {
        // New subscription — update profile with subscription ID and tier
        const tier = (session.metadata?.tier ?? "starter") as SubscriptionTier;
        const subId =
          typeof session.subscription === "string"
            ? session.subscription
            : session.subscription.id;

        await supabase
          .from("profiles")
          .update({
            stripe_subscription_id: subId,
            subscription_tier: tier,
            subscription_status: "active",
            credits_used_this_period: 0,
            period_reset_at: new Date(
              Date.now() + 30 * 24 * 60 * 60 * 1000
            ).toISOString(),
          })
          .eq("id", userId);

        // Grant initial credits for the new subscription
        const plan = PLANS[tier];
        await grantCredits(
          userId,
          plan.credits,
          "subscription_grant",
          event.id,
          `${plan.name} plan — initial credit grant`
        );
      } else if (session.mode === "payment") {
        // Top-up purchase
        const credits = Number(session.metadata?.credits);
        if (credits > 0) {
          await grantCredits(
            userId,
            credits,
            "topup_purchase",
            event.id,
            `Top-up: ${credits} credits`
          );
        }
      }
      break;
    }

    case "invoice.paid": {
      const invoice = event.data.object as Stripe.Invoice;
      const invoiceSub = (invoice as unknown as { subscription: string | { id: string } | null }).subscription;
      if (!invoiceSub) break;

      const subId =
        typeof invoiceSub === "string"
          ? invoiceSub
          : invoiceSub.id;

      // Find user by subscription ID
      const { data: profile } = await supabase
        .from("profiles")
        .select("id, subscription_tier")
        .eq("stripe_subscription_id", subId)
        .single();

      if (!profile) break;

      // Skip the first invoice (handled by checkout.session.completed)
      const billingReason = (invoice as unknown as { billing_reason?: string }).billing_reason;
      if (billingReason === "subscription_create") break;

      // Monthly renewal — reset usage and grant credits
      const plan = PLANS[profile.subscription_tier as SubscriptionTier];
      await supabase
        .from("profiles")
        .update({
          subscription_status: "active",
          credits_used_this_period: 0,
          period_reset_at: new Date(
            Date.now() + 30 * 24 * 60 * 60 * 1000
          ).toISOString(),
        })
        .eq("id", profile.id);

      await grantCredits(
        profile.id,
        plan.credits,
        "subscription_grant",
        event.id,
        `${plan.name} plan — monthly credit grant`
      );
      break;
    }

    case "customer.subscription.updated": {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId =
        typeof subscription.customer === "string"
          ? subscription.customer
          : subscription.customer.id;

      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("stripe_customer_id", customerId)
        .single();
      if (!profile) break;

      // Map Stripe status to our status
      const statusMap: Record<string, string> = {
        active: "active",
        past_due: "past_due",
        canceled: "canceled",
        trialing: "trialing",
        paused: "paused",
      };

      const newStatus = statusMap[subscription.status] ?? "active";

      // Detect tier change from price
      const priceId = subscription.items.data[0]?.price?.id;
      const tierForPrice = (
        Object.entries(STRIPE_PRICE_IDS) as [SubscriptionTier, string | undefined][]
      ).find(([, id]) => id === priceId)?.[0];

      const updates: Record<string, unknown> = {
        subscription_status: newStatus,
      };
      if (tierForPrice) {
        updates.subscription_tier = tierForPrice;
      }

      await supabase.from("profiles").update(updates).eq("id", profile.id);
      break;
    }

    case "customer.subscription.deleted": {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId =
        typeof subscription.customer === "string"
          ? subscription.customer
          : subscription.customer.id;

      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("stripe_customer_id", customerId)
        .single();
      if (!profile) break;

      await supabase
        .from("profiles")
        .update({
          subscription_status: "canceled",
          stripe_subscription_id: null,
        })
        .eq("id", profile.id);
      break;
    }
  }

  return NextResponse.json({ received: true });
}
