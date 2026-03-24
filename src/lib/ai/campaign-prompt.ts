import type { AdAngle, VisualStyle, CampaignPlacement, BrandKit } from "@/types";
import { CAMPAIGN_PLACEMENTS } from "@/lib/constants";

const ANGLE_DIRECTIVES: Record<AdAngle, string> = {
  benefit_driven:
    "Focus on the key benefit the customer receives. Show the positive outcome of using the product.",
  problem_solution:
    "Depict a before/after scenario: the pain point on one side, the product as the solution on the other.",
  social_proof:
    "Convey popularity and trust — show the product being used and loved. Include visual cues like star ratings, crowds, or endorsement badges.",
  urgency_scarcity:
    "Create a sense of urgency. Use bold countdown-style elements, limited-stock visual cues, or 'act now' energy.",
  emotional_appeal:
    "Evoke an aspirational or emotional feeling. Focus on lifestyle, mood, and the feeling the product delivers.",
  feature_highlight:
    "Zoom in on a single standout feature. Use a close-up or diagram-style composition that makes the feature unmistakable.",
  comparison:
    "Show the product alongside a generic alternative, making the advantage clear through visual contrast.",
  storytelling:
    "Tell a mini story in a single frame: a character, a setting, and the product playing a pivotal role.",
};

const STYLE_DIRECTIVES: Record<VisualStyle, string> = {
  photorealistic:
    "Render in photorealistic style with natural lighting, real textures, and lifelike detail.",
  flat_illustration:
    "Use a clean flat-illustration style with solid colors, simple shapes, and no gradients or heavy shadows.",
  "3d_render":
    "Render as a polished 3D scene with studio lighting, smooth materials, and subtle reflections.",
  minimalist:
    "Use a minimalist design: generous whitespace, limited color palette, and only essential elements.",
  bold_graphic:
    "Use a bold graphic style with high-contrast colors, strong outlines, and punchy typography areas.",
  watercolor:
    "Apply a soft watercolor aesthetic with blended washes, organic edges, and an artistic feel.",
  retro_vintage:
    "Use a retro/vintage aesthetic with muted tones, halftone textures, and nostalgic design elements.",
  neon_glow:
    "Use a neon-glow aesthetic with vibrant glowing edges, dark backgrounds, and electric color accents.",
};

const PLACEMENT_DIRECTIVES: Record<CampaignPlacement, string> = {
  instagram_feed:
    "Compose for a square Instagram feed post. Center the product with thumb-stopping visual impact.",
  instagram_story:
    "Compose for a vertical 9:16 Instagram Story. Use the full height, place key visuals in the center third.",
  facebook_feed:
    "Compose for a 4:5 Facebook feed post. Bold imagery that stands out in a busy news feed.",
  facebook_story:
    "Compose for a vertical 9:16 Facebook Story. Immersive full-screen layout.",
  tiktok:
    "Compose for a vertical 9:16 TikTok frame. Eye-catching, trend-aware visual style.",
  youtube_thumbnail:
    "Compose for a 16:9 YouTube thumbnail. High contrast, readable at small sizes, with a clear focal point.",
  google_display:
    "Compose for a 16:9 Google Display ad. Clean layout with clear product visibility and call-to-action space.",
  linkedin:
    "Compose for a square LinkedIn post. Professional and polished aesthetic suitable for a business audience.",
};

export interface CampaignPromptInput {
  productDescription: string;
  targetAudience?: string | null;
  adAngle: AdAngle;
  visualStyle: VisualStyle;
  placement: CampaignPlacement;
  brandKit?: BrandKit | null;
}

export function buildCampaignPrompt({
  productDescription,
  targetAudience,
  adAngle,
  visualStyle,
  placement,
  brandKit,
}: CampaignPromptInput): string {
  const sections: string[] = [];

  // Product context
  sections.push(`PRODUCT: ${productDescription}`);

  if (targetAudience) {
    sections.push(`TARGET AUDIENCE: ${targetAudience}`);
  }

  // Brand context
  if (brandKit) {
    const brandLines = [`BRAND CONTEXT:`, `- Brand: ${brandKit.name}`];
    if (brandKit.primary_color) brandLines.push(`- Primary Color: ${brandKit.primary_color}`);
    if (brandKit.secondary_color) brandLines.push(`- Secondary Color: ${brandKit.secondary_color}`);
    if (brandKit.accent_color) brandLines.push(`- Accent Color: ${brandKit.accent_color}`);
    if (brandKit.brand_voice) brandLines.push(`- Brand Voice: ${brandKit.brand_voice}`);
    sections.push(brandLines.join("\n"));
  }

  // Ad angle directive
  sections.push(`AD ANGLE — ${adAngle.replace(/_/g, " ").toUpperCase()}:\n${ANGLE_DIRECTIVES[adAngle]}`);

  // Visual style directive
  sections.push(`VISUAL STYLE — ${visualStyle.replace(/_/g, " ").toUpperCase()}:\n${STYLE_DIRECTIVES[visualStyle]}`);

  // Placement directive
  sections.push(`PLACEMENT — ${placement.replace(/_/g, " ").toUpperCase()}:\n${PLACEMENT_DIRECTIVES[placement]}`);

  // Closing instruction
  sections.push(
    "Generate a single, high-quality ad creative image following all directives above. " +
    "Do not include any text overlays unless the ad angle specifically requires it."
  );

  return sections.join("\n\n");
}

export function getPlacementAspectRatio(placement: CampaignPlacement): string {
  const found = CAMPAIGN_PLACEMENTS.find((p) => p.value === placement);
  return found?.aspectRatio ?? "1:1";
}
