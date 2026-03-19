import type { BrandKit, Template } from "@/types";

export function buildPrompt({
  userPrompt,
  brandKit,
  template,
  variables,
}: {
  userPrompt: string;
  brandKit?: BrandKit | null;
  template?: Template | null;
  variables?: Record<string, string>;
}): string {
  const parts: string[] = [];

  // Brand context injection
  if (brandKit) {
    const brandLines = [`BRAND CONTEXT:`, `- Brand: ${brandKit.name}`];
    if (brandKit.primary_color) brandLines.push(`- Primary Color: ${brandKit.primary_color}`);
    if (brandKit.secondary_color) brandLines.push(`- Secondary Color: ${brandKit.secondary_color}`);
    if (brandKit.accent_color) brandLines.push(`- Accent Color: ${brandKit.accent_color}`);
    if (brandKit.brand_voice) brandLines.push(`- Style: ${brandKit.brand_voice}`);
    parts.push(brandLines.join("\n"));
  }

  // Template variable interpolation
  if (template && variables) {
    let prompt = template.prompt_template;
    for (const [key, value] of Object.entries(variables)) {
      prompt = prompt.replaceAll(`{{${key}}}`, value);
    }
    parts.push(prompt);
  } else {
    parts.push(userPrompt);
  }

  // Brand consistency suffix
  if (brandKit) {
    parts.push(
      `\nEnsure the image uses the brand colors and maintains a consistent, professional look suitable for e-commerce advertising.`
    );
  }

  return parts.join("\n\n");
}
