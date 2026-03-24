// ============================================================
// ForgedAds — Constants & Configuration
// ============================================================

import type { SubscriptionTier, AdAngle, VisualStyle, CampaignPlacement } from "@/types";

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

export const AD_ANGLES: { value: AdAngle; label: string; description: string }[] = [
  { value: "benefit_driven", label: "Benefit-Driven", description: "Focus on what the customer gains" },
  { value: "problem_solution", label: "Problem → Solution", description: "Present the pain point, then the fix" },
  { value: "social_proof", label: "Social Proof", description: "Leverage testimonials and popularity" },
  { value: "urgency_scarcity", label: "Urgency / Scarcity", description: "Limited time or availability" },
  { value: "emotional_appeal", label: "Emotional Appeal", description: "Connect through feelings and aspirations" },
  { value: "feature_highlight", label: "Feature Highlight", description: "Showcase a specific product feature" },
  { value: "comparison", label: "Comparison", description: "Show advantages over alternatives" },
  { value: "storytelling", label: "Storytelling", description: "Narrative-driven creative" },
];

export const VISUAL_STYLES: { value: VisualStyle; label: string; description: string }[] = [
  { value: "photorealistic", label: "Photorealistic", description: "Lifelike photography style" },
  { value: "flat_illustration", label: "Flat Illustration", description: "Clean vector-style graphics" },
  { value: "3d_render", label: "3D Render", description: "Three-dimensional product rendering" },
  { value: "minimalist", label: "Minimalist", description: "Clean, stripped-back design" },
  { value: "bold_graphic", label: "Bold Graphic", description: "High-contrast, attention-grabbing" },
  { value: "watercolor", label: "Watercolor", description: "Soft, artistic paint effect" },
  { value: "retro_vintage", label: "Retro / Vintage", description: "Nostalgic throwback aesthetic" },
  { value: "neon_glow", label: "Neon Glow", description: "Vibrant neon-lit visuals" },
];

export const CAMPAIGN_PLACEMENTS: { value: CampaignPlacement; label: string; aspectRatio: string }[] = [
  { value: "instagram_feed", label: "Instagram Feed", aspectRatio: "1:1" },
  { value: "instagram_story", label: "Instagram Story", aspectRatio: "9:16" },
  { value: "facebook_feed", label: "Facebook Feed", aspectRatio: "4:5" },
  { value: "facebook_story", label: "Facebook Story", aspectRatio: "9:16" },
  { value: "tiktok", label: "TikTok", aspectRatio: "9:16" },
  { value: "youtube_thumbnail", label: "YouTube Thumbnail", aspectRatio: "16:9" },
  { value: "google_display", label: "Google Display", aspectRatio: "16:9" },
  { value: "linkedin", label: "LinkedIn", aspectRatio: "1:1" },
];
