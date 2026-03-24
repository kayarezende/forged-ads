"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { PerformanceTagButton } from "./performance-tag";
import type { GenerationStatus } from "@/types";
import {
  AD_ANGLES,
  VISUAL_STYLES,
  CAMPAIGN_PLACEMENTS,
} from "@/lib/constants";
import {
  ImageIcon,
  Loader2,
  AlertCircle,
  Clock,
  Grid3x3,
} from "lucide-react";

export interface DetailVariant {
  id: string;
  campaign_id: string;
  generation_id: string | null;
  variant_index: number;
  placement: string;
  ad_angle: string;
  visual_style: string;
  status: GenerationStatus;
  created_at: string;
}

export interface DownloadFile {
  variant_index: number;
  generation_id: string;
  output_url: string;
  thumbnail_url: string | null;
  overrides: Record<string, string>;
}

type FilterKey = "placement" | "ad_angle" | "visual_style" | "status";

interface VariantGridProps {
  variants: DetailVariant[];
  downloadFiles?: DownloadFile[];
}

function labelFor(
  type: "placement" | "ad_angle" | "visual_style",
  value: string
): string {
  if (type === "placement") {
    return CAMPAIGN_PLACEMENTS.find((p) => p.value === value)?.label ?? value;
  }
  if (type === "ad_angle") {
    return AD_ANGLES.find((a) => a.value === value)?.label ?? value;
  }
  return VISUAL_STYLES.find((s) => s.value === value)?.label ?? value;
}

const STATUS_CONFIG: Record<
  GenerationStatus,
  { label: string; variant: "default" | "secondary" | "destructive" | "outline" }
> = {
  completed: { label: "Completed", variant: "default" },
  generating: { label: "Generating", variant: "secondary" },
  pending: { label: "Pending", variant: "outline" },
  failed: { label: "Failed", variant: "destructive" },
};

export function VariantGrid({ variants, downloadFiles }: VariantGridProps) {
  const [filters, setFilters] = useState<Record<FilterKey, string>>({
    placement: "all",
    ad_angle: "all",
    visual_style: "all",
    status: "all",
  });

  const filterOptions = useMemo(() => {
    const placements = new Set<string>();
    const angles = new Set<string>();
    const styles = new Set<string>();
    const statuses = new Set<string>();

    for (const v of variants) {
      placements.add(v.placement);
      angles.add(v.ad_angle);
      styles.add(v.visual_style);
      statuses.add(v.status);
    }

    return { placements, angles, styles, statuses };
  }, [variants]);

  const filteredVariants = useMemo(() => {
    return variants.filter((v) => {
      if (filters.placement !== "all" && v.placement !== filters.placement)
        return false;
      if (filters.ad_angle !== "all" && v.ad_angle !== filters.ad_angle)
        return false;
      if (filters.visual_style !== "all" && v.visual_style !== filters.visual_style)
        return false;
      if (filters.status !== "all" && v.status !== filters.status) return false;
      return true;
    });
  }, [variants, filters]);

  const downloadMap = useMemo(() => {
    const map = new Map<
      number,
      { generation_id: string; output_url: string; thumbnail_url: string | null }
    >();
    if (downloadFiles) {
      for (const f of downloadFiles) {
        map.set(f.variant_index, f);
      }
    }
    return map;
  }, [downloadFiles]);

  const hasActiveFilters = Object.values(filters).some((v) => v !== "all");

  return (
    <div className="space-y-4">
      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-2">
        <Grid3x3 className="size-4 text-muted-foreground" />
        <span className="text-sm font-medium">Filter:</span>

        <FilterSelect
          label="Placement"
          value={filters.placement}
          onChange={(v) => setFilters((f) => ({ ...f, placement: v }))}
          options={[...filterOptions.placements].map((p) => ({
            value: p,
            label: labelFor("placement", p),
          }))}
        />
        <FilterSelect
          label="Angle"
          value={filters.ad_angle}
          onChange={(v) => setFilters((f) => ({ ...f, ad_angle: v }))}
          options={[...filterOptions.angles].map((a) => ({
            value: a,
            label: labelFor("ad_angle", a),
          }))}
        />
        <FilterSelect
          label="Style"
          value={filters.visual_style}
          onChange={(v) => setFilters((f) => ({ ...f, visual_style: v }))}
          options={[...filterOptions.styles].map((s) => ({
            value: s,
            label: labelFor("visual_style", s),
          }))}
        />
        <FilterSelect
          label="Status"
          value={filters.status}
          onChange={(v) => setFilters((f) => ({ ...f, status: v }))}
          options={[...filterOptions.statuses].map((s) => ({
            value: s,
            label: STATUS_CONFIG[s as GenerationStatus]?.label ?? s,
          }))}
        />

        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              setFilters({
                placement: "all",
                ad_angle: "all",
                visual_style: "all",
                status: "all",
              })
            }
          >
            Clear
          </Button>
        )}

        <span className="ml-auto text-xs text-muted-foreground">
          {filteredVariants.length} of {variants.length} variants
        </span>
      </div>

      {/* Grid */}
      {filteredVariants.length === 0 ? (
        <div className="py-12 text-center text-sm text-muted-foreground">
          No variants match current filters.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {filteredVariants.map((variant) => (
            <VariantCard
              key={variant.id}
              variant={variant}
              download={downloadMap.get(variant.variant_index)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v ?? "all")}>
      <SelectTrigger size="sm">
        <SelectValue placeholder={label} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All {label}s</SelectItem>
        {options.map((opt) => (
          <SelectItem key={opt.value} value={opt.value}>
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function VariantCard({
  variant,
  download,
}: {
  variant: DetailVariant;
  download?: {
    generation_id: string;
    output_url: string;
    thumbnail_url: string | null;
  };
}) {
  const imageUrl = download?.thumbnail_url ?? download?.output_url;
  const statusConf = STATUS_CONFIG[variant.status];

  return (
    <Card className="overflow-hidden">
      <div className="relative aspect-square w-full bg-muted">
        {variant.status === "completed" && imageUrl ? (
          <Image
            src={imageUrl}
            alt={`${labelFor("placement", variant.placement)} - ${labelFor("ad_angle", variant.ad_angle)}`}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
        ) : variant.status === "failed" ? (
          <div className="flex h-full flex-col items-center justify-center gap-2">
            <AlertCircle className="size-8 text-destructive/60" />
            <span className="text-xs text-destructive/80">Failed</span>
          </div>
        ) : variant.status === "generating" ? (
          <div className="flex h-full flex-col items-center justify-center gap-2">
            <Loader2 className="size-8 animate-spin text-primary/60" />
            <span className="text-xs text-muted-foreground">Generating</span>
          </div>
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2">
            <Clock className="size-8 text-muted-foreground/40" />
            <span className="text-xs text-muted-foreground">Pending</span>
          </div>
        )}

        <Badge
          variant={statusConf.variant}
          className="absolute top-2 left-2 capitalize"
        >
          {statusConf.label}
        </Badge>
      </div>

      <CardContent className="space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">
              {labelFor("placement", variant.placement)}
            </p>
            <p className="truncate text-xs text-muted-foreground">
              {labelFor("ad_angle", variant.ad_angle)} ·{" "}
              {labelFor("visual_style", variant.visual_style)}
            </p>
          </div>
          {variant.status === "completed" && download?.generation_id && (
            <PerformanceTagButton
              generationId={download.generation_id}
              initialTag={null}
            />
          )}
        </div>

        {variant.status === "completed" && download?.output_url && (
          <a
            href={download.output_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
          >
            <ImageIcon className="size-3" />
            View full size
          </a>
        )}
      </CardContent>
    </Card>
  );
}
