"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BrandKitSelector } from "@/components/BrandKitSelector";
import { ChipSelect } from "./chip-select";
import { ProductUpload } from "./product-upload";
import { MatrixSummaryBar } from "./matrix-summary-bar";
import {
  AD_ANGLES,
  VISUAL_STYLES,
  CAMPAIGN_PLACEMENTS,
} from "@/lib/constants";
import type {
  AdAngle,
  VisualStyle,
  CampaignPlacement,
  ContentType,
} from "@/types";
import { Loader2, Rocket, ImageIcon, Video } from "lucide-react";

export function CampaignBuilder() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [brandKitId, setBrandKitId] = useState("");
  const [productDescription, setProductDescription] = useState("");
  const [targetAudience, setTargetAudience] = useState("");
  const [productImageUrl, setProductImageUrl] = useState<string | null>(null);
  const [contentType, setContentType] = useState<ContentType>("image");
  const [placements, setPlacements] = useState<CampaignPlacement[]>([]);
  const [adAngles, setAdAngles] = useState<AdAngle[]>([]);
  const [visualStyles, setVisualStyles] = useState<VisualStyle[]>([]);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleItem = useCallback(
    <T extends string>(list: T[], setList: (v: T[]) => void, value: T) => {
      setList(
        list.includes(value)
          ? list.filter((v) => v !== value)
          : [...list, value]
      );
    },
    []
  );

  const totalVariants = placements.length * adAngles.length * visualStyles.length;

  const canSubmit =
    name.trim().length > 0 &&
    brandKitId.length > 0 &&
    productDescription.trim().length > 0 &&
    placements.length > 0 &&
    adAngles.length > 0 &&
    visualStyles.length > 0 &&
    !submitting;

  async function handleSubmit() {
    if (!canSubmit) return;

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          brand_kit_id: brandKitId,
          product_description: productDescription.trim(),
          target_audience: targetAudience.trim() || undefined,
          content_type: contentType,
          placements,
          ad_angles: adAngles,
          visual_styles: visualStyles,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Failed to create campaign");
        setSubmitting(false);
        return;
      }

      router.push(`/campaigns/${data.id}`);
    } catch {
      setError("Network error — please try again");
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Campaign Name */}
      <div className="space-y-2">
        <Label htmlFor="campaign-name">Campaign Name</Label>
        <Input
          id="campaign-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Summer Sale Q3"
          disabled={submitting}
          maxLength={100}
        />
      </div>

      {/* Brand Kit */}
      <div className="space-y-2">
        <Label>Brand Kit</Label>
        <BrandKitSelector
          value={brandKitId}
          onValueChange={setBrandKitId}
          disabled={submitting}
        />
      </div>

      {/* Product Description */}
      <div className="space-y-2">
        <Label htmlFor="product-desc">Product Description</Label>
        <textarea
          id="product-desc"
          value={productDescription}
          onChange={(e) => setProductDescription(e.target.value)}
          placeholder="Describe the product or service being advertised..."
          className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          maxLength={1000}
          disabled={submitting}
        />
      </div>

      {/* Target Audience */}
      <div className="space-y-2">
        <Label htmlFor="target-audience">Target Audience (optional)</Label>
        <Input
          id="target-audience"
          value={targetAudience}
          onChange={(e) => setTargetAudience(e.target.value)}
          placeholder="e.g. Health-conscious millennials, 25-35"
          disabled={submitting}
          maxLength={200}
        />
      </div>

      {/* Product Image */}
      <ProductUpload
        imageUrl={productImageUrl}
        onUploaded={setProductImageUrl}
        disabled={submitting}
      />

      {/* Content Type */}
      <div className="space-y-2">
        <Label>Content Type</Label>
        <div className="flex gap-2" role="radiogroup" aria-label="Content type">
          <button
            type="button"
            role="radio"
            aria-checked={contentType === "image"}
            onClick={() => setContentType("image")}
            disabled={submitting}
            className={`inline-flex flex-1 items-center justify-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
              contentType === "image"
                ? "border-primary bg-primary/5 text-foreground"
                : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"
            }`}
          >
            <ImageIcon className="h-4 w-4" />
            Image
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={contentType === "video"}
            onClick={() => setContentType("video")}
            disabled={submitting}
            className={`inline-flex flex-1 items-center justify-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
              contentType === "video"
                ? "border-primary bg-primary/5 text-foreground"
                : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"
            }`}
          >
            <Video className="h-4 w-4" />
            Video
          </button>
        </div>
      </div>

      {/* Placements */}
      <ChipSelect
        label="Placements"
        options={CAMPAIGN_PLACEMENTS}
        selected={placements}
        onToggle={(v) => toggleItem(placements, setPlacements, v)}
        disabled={submitting}
      />

      {/* Ad Angles */}
      <ChipSelect
        label="Ad Angles"
        options={AD_ANGLES}
        selected={adAngles}
        onToggle={(v) => toggleItem(adAngles, setAdAngles, v)}
        disabled={submitting}
      />

      {/* Visual Styles */}
      <ChipSelect
        label="Visual Styles"
        options={VISUAL_STYLES}
        selected={visualStyles}
        onToggle={(v) => toggleItem(visualStyles, setVisualStyles, v)}
        disabled={submitting}
      />

      {/* Matrix Summary */}
      <MatrixSummaryBar
        placements={placements.length}
        adAngles={adAngles.length}
        visualStyles={visualStyles.length}
        contentType={contentType}
      />

      {/* Error */}
      {error && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      {/* Submit */}
      <Button
        onClick={handleSubmit}
        disabled={!canSubmit}
        className="w-full"
        size="lg"
      >
        {submitting ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Creating Campaign...
          </>
        ) : (
          <>
            <Rocket className="mr-2 h-4 w-4" />
            Generate {totalVariants > 0 ? `${totalVariants} Variants` : "Campaign"}
          </>
        )}
      </Button>
    </div>
  );
}
