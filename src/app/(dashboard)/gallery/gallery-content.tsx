"use client";

import { useState, useCallback, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { Generation, ContentType, Campaign } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  ImageIcon,
  Film,
  Clock,
  Coins,
  Loader2,
  RefreshCw,
  AlertCircle,
  Layers,
  ChevronRight,
  Sparkles,
} from "lucide-react";

type Filter = "all" | ContentType;

function formatDate(dateStr: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(dateStr));
}

function formatDuration(ms: number | null) {
  if (!ms) return "\u2014";
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

interface Props {
  initialGenerations: Generation[];
  initialCampaigns: Campaign[];
  pageSize: number;
}

export function GalleryContent({
  initialGenerations,
  initialCampaigns,
  pageSize,
}: Props) {
  const router = useRouter();
  const [generations, setGenerations] =
    useState<Generation[]>(initialGenerations);
  const [campaigns] = useState<Campaign[]>(initialCampaigns);
  const [filter, setFilter] = useState<Filter>("all");
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(
    initialGenerations.length >= pageSize
  );
  const [selected, setSelected] = useState<Generation | null>(null);
  const [retrying, setRetrying] = useState(false);

  // Group generations by campaign for the Campaigns tab
  const { campaignGroups, ungrouped } = useMemo(() => {
    const grouped = new Map<string, Generation[]>();
    const noGroup: Generation[] = [];

    for (const gen of generations) {
      if (gen.campaign_id) {
        const existing = grouped.get(gen.campaign_id) ?? [];
        existing.push(gen);
        grouped.set(gen.campaign_id, existing);
      } else {
        noGroup.push(gen);
      }
    }

    // Match campaigns with their generations
    const groups = campaigns.map((campaign) => ({
      campaign,
      generations: grouped.get(campaign.id) ?? [],
    }));

    return { campaignGroups: groups, ungrouped: noGroup };
  }, [generations, campaigns]);

  const fetchGenerations = useCallback(
    async (contentType: Filter, offset: number) => {
      const params = new URLSearchParams({
        offset: String(offset),
        limit: String(pageSize),
      });
      if (contentType !== "all") {
        params.set("content_type", contentType);
      }

      const res = await fetch(`/api/generations?${params}`);
      if (!res.ok) return [];
      const data: Generation[] = await res.json();
      return data;
    },
    [pageSize]
  );

  const handleFilterChange = async (newFilter: Filter) => {
    if (newFilter === filter) return;
    setFilter(newFilter);
    setLoading(true);
    const data = await fetchGenerations(newFilter, 0);
    setGenerations(data);
    setHasMore(data.length >= pageSize);
    setLoading(false);
  };

  const handleLoadMore = async () => {
    setLoadingMore(true);
    const data = await fetchGenerations(filter, generations.length);
    setGenerations((prev) => [...prev, ...data]);
    setHasMore(data.length >= pageSize);
    setLoadingMore(false);
  };

  const handleRetry = async (generation: Generation) => {
    setRetrying(true);
    try {
      const metadata = generation.metadata as Record<string, unknown> | null;
      const res = await fetch("/api/generate/image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: (metadata?.original_prompt as string) ?? generation.prompt,
          templateId: (metadata?.template_id as string) ?? generation.template_id ?? undefined,
          variables: (metadata?.template_variables as Record<string, string>) ?? undefined,
          aspectRatio: generation.aspect_ratio,
          brandKitId: generation.brand_kit_id ?? undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error ?? "Retry failed");
        return;
      }

      toast.success("Generation retried successfully");
      setSelected(null);
      router.refresh();
    } catch {
      toast.error("Network error — please try again");
    } finally {
      setRetrying(false);
    }
  };

  const filters: { value: Filter; label: string }[] = [
    { value: "all", label: "All" },
    { value: "image", label: "Images" },
    { value: "video", label: "Videos" },
  ];

  return (
    <>
      <Tabs defaultValue="all" className="mt-6">
        <TabsList>
          <TabsTrigger value="all">All Generations</TabsTrigger>
          <TabsTrigger value="campaigns">
            Campaigns
            {campaigns.length > 0 && (
              <Badge variant="secondary" className="ml-1.5 px-1.5 py-0 text-[10px]">
                {campaigns.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <div className="mt-4 flex gap-2">
            {filters.map((f) => (
              <Button
                key={f.value}
                variant={filter === f.value ? "default" : "outline"}
                size="sm"
                onClick={() => handleFilterChange(f.value)}
              >
                {f.label}
              </Button>
            ))}
          </div>

          {loading ? (
            <div className="mt-12 flex justify-center">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
          ) : generations.length === 0 ? (
            <div className="mt-12 text-center text-sm text-muted-foreground">
              No generations yet.
            </div>
          ) : (
            <>
              <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {generations.map((gen) => (
                  <GenerationCard
                    key={gen.id}
                    generation={gen}
                    onClick={() => setSelected(gen)}
                  />
                ))}
              </div>

              {hasMore && (
                <div className="mt-8 flex justify-center">
                  <Button
                    variant="outline"
                    onClick={handleLoadMore}
                    disabled={loadingMore}
                  >
                    {loadingMore ? (
                      <>
                        <Loader2 className="size-4 animate-spin" />
                        Loading&hellip;
                      </>
                    ) : (
                      "Load more"
                    )}
                  </Button>
                </div>
              )}
            </>
          )}
        </TabsContent>

        <TabsContent value="campaigns">
          {campaigns.length === 0 && ungrouped.length === 0 ? (
            <div className="mt-12 flex flex-col items-center justify-center gap-3 text-center">
              <Layers className="size-10 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">
                No campaigns yet. Create one from the Create page.
              </p>
            </div>
          ) : (
            <div className="mt-4 space-y-8">
              {campaignGroups.map(({ campaign, generations: gens }) => (
                <CampaignSection
                  key={campaign.id}
                  campaign={campaign}
                  generations={gens}
                  onSelectGeneration={setSelected}
                />
              ))}

              {ungrouped.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 border-b pb-3">
                    <Sparkles className="size-4 text-muted-foreground" />
                    <h3 className="text-sm font-medium">Quick Generates</h3>
                    <Badge variant="secondary" className="px-1.5 py-0 text-[10px]">
                      {ungrouped.length}
                    </Badge>
                  </div>
                  <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                    {ungrouped.map((gen) => (
                      <GenerationCard
                        key={gen.id}
                        generation={gen}
                        onClick={() => setSelected(gen)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog
        open={!!selected}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
      >
        {selected && (
          <GenerationDetail
            generation={selected}
            onRetry={handleRetry}
            retrying={retrying}
          />
        )}
      </Dialog>
    </>
  );
}

// ============================================================
// Campaign Section (grouped view)
// ============================================================

const STATUS_COLORS: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  queued: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  generating: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  completed: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  partial: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
  failed: "bg-destructive/10 text-destructive",
};

function CampaignSection({
  campaign,
  generations,
  onSelectGeneration,
}: {
  campaign: Campaign;
  generations: Generation[];
  onSelectGeneration: (gen: Generation) => void;
}) {
  const statusColor = STATUS_COLORS[campaign.status] ?? STATUS_COLORS.draft;
  const progress =
    campaign.total_variants > 0
      ? Math.round(
          (campaign.completed_variants / campaign.total_variants) * 100
        )
      : 0;

  return (
    <div>
      <div className="flex items-center justify-between border-b pb-3">
        <div className="flex items-center gap-2">
          <Layers className="size-4 text-muted-foreground" />
          <h3 className="text-sm font-medium">{campaign.name}</h3>
          <Badge className={`border-0 text-xs ${statusColor}`}>
            {campaign.status}
          </Badge>
          <span className="text-xs text-muted-foreground">
            {campaign.completed_variants}/{campaign.total_variants} variants
          </span>
        </div>
        <Link
          href={`/dashboard/campaigns/${campaign.id}`}
          className="flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          View campaign
          <ChevronRight className="size-3" />
        </Link>
      </div>

      {(campaign.status === "generating" ||
        campaign.status === "completed" ||
        campaign.status === "partial") &&
        campaign.total_variants > 0 && (
          <div className="mt-2 mb-4">
            <div className="h-1.5 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

      {generations.length > 0 ? (
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {generations.map((gen) => (
            <GenerationCard
              key={gen.id}
              generation={gen}
              onClick={() => onSelectGeneration(gen)}
            />
          ))}
        </div>
      ) : (
        <p className="mt-4 text-xs text-muted-foreground">
          {campaign.status === "draft"
            ? "Generations will appear here once the campaign starts."
            : "No generations loaded for this campaign."}
        </p>
      )}
    </div>
  );
}

// ============================================================
// Generation Card
// ============================================================

function GenerationCard({
  generation,
  onClick,
}: {
  generation: Generation;
  onClick: () => void;
}) {
  const imageUrl = generation.thumbnail_url ?? generation.output_url;
  const isFailed = generation.status === "failed";

  return (
    <Card
      className={`cursor-pointer transition-shadow hover:ring-2 hover:ring-ring/30 ${isFailed ? "ring-1 ring-destructive/30" : ""}`}
      onClick={onClick}
    >
      <div className="relative aspect-square w-full overflow-hidden rounded-t-xl bg-muted">
        {isFailed ? (
          <div className="flex h-full flex-col items-center justify-center gap-2">
            <AlertCircle className="size-8 text-destructive/60" />
            <span className="text-xs text-destructive/80">Failed</span>
          </div>
        ) : imageUrl ? (
          <Image
            src={imageUrl}
            alt={generation.prompt.slice(0, 80)}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            {generation.content_type === "video" ? (
              <Film className="size-8 text-muted-foreground" />
            ) : (
              <ImageIcon className="size-8 text-muted-foreground" />
            )}
          </div>
        )}
        <Badge
          variant={isFailed ? "destructive" : "secondary"}
          className="absolute top-2 left-2 capitalize"
        >
          {generation.content_type === "video" ? (
            <Film className="size-3" />
          ) : (
            <ImageIcon className="size-3" />
          )}
          {isFailed ? "failed" : generation.content_type}
        </Badge>
      </div>
      <CardContent className="space-y-2">
        <p className="line-clamp-2 text-sm leading-snug">{generation.prompt}</p>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{formatDate(generation.created_at)}</span>
          <span className="flex items-center gap-1">
            <Coins className="size-3" />
            {generation.credits_cost}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

// ============================================================
// Generation Detail Dialog
// ============================================================

function GenerationDetail({
  generation,
  onRetry,
  retrying,
}: {
  generation: Generation;
  onRetry: (generation: Generation) => void;
  retrying: boolean;
}) {
  const imageUrl = generation.output_url ?? generation.thumbnail_url;
  const isFailed = generation.status === "failed";

  return (
    <DialogContent className="sm:max-w-lg">
      <DialogHeader>
        <DialogTitle>Generation Details</DialogTitle>
        <DialogDescription className="sr-only">
          Details for generation created on {formatDate(generation.created_at)}
        </DialogDescription>
      </DialogHeader>

      {isFailed ? (
        <div className="flex aspect-square flex-col items-center justify-center gap-3 rounded-lg bg-muted">
          <AlertCircle className="size-12 text-destructive/60" />
          <div className="text-center">
            <p className="text-sm font-medium text-destructive">Generation Failed</p>
            {generation.error_message && (
              <p className="mt-1 max-w-xs text-xs text-muted-foreground">
                {generation.error_message}
              </p>
            )}
          </div>
          <Button
            size="sm"
            onClick={() => onRetry(generation)}
            disabled={retrying}
          >
            {retrying ? (
              <>
                <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                Retrying...
              </>
            ) : (
              <>
                <RefreshCw className="mr-1.5 size-3.5" />
                Retry Generation
              </>
            )}
          </Button>
        </div>
      ) : imageUrl ? (
        <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-muted">
          <Image
            src={imageUrl}
            alt={generation.prompt.slice(0, 80)}
            fill
            className="object-contain"
            sizes="(max-width: 640px) 100vw, 480px"
          />
        </div>
      ) : (
        <div className="flex aspect-square items-center justify-center rounded-lg bg-muted">
          {generation.content_type === "video" ? (
            <Film className="size-12 text-muted-foreground" />
          ) : (
            <ImageIcon className="size-12 text-muted-foreground" />
          )}
        </div>
      )}

      <div className="space-y-3">
        <div>
          <h4 className="text-xs font-medium text-muted-foreground">Prompt</h4>
          <p className="mt-1 text-sm">{generation.prompt}</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <h4 className="text-xs font-medium text-muted-foreground">Model</h4>
            <p className="mt-0.5 font-mono text-sm">{generation.model}</p>
          </div>
          <div>
            <h4 className="text-xs font-medium text-muted-foreground">
              Generation Time
            </h4>
            <p className="mt-0.5 flex items-center gap-1 text-sm">
              <Clock className="size-3" />
              {formatDuration(generation.generation_time_ms)}
            </p>
          </div>
          <div>
            <h4 className="text-xs font-medium text-muted-foreground">
              Credits Cost
            </h4>
            <p className="mt-0.5 flex items-center gap-1 text-sm">
              <Coins className="size-3" />
              {generation.credits_cost}
            </p>
          </div>
          <div>
            <h4 className="text-xs font-medium text-muted-foreground">
              Aspect Ratio
            </h4>
            <p className="mt-0.5 text-sm">{generation.aspect_ratio}</p>
          </div>
        </div>

        <div className="flex items-center justify-between border-t pt-3 text-xs text-muted-foreground">
          <span>{formatDate(generation.created_at)}</span>
          <Badge
            variant={
              generation.status === "completed"
                ? "default"
                : generation.status === "failed"
                  ? "destructive"
                  : "secondary"
            }
            className="capitalize"
          >
            {generation.status}
          </Badge>
        </div>
      </div>
    </DialogContent>
  );
}
