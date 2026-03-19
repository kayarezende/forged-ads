import type { Metadata } from "next";
import Link from "next/link";
import { Check, ArrowRight, Minus } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/lib/button-variants";
import { PLANS, TOPUP_PACKAGES, CREDIT_COSTS } from "@/lib/constants";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Pricing",
  description:
    "Simple, transparent pricing for ForgedAds. Start free, scale as you grow. Plans from $29/month.",
  openGraph: {
    title: "Pricing — ForgedAds",
    description:
      "Simple, transparent pricing. Start free, scale as you grow. Plans from $29/month.",
  },
};

const tiers = [
  {
    key: "starter" as const,
    features: [
      { text: "100 credits / month", included: true },
      { text: "1 brand kit", included: true },
      { text: "AI image generation", included: true },
      { text: "All ad templates", included: true },
      { text: "Email support", included: true },
      { text: "Video generation", included: false },
      { text: "API access", included: false },
      { text: "Dedicated account manager", included: false },
    ],
  },
  {
    key: "pro" as const,
    popular: true,
    features: [
      { text: "300 credits / month", included: true },
      { text: "5 brand kits", included: true },
      { text: "AI image generation", included: true },
      { text: "All ad templates", included: true },
      { text: "Priority support", included: true },
      { text: "Video generation", included: true },
      { text: "API access", included: true },
      { text: "Dedicated account manager", included: false },
    ],
  },
  {
    key: "business" as const,
    features: [
      { text: "750 credits / month", included: true },
      { text: "Unlimited brand kits", included: true },
      { text: "AI image generation", included: true },
      { text: "All ad templates", included: true },
      { text: "Priority support", included: true },
      { text: "Video generation", included: true },
      { text: "API access", included: true },
      { text: "Dedicated account manager", included: true },
    ],
  },
];

export default function PricingPage() {
  return (
    <main>
      {/* Hero */}
      <section className="flex flex-col items-center px-6 pt-36 pb-20 text-center sm:pt-44">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
          Simple, <span className="text-primary">transparent</span> pricing
        </h1>
        <p className="mt-4 max-w-lg text-base leading-relaxed text-muted-foreground sm:text-lg">
          Start free. Scale as you grow. Cancel anytime. No hidden fees.
        </p>
      </section>

      {/* Pricing cards */}
      <section className="mx-auto max-w-5xl px-6 pb-24">
        <div className="grid gap-6 sm:grid-cols-3">
          {tiers.map((tier) => {
            const plan = PLANS[tier.key];
            return (
              <Card
                key={tier.key}
                className={cn(
                  "relative flex flex-col",
                  tier.popular && "ring-1 ring-primary/40"
                )}
              >
                {tier.popular && (
                  <Badge className="absolute -top-2.5 left-4">
                    Most popular
                  </Badge>
                )}

                <CardHeader>
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {plan.name}
                  </CardTitle>
                  <CardDescription className="mt-1">
                    <span className="text-4xl font-bold tracking-tight text-foreground font-mono">
                      ${plan.price}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {" "}/ month
                    </span>
                  </CardDescription>
                </CardHeader>

                <CardContent className="flex-1">
                  <ul className="space-y-3">
                    {tier.features.map((feature) => (
                      <li
                        key={feature.text}
                        className={cn(
                          "flex items-start gap-2.5 text-sm",
                          feature.included
                            ? "text-muted-foreground"
                            : "text-muted-foreground/40"
                        )}
                      >
                        {feature.included ? (
                          <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                        ) : (
                          <Minus className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                        )}
                        {feature.text}
                      </li>
                    ))}
                  </ul>
                </CardContent>

                <CardFooter>
                  <Link
                    href="/signup"
                    className={cn(
                      buttonVariants({
                        variant: tier.popular ? "default" : "outline",
                        size: "sm",
                      }),
                      "w-full"
                    )}
                  >
                    Get started
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Credit costs */}
      <section className="border-t border-border/40 bg-card/20">
        <div className="mx-auto max-w-3xl px-6 py-24">
          <h2 className="mb-4 text-center text-2xl font-bold tracking-tight">
            Credit costs
          </h2>
          <p className="mb-10 text-center text-muted-foreground">
            Every generation uses credits. Here&apos;s what each type costs.
          </p>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-border/50 p-6 text-center">
              <p className="text-3xl font-bold font-mono">
                {CREDIT_COSTS.image}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                credit per image
              </p>
            </div>
            <div className="rounded-xl border border-border/50 p-6 text-center">
              <p className="text-3xl font-bold font-mono">
                {CREDIT_COSTS.video}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                credits per video
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Top-up packages */}
      <section className="mx-auto max-w-3xl px-6 py-24">
        <h2 className="mb-4 text-center text-2xl font-bold tracking-tight">
          Need more credits?
        </h2>
        <p className="mb-10 text-center text-muted-foreground">
          Top up anytime with one-time credit packs.
        </p>

        <div className="grid gap-4 sm:grid-cols-3">
          {TOPUP_PACKAGES.map((pkg) => (
            <div
              key={pkg.credits}
              className="rounded-xl border border-border/50 p-6 text-center"
            >
              <p className="text-2xl font-bold font-mono">{pkg.credits}</p>
              <p className="text-sm text-muted-foreground">credits</p>
              <p className="mt-3 text-lg font-semibold font-mono">
                ${pkg.price}
              </p>
              <p className="text-xs text-muted-foreground">
                ${(pkg.price / pkg.credits).toFixed(2)} per credit
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ / CTA */}
      <section className="border-t border-border/40 px-6 py-24 text-center">
        <h2 className="text-3xl font-bold tracking-tight">
          Ready to get started?
        </h2>
        <p className="mx-auto mt-3 max-w-md text-muted-foreground">
          Try ForgedAds free. No credit card required. Upgrade when you&apos;re
          ready.
        </p>
        <div className="mt-8 flex justify-center">
          <Link
            href="/signup"
            className={cn(buttonVariants({ size: "lg" }), "gap-1.5")}
          >
            Start free trial
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </main>
  );
}
