"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { CampaignProgress } from "./campaign-progress";
import { VariantGrid, type DetailVariant, type DownloadFile } from "./variant-grid";
import type { Campaign } from "@/types";
import {
  ArrowLeft,
  RefreshCw,
  Download,
  Loader2,
  Calendar,
  Layers,
  ImageIcon,
  Video,
} from "lucide-react";

interface CampaignDetailContentProps {
  campaign: Campaign;
  variants: DetailVariant[];
  downloadFiles: DownloadFile[];
}

function formatDate(dateStr: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(dateStr));
}

const STATUS_BADGE: Record<
  string,
  { variant: "default" | "secondary" | "destructive" | "outline"; label: string }
> = {
  draft: { variant: "outline", label: "Draft" },
  queued: { variant: "secondary", label: "Queued" },
  generating: { variant: "secondary", label: "Generating" },
  completed: { variant: "default", label: "Completed" },
  failed: { variant: "destructive", label: "Failed" },
  partial: { variant: "outline", label: "Partial" },
};

export function CampaignDetailContent({
  campaign: initialCampaign,
  variants: initialVariants,
  downloadFiles,
}: CampaignDetailContentProps) {
  const router = useRouter();
  const [campaign, setCampaign] = useState(initialCampaign);
  const [variants] = useState(initialVariants);
  const [retrying, setRetrying] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const handleProgressUpdate = useCallback(
    (updatedCampaign: Campaign) => {
      setCampaign(updatedCampaign);
    },
    []
  );

  const handleRetry = async () => {
    setRetrying(true);
    try {
      const res = await fetch(`/api/campaigns/${campaign.id}/retry`, {
        method: "POST",
      });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error ?? "Failed to retry");
        return;
      }

      toast.success(`Retrying ${data.retryCount} failed variant(s)`);
      router.refresh();
    } catch {
      toast.error("Network error — please try again");
    } finally {
      setRetrying(false);
    }
  };

  const handleBulkDownload = async () => {
    setDownloading(true);
    try {
      const res = await fetch(`/api/campaigns/${campaign.id}/download`);
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error ?? "Download failed");
        return;
      }

      const data = await res.json();
      const files: { output_url: string }[] = data.files;

      // Open each URL in a new tab (browser handles download)
      for (const file of files) {
        window.open(file.output_url, "_blank");
      }

      toast.success(`Downloading ${files.length} file(s)`);
    } catch {
      toast.error("Network error — please try again");
    } finally {
      setDownloading(false);
    }
  };

  const statusConf = STATUS_BADGE[campaign.status] ?? STATUS_BADGE.draft;
  const isActive =
    campaign.status === "generating" ||
    campaign.status === "draft" ||
    (campaign.status as string) === "queued";
  const hasFailed = campaign.failed_variants > 0;
  const hasCompleted = campaign.completed_variants > 0;

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      {/* Back link */}
      <Link
        href="/campaigns"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Back to Campaigns
      </Link>

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight">
              {campaign.name}
            </h1>
            <Badge variant={statusConf.variant}>{statusConf.label}</Badge>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="size-3.5" />
              {formatDate(campaign.created_at)}
            </span>
            <span className="flex items-center gap-1">
              <Layers className="size-3.5" />
              {campaign.total_variants} variants
            </span>
            <span className="flex items-center gap-1">
              {campaign.content_type === "video" ? (
                <Video className="size-3.5" />
              ) : (
                <ImageIcon className="size-3.5" />
              )}
              {campaign.content_type}
            </span>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2">
          {hasFailed && (
            <Button
              variant="outline"
              onClick={handleRetry}
              disabled={retrying}
            >
              {retrying ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Retrying...
                </>
              ) : (
                <>
                  <RefreshCw className="size-4" />
                  Retry Failed ({campaign.failed_variants})
                </>
              )}
            </Button>
          )}
          {hasCompleted && (
            <Button onClick={handleBulkDownload} disabled={downloading}>
              {downloading ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Downloading...
                </>
              ) : (
                <>
                  <Download className="size-4" />
                  Download All ({campaign.completed_variants})
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Progress section — only for active campaigns */}
      {isActive && (
        <Card>
          <CardContent className="pt-6">
            <CampaignProgress
              campaignId={campaign.id}
              initialCampaign={campaign}
              onUpdate={handleProgressUpdate}
            />
          </CardContent>
        </Card>
      )}

      <Separator />

      {/* Variant Grid */}
      <VariantGrid variants={variants} downloadFiles={downloadFiles} />
    </div>
  );
}
