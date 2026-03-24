"use client";

import { useEffect, useState, useCallback } from "react";
import type { Campaign } from "@/types";
import { Loader2, CheckCircle2, AlertTriangle, XCircle } from "lucide-react";

interface StatusResponse {
  campaign: Campaign;
  variants: { status: string }[];
}

interface CampaignProgressProps {
  campaignId: string;
  initialCampaign: Campaign;
  onUpdate?: (campaign: Campaign) => void;
}

const POLL_INTERVAL = 3000;

export function CampaignProgress({
  campaignId,
  initialCampaign,
  onUpdate,
}: CampaignProgressProps) {
  const [campaign, setCampaign] = useState(initialCampaign);
  const [variantCounts, setVariantCounts] = useState({ generating: 0, pending: 0 });

  const isActive =
    campaign.status === "generating" || campaign.status === "draft";

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch(`/api/campaigns/${campaignId}/status`);
      if (!res.ok) return;
      const data: StatusResponse = await res.json();
      setCampaign(data.campaign);
      setVariantCounts({
        generating: data.variants.filter((v) => v.status === "generating").length,
        pending: data.variants.filter((v) => v.status === "pending").length,
      });
      onUpdate?.(data.campaign);
    } catch {
      // Silently ignore network errors during polling
    }
  }, [campaignId, onUpdate]);

  useEffect(() => {
    if (!isActive) return;
    const id = setInterval(fetchStatus, POLL_INTERVAL);
    return () => clearInterval(id);
  }, [isActive, fetchStatus]);

  const completed = campaign.completed_variants;
  const failed = campaign.failed_variants;
  const total = campaign.total_variants;
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2">
          <StatusIcon status={campaign.status} />
          <span className="font-medium capitalize">
            {campaign.status === "generating"
              ? "Generating..."
              : campaign.status}
          </span>
        </div>
        <span className="tabular-nums text-muted-foreground">
          {completed}/{total} variants
          {failed > 0 && (
            <span className="ml-1 text-destructive">({failed} failed)</span>
          )}
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary transition-all duration-500 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Variant status breakdown */}
      <div className="flex gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <span className="inline-block size-2 rounded-full bg-primary" />
          {completed} completed
        </span>
        {variantCounts.generating > 0 && (
          <span className="flex items-center gap-1">
            <span className="inline-block size-2 rounded-full bg-amber-500" />
            {variantCounts.generating} in progress
          </span>
        )}
        {failed > 0 && (
          <span className="flex items-center gap-1">
            <span className="inline-block size-2 rounded-full bg-destructive" />
            {failed} failed
          </span>
        )}
        {variantCounts.pending > 0 && (
          <span className="flex items-center gap-1">
            <span className="inline-block size-2 rounded-full bg-muted-foreground/40" />
            {variantCounts.pending} pending
          </span>
        )}
      </div>
    </div>
  );
}

function StatusIcon({ status }: { status: Campaign["status"] }) {
  switch (status) {
    case "completed":
      return <CheckCircle2 className="size-4 text-primary" />;
    case "failed":
      return <XCircle className="size-4 text-destructive" />;
    case "partial":
      return <AlertTriangle className="size-4 text-amber-500" />;
    case "generating":
      return <Loader2 className="size-4 animate-spin text-primary" />;
    default:
      return <Loader2 className="size-4 text-muted-foreground" />;
  }
}
