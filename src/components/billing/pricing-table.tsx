"use client";

import { PLANS } from "@/lib/constants";
import { createSubscriptionCheckout } from "@/app/actions/billing";
import type { SubscriptionTier } from "@/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckIcon } from "lucide-react";

const FEATURES: Record<SubscriptionTier, string[]> = {
  starter: [
    "100 credits/month",
    "1 brand kit",
    "Image generation",
    "All templates",
  ],
  pro: [
    "300 credits/month",
    "5 brand kits",
    "Image + video generation",
    "All templates",
    "Priority support",
  ],
  business: [
    "750 credits/month",
    "Unlimited brand kits",
    "Image + video generation",
    "All templates",
    "Priority support",
    "Custom branding",
  ],
};

export function PricingTable({ currentTier }: { currentTier: SubscriptionTier }) {
  const tiers = Object.entries(PLANS) as [SubscriptionTier, (typeof PLANS)[SubscriptionTier]][];

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {tiers.map(([tier, plan]) => {
        const isCurrent = tier === currentTier;
        const features = FEATURES[tier];

        return (
          <Card
            key={tier}
            className={
              tier === "pro"
                ? "ring-2 ring-primary"
                : ""
            }
          >
            <CardHeader>
              <div className="flex items-center gap-2">
                <CardTitle>{plan.name}</CardTitle>
                {tier === "pro" && <Badge>Popular</Badge>}
                {isCurrent && <Badge variant="outline">Current</Badge>}
              </div>
              <CardDescription>
                <span className="text-2xl font-semibold text-foreground font-mono">
                  ${plan.price}
                </span>
                <span className="text-muted-foreground">/mo</span>
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2 text-sm">
                    <CheckIcon className="size-4 text-primary" />
                    {feature}
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <form
                action={createSubscriptionCheckout.bind(null, tier)}
                className="w-full"
              >
                <Button
                  type="submit"
                  variant={isCurrent ? "outline" : "default"}
                  className="w-full"
                  disabled={isCurrent}
                >
                  {isCurrent ? "Current Plan" : "Upgrade"}
                </Button>
              </form>
            </CardFooter>
          </Card>
        );
      })}
    </div>
  );
}
