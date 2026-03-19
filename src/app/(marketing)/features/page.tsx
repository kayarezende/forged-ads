import type { Metadata } from "next";
import Link from "next/link";
import {
  Sparkles,
  Palette,
  LayoutGrid,
  Film,
  Gauge,
  Shield,
  Layers,
  Wand2,
  ArrowRight,
} from "lucide-react";
import { buttonVariants } from "@/lib/button-variants";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Features",
  description:
    "AI image generation, brand kits, ad templates, and video ads — everything you need to create ad creatives at scale.",
  openGraph: {
    title: "Features — ForgedAds",
    description:
      "AI image generation, brand kits, ad templates, and video ads — everything you need to create ad creatives at scale.",
  },
};

const highlights = [
  {
    icon: Sparkles,
    title: "AI Image Generation",
    description:
      "Studio-quality product photos and ad creatives generated in seconds. Powered by state-of-the-art generative AI — no photographer, no studio, no waiting.",
    details: [
      "Photorealistic product shots from text descriptions",
      "Multiple aspect ratios for every ad platform",
      "Consistent brand styling across all outputs",
      "Generate variations in one click",
    ],
  },
  {
    icon: Palette,
    title: "Brand Kits",
    description:
      "Lock in your brand identity once, apply it everywhere. Colors, fonts, logos, and tone of voice stay consistent across every creative you generate.",
    details: [
      "Store brand colors, fonts, and logos",
      "Automatic brand injection into prompts",
      "Multiple kits for sub-brands or campaigns",
      "Set a default kit for quick generation",
    ],
  },
  {
    icon: LayoutGrid,
    title: "Ad Templates",
    description:
      "100+ battle-tested templates optimized for Meta, Google, TikTok, and every major ad platform. Fill in a few variables, get a polished creative.",
    details: [
      "Platform-specific dimensions and layouts",
      "Guided variable inputs for fast iteration",
      "Template categories by use case and industry",
      "Combine with brand kits for on-brand results",
    ],
  },
  {
    icon: Film,
    title: "Video Ads",
    description:
      "Turn static products into scroll-stopping video ads. AI-powered motion with zero editing required — available on Pro and Business plans.",
    details: [
      "Text-to-video generation from prompts",
      "Product-focused motion effects",
      "Optimized for social media feeds",
      "5 credits per generation",
    ],
  },
];

const extras = [
  {
    icon: Gauge,
    title: "Fast Generation",
    description:
      "Most images generate in under 15 seconds. No queues, no waiting.",
  },
  {
    icon: Shield,
    title: "Rate Limiting & Safety",
    description:
      "Built-in rate limiting and content safety to protect your account and brand.",
  },
  {
    icon: Layers,
    title: "Generation History",
    description:
      "Full gallery of every creative you've generated. Filter, search, and re-download anytime.",
  },
  {
    icon: Wand2,
    title: "Guided & Freeform Modes",
    description:
      "Use templates for structured generation or freeform prompts for full creative control.",
  },
];

export default function FeaturesPage() {
  return (
    <main>
      {/* Hero */}
      <section className="flex flex-col items-center px-6 pt-36 pb-20 text-center sm:pt-44">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
          Everything you need to{" "}
          <span className="text-primary">create at scale</span>
        </h1>
        <p className="mt-4 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
          Four core tools, one platform. Generate ad creatives that convert —
          without a design team.
        </p>
      </section>

      {/* Feature deep-dives */}
      <section className="mx-auto max-w-5xl px-6 pb-24">
        <div className="space-y-20">
          {highlights.map((feature, i) => (
            <div
              key={feature.title}
              className={cn(
                "flex flex-col gap-8 md:flex-row md:items-start",
                i % 2 === 1 && "md:flex-row-reverse"
              )}
            >
              <div className="flex-1 space-y-4">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <h2 className="text-2xl font-bold tracking-tight">
                  {feature.title}
                </h2>
                <p className="leading-relaxed text-muted-foreground">
                  {feature.description}
                </p>
                <ul className="space-y-2">
                  {feature.details.map((detail) => (
                    <li
                      key={detail}
                      className="flex items-start gap-2.5 text-sm text-muted-foreground"
                    >
                      <span className="mt-1 block h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                      {detail}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex aspect-[4/3] flex-1 items-center justify-center rounded-xl border border-border/50 bg-card/40">
                <feature.icon className="h-16 w-16 text-muted-foreground/20" />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Extra features grid */}
      <section className="border-t border-border/40 bg-card/20">
        <div className="mx-auto max-w-5xl px-6 py-24">
          <h2 className="mb-12 text-center text-3xl font-bold tracking-tight">
            And more
          </h2>
          <div className="grid gap-6 sm:grid-cols-2">
            {extras.map((extra) => (
              <div
                key={extra.title}
                className="rounded-xl border border-border/50 p-6"
              >
                <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                  <extra.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-semibold">{extra.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                  {extra.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-24 text-center">
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Ready to forge your first ad?
        </h2>
        <p className="mx-auto mt-3 max-w-md text-muted-foreground">
          Start your free trial today. No credit card required.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Link
            href="/signup"
            className={cn(buttonVariants({ size: "lg" }), "gap-1.5")}
          >
            Start free trial
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/pricing"
            className={buttonVariants({ variant: "outline", size: "lg" })}
          >
            See pricing
          </Link>
        </div>
      </section>
    </main>
  );
}
