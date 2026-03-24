// ============================================================
// ForgedAds — Campaign Types
// ============================================================

import type { ContentType, GenerationStatus } from "./index";

export type CampaignStatus = "draft" | "generating" | "completed" | "failed" | "partial";

export type AdAngle =
  | "benefit_driven"
  | "problem_solution"
  | "social_proof"
  | "urgency_scarcity"
  | "emotional_appeal"
  | "feature_highlight"
  | "comparison"
  | "storytelling";

export type VisualStyle =
  | "photorealistic"
  | "flat_illustration"
  | "3d_render"
  | "minimalist"
  | "bold_graphic"
  | "watercolor"
  | "retro_vintage"
  | "neon_glow";

export type CampaignPlacement =
  | "instagram_feed"
  | "instagram_story"
  | "facebook_feed"
  | "facebook_story"
  | "tiktok"
  | "youtube_thumbnail"
  | "google_display"
  | "linkedin";

export interface CampaignInput {
  name: string;
  brand_kit_id: string;
  template_id?: string;
  product_description: string;
  target_audience?: string;
  content_type: ContentType;
  placements: CampaignPlacement[];
  ad_angles: AdAngle[];
  visual_styles: VisualStyle[];
}

export interface Campaign {
  id: string;
  user_id: string;
  name: string;
  brand_kit_id: string;
  template_id: string | null;
  product_description: string;
  target_audience: string | null;
  content_type: ContentType;
  placements: CampaignPlacement[];
  ad_angles: AdAngle[];
  visual_styles: VisualStyle[];
  status: CampaignStatus;
  total_variants: number;
  completed_variants: number;
  failed_variants: number;
  created_at: string;
  updated_at: string;
}

export interface CampaignVariant {
  id: string;
  campaign_id: string;
  generation_id: string | null;
  placement: CampaignPlacement;
  ad_angle: AdAngle;
  visual_style: VisualStyle;
  status: GenerationStatus;
  created_at: string;
}
