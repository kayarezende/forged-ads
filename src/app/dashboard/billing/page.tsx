import type { Metadata } from "next";
import { getCurrentProfile } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PLANS } from "@/lib/constants";
import type { Profile, SubscriptionTier } from "@/types";
import { PricingTable } from "@/components/billing/pricing-table";
import { TopUpModal } from "@/components/billing/top-up-modal";
import { ManageSubscriptionButton } from "@/components/billing/manage-subscription-button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export const metadata: Metadata = {
  title: "Billing",
  description: "Manage your subscription, credits, and billing.",
};

export default async function BillingPage() {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/login");

  const p = profile as Profile;
  const plan = PLANS[p.subscription_tier as SubscriptionTier];

  const statusVariant =
    p.subscription_status === "active"
      ? "default"
      : p.subscription_status === "past_due"
        ? "destructive"
        : "secondary";

  return (
    <div className="mx-auto w-full max-w-4xl space-y-8 px-4 py-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Billing</h1>
        <p className="text-sm text-muted-foreground">
          Manage your subscription, credits, and usage.
        </p>
      </div>

      {/* Current plan overview */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardDescription>Current Plan</CardDescription>
            <CardTitle className="flex items-center gap-2">
              {plan.name}
              <Badge variant={statusVariant} className="capitalize">
                {p.subscription_status}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold font-mono">
              ${plan.price}
              <span className="text-sm font-normal text-muted-foreground">
                /mo
              </span>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardDescription>Credit Balance</CardDescription>
            <CardTitle className="font-mono text-2xl">
              {p.credits_balance}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <TopUpModal />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardDescription>Usage This Period</CardDescription>
            <CardTitle className="font-mono text-2xl">
              {p.credits_used_this_period}
              <span className="text-sm font-normal text-muted-foreground">
                {" "}
                / {plan.credits}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{
                  width: `${Math.min(100, (p.credits_used_this_period / plan.credits) * 100)}%`,
                }}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Manage subscription */}
      {p.stripe_subscription_id && (
        <div className="flex items-center gap-3">
          <ManageSubscriptionButton />
          <span className="text-sm text-muted-foreground">
            Manage payment methods, invoices, and cancellation via Stripe.
          </span>
        </div>
      )}

      <Separator />

      {/* Pricing table for upgrades */}
      <div>
        <h2 className="mb-4 text-lg font-semibold">Plans</h2>
        <PricingTable currentTier={p.subscription_tier as SubscriptionTier} />
      </div>
    </div>
  );
}
