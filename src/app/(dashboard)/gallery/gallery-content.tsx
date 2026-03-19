"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import type { Generation, ContentType } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ImageIcon, Film, Clock, Coins, Loader2 } from "lucide-react";

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
  pageSize: number;
}

export function GalleryContent({ initialGenerations, pageSize }: Props) {
  const [generations, setGenerations] =
    useState<Generation[]>(initialGenerations);
  const [filter, setFilter] = useState<Filter>("all");
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(
    initialGenerations.length >= pageSize
  );
  const [selected, setSelected] = useState<Generation | null>(null);

  const fetchGenerations = useCallback(
    async (contentType: Filter, offset: number) => {
      const supabase = createClient();
      let query = supabase
        .from("generations")
        .select("*")
        .order("created_at", { ascending: false })
        .range(offset, offset + pageSize - 1);

      if (contentType !== "all") {
        query = query.eq("content_type", contentType);
      }

      const { data } = await query;
      return (data ?? []) as Generation[];
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

  const filters: { value: Filter; label: string }[] = [
    { value: "all", label: "All" },
    { value: "image", label: "Images" },
    { value: "video", label: "Videos" },
  ];

  return (
    <>
      <div className="mt-6 flex gap-2">
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

      <Dialog
        open={!!selected}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
      >
        {selected && <GenerationDetail generation={selected} />}
      </Dialog>
    </>
  );
}

function GenerationCard({
  generation,
  onClick,
}: {
  generation: Generation;
  onClick: () => void;
}) {
  const imageUrl = generation.thumbnail_url ?? generation.output_url;

  return (
    <Card
      className="cursor-pointer transition-shadow hover:ring-2 hover:ring-ring/30"
      onClick={onClick}
    >
      <div className="relative aspect-square w-full overflow-hidden rounded-t-xl bg-muted">
        {imageUrl ? (
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
        <Badge variant="secondary" className="absolute top-2 left-2 capitalize">
          {generation.content_type === "video" ? (
            <Film className="size-3" />
          ) : (
            <ImageIcon className="size-3" />
          )}
          {generation.content_type}
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

function GenerationDetail({ generation }: { generation: Generation }) {
  const imageUrl = generation.output_url ?? generation.thumbnail_url;

  return (
    <DialogContent className="sm:max-w-lg">
      <DialogHeader>
        <DialogTitle>Generation Details</DialogTitle>
        <DialogDescription className="sr-only">
          Details for generation created on {formatDate(generation.created_at)}
        </DialogDescription>
      </DialogHeader>

      {imageUrl ? (
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
