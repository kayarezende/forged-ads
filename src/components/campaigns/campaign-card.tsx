import Link from "next/link";
import type { Campaign, CampaignStatus } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Layers, ImageIcon, Video, ChevronRight } from "lucide-react";

const STATUS_CONFIG: Record<
  CampaignStatus | "queued",
  { label: string; className: string }
> = {
  draft: {
    label: "Draft",
    className: "bg-muted text-muted-foreground",
  },
  queued: {
    label: "Queued",
    className: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  },
  generating: {
    label: "Generating",
    className: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  },
  completed: {
    label: "Completed",
    className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  },
  partial: {
    label: "Partial",
    className: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
  },
  failed: {
    label: "Failed",
    className: "bg-destructive/10 text-destructive",
  },
};

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function CampaignCard({ campaign }: { campaign: Campaign }) {
  const statusCfg =
    STATUS_CONFIG[campaign.status as CampaignStatus | "queued"] ??
    STATUS_CONFIG.draft;

  const progress =
    campaign.total_variants > 0
      ? Math.round(
          (campaign.completed_variants / campaign.total_variants) * 100
        )
      : 0;

  return (
    <Link href={`/dashboard/campaigns/${campaign.id}`} className="group block">
      <Card className="transition-colors hover:border-primary/30">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h3 className="truncate text-sm font-medium group-hover:text-primary">
                  {campaign.name}
                </h3>
                <Badge
                  className={`shrink-0 border-0 text-xs ${statusCfg.className}`}
                >
                  {statusCfg.label}
                </Badge>
              </div>

              <div className="mt-1.5 flex items-center gap-3 text-xs text-muted-foreground">
                {campaign.content_type === "video" ? (
                  <span className="flex items-center gap-1">
                    <Video className="size-3" />
                    Video
                  </span>
                ) : (
                  <span className="flex items-center gap-1">
                    <ImageIcon className="size-3" />
                    Image
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Layers className="size-3" />
                  {campaign.total_variants} variant
                  {campaign.total_variants !== 1 ? "s" : ""}
                </span>
                <span>{formatDate(campaign.created_at)}</span>
              </div>
            </div>

            <ChevronRight className="mt-0.5 size-4 shrink-0 text-muted-foreground/50 transition-transform group-hover:translate-x-0.5 group-hover:text-muted-foreground" />
          </div>

          {/* Progress bar for active campaigns */}
          {(campaign.status === "generating" ||
            campaign.status === "completed" ||
            campaign.status === "partial") &&
            campaign.total_variants > 0 && (
              <div className="mt-3">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>
                    {campaign.completed_variants} / {campaign.total_variants}{" "}
                    completed
                  </span>
                  {campaign.failed_variants > 0 && (
                    <span className="text-destructive">
                      {campaign.failed_variants} failed
                    </span>
                  )}
                </div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}
        </CardContent>
      </Card>
    </Link>
  );
}
