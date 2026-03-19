import Link from "next/link";
import {
  Sparkles,
  Palette,
  LayoutGrid,
  Film,
  Check,
  ArrowRight,
  Zap,
} from "lucide-react";
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
import { PLANS } from "@/lib/constants";
import { cn } from "@/lib/utils";

const features = [
  {
    icon: Sparkles,
    title: "AI Image Generation",
    description:
      "Studio-quality product photos and ad creatives generated in seconds — no photographer, no studio.",
  },
  {
    icon: Palette,
    title: "Brand Kits",
    description:
      "Lock in your brand identity. Colors, fonts, logos, and tone stay consistent across every creative.",
  },
  {
    icon: LayoutGrid,
    title: "Ad Templates",
    description:
      "100+ battle-tested templates optimized for Meta, Google, TikTok, and every major platform.",
  },
  {
    icon: Film,
    title: "Video Ads",
    description:
      "Turn static products into scroll-stopping video ads. AI-powered motion, zero editing required.",
  },
];

const tiers = [
  {
    key: "starter" as const,
    features: [
      "100 credits / month",
      "1 brand kit",
      "AI image generation",
      "All ad templates",
      "Email support",
    ],
  },
  {
    key: "pro" as const,
    popular: true,
    features: [
      "300 credits / month",
      "5 brand kits",
      "Image + video generation",
      "Priority support",
      "API access",
    ],
  },
  {
    key: "business" as const,
    features: [
      "750 credits / month",
      "Unlimited brand kits",
      "Everything in Pro",
      "Dedicated account manager",
      "Custom integrations",
    ],
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* ── Nav ── */}
      <nav className="fixed top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-6">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary">
              <Zap className="h-3.5 w-3.5 text-primary-foreground" />
            </div>
            <span className="text-[15px] font-semibold tracking-tight">
              ForgedAds
            </span>
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className={buttonVariants({ size: "sm" })}
            >
              Get started
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative flex flex-col items-center px-6 pt-36 pb-28 sm:pt-44 sm:pb-36">
        {/* Warm ambient glow */}
        <div className="pointer-events-none absolute top-[-10%] left-1/2 h-[600px] w-[900px] -translate-x-1/2 rounded-full bg-primary/[0.07] blur-[140px]" />

        <div className="relative z-10 flex max-w-2xl flex-col items-center gap-6 text-center">
          <Badge variant="secondary" className="gap-1.5 text-xs">
            <Sparkles className="h-3 w-3 text-primary" />
            AI-powered ad creative platform
          </Badge>

          <h1 className="text-5xl font-bold leading-[1.08] tracking-tight sm:text-6xl lg:text-7xl">
            Forge ads
            <br />
            that <span className="text-primary">sell</span>.
          </h1>

          <p className="max-w-lg text-base leading-relaxed text-muted-foreground sm:text-lg">
            Studio-quality product photos, ad creatives, and video — generated
            in seconds. Built for e-commerce brands that move fast.
          </p>

          <div className="mt-2 flex gap-3">
            <Link
              href="/signup"
              className={cn(buttonVariants({ size: "lg" }), "gap-1.5")}
            >
              Start free trial
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="#pricing"
              className={buttonVariants({ variant: "outline", size: "lg" })}
            >
              See pricing
            </Link>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="mx-auto max-w-6xl px-6 py-24">
        <div className="mb-14 text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Everything you need to create at scale
          </h2>
          <p className="mt-3 text-muted-foreground">
            Four tools. One platform. Unlimited creative output.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {features.map((f) => (
            <div
              key={f.title}
              className="group rounded-xl border border-border/50 bg-card/40 p-6 transition-all hover:border-primary/25 hover:bg-card/80"
            >
              <div className="mb-4 flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                <f.icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="text-[15px] font-semibold">{f.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                {f.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" className="mx-auto max-w-6xl px-6 py-24">
        <div className="mb-14 text-center">
          <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Simple, transparent pricing
          </h2>
          <p className="mt-3 text-muted-foreground">
            Start free. Scale as you grow. Cancel anytime.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
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
                    <span className="text-3xl font-bold tracking-tight text-foreground font-mono">
                      ${plan.price}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {" "}
                      / month
                    </span>
                  </CardDescription>
                </CardHeader>

                <CardContent className="flex-1">
                  <ul className="space-y-3">
                    {tier.features.map((feature) => (
                      <li
                        key={feature}
                        className="flex items-start gap-2.5 text-sm text-muted-foreground"
                      >
                        <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                        {feature}
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
                  </Link>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-border/40 py-8">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 text-sm text-muted-foreground">
          <span>&copy; 2026 ForgedAds</span>
          <div className="flex gap-6">
            <Link
              href="/login"
              className="transition-colors hover:text-foreground"
            >
              Log in
            </Link>
            <Link
              href="/signup"
              className="transition-colors hover:text-foreground"
            >
              Sign up
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
