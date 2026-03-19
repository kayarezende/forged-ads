// ============================================================
// ForgedAds — Constants & Configuration
// ============================================================

import type { SubscriptionTier } from "@/types";

export const PLANS = {
  starter: {
    name: "Starter",
    price: 29,
    credits: 100,
    maxBrandKits: 1,
    videoEnabled: false,
  },
  pro: {
    name: "Pro",
    price: 69,
    credits: 300,
    maxBrandKits: 5,
    videoEnabled: true,
  },
  business: {
    name: "Business",
    price: 149,
    credits: 750,
    maxBrandKits: 999,
    videoEnabled: true,
  },
} as const satisfies Record<SubscriptionTier, {
  name: string;
  price: number;
  credits: number;
  maxBrandKits: number;
  videoEnabled: boolean;
}>;

export const CREDIT_COSTS = {
  image: 1,
  video: 5,
} as const;

export const TOPUP_PACKAGES = [
  { credits: 50, price: 15, priceId: process.env.STRIPE_PRICE_CREDITS_50 },
  { credits: 200, price: 49, priceId: process.env.STRIPE_PRICE_CREDITS_200 },
  { credits: 500, price: 99, priceId: process.env.STRIPE_PRICE_CREDITS_500 },
] as const;

export const STRIPE_PRICE_IDS: Record<SubscriptionTier, string | undefined> = {
  starter: process.env.STRIPE_PRICE_STARTER,
  pro: process.env.STRIPE_PRICE_PRO,
  business: process.env.STRIPE_PRICE_BUSINESS,
};

export const AI_MODELS = {
  image: "google/gemini-3.1-flash-image-preview",
  video: "veo-3.1-fast-generate-preview",
} as const;

export const RATE_LIMITS = {
  windowSeconds: 60,
  maxRequests: 10,
} as const;
