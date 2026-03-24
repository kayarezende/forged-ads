// ============================================================
// ForgedAds — Shared TypeScript Types
// ============================================================

export type SubscriptionTier = "starter" | "pro" | "business";
export type SubscriptionStatus = "active" | "past_due" | "canceled" | "trialing" | "paused";
export type ContentType = "image" | "video";
export type GenerationStatus = "pending" | "generating" | "completed" | "failed";
export type CreditTxType = "subscription_grant" | "topup_purchase" | "generation_spend" | "refund" | "admin_adjustment";

export interface Profile {
  id: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  subscription_tier: SubscriptionTier;
  subscription_status: SubscriptionStatus;
  credits_balance: number;
  credits_used_this_period: number;
  period_reset_at: string | null;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface BrandKit {
  id: string;
  user_id: string;
  name: string;
  logo_url: string | null;
  primary_color: string | null;
  secondary_color: string | null;
  accent_color: string | null;
  background_color: string | null;
  font_heading: string | null;
  font_body: string | null;
  brand_voice: string | null;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface TemplateVariable {
  name: string;
  label: string;
  type: "text" | "select" | "number";
  options?: string[];
  default?: string;
}

export interface Template {
  id: string;
  name: string;
  description: string | null;
  category: string;
  content_type: ContentType;
  aspect_ratio: string;
  prompt_template: string;
  variables: TemplateVariable[];
  thumbnail_url: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

export interface Generation {
  id: string;
  user_id: string;
  brand_kit_id: string | null;
  template_id: string | null;
  campaign_id: string | null;
  content_type: ContentType;
  model: string;
  prompt: string;
  negative_prompt: string | null;
  aspect_ratio: string;
  ad_angle: string | null;
  visual_style: string | null;
  placement: string | null;
  output_url: string | null;
  thumbnail_url: string | null;
  status: GenerationStatus;
  credits_cost: number;
  generation_time_ms: number | null;
  metadata: Record<string, unknown>;
  error_message: string | null;
  created_at: string;
}

export interface CreditTransaction {
  id: string;
  user_id: string;
  amount: number;
  type: CreditTxType;
  description: string | null;
  generation_id: string | null;
  stripe_event_id: string | null;
  balance_after: number;
  created_at: string;
}

export type AspectRatio = "1:1" | "4:5" | "9:16" | "16:9";

export const ASPECT_RATIOS: { value: AspectRatio; label: string }[] = [
  { value: "1:1", label: "Square (1:1)" },
  { value: "4:5", label: "Portrait (4:5)" },
  { value: "9:16", label: "Story (9:16)" },
  { value: "16:9", label: "Landscape (16:9)" },
];

export type {
  CampaignStatus,
  AdAngle,
  VisualStyle,
  CampaignPlacement,
  CampaignInput,
  Campaign,
  CampaignVariant,
} from "./campaigns";
