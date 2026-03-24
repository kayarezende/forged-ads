"use client";

import { useState, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { Star, Shield, Ban } from "lucide-react";

const TAGS = [null, "hero", "backup", "reject"] as const;
type PerformanceTag = (typeof TAGS)[number];

const TAG_CONFIG: Record<
  string,
  {
    label: string;
    variant: "default" | "secondary" | "destructive" | "outline";
    icon: typeof Star;
  }
> = {
  hero: { label: "Hero", variant: "default", icon: Star },
  backup: { label: "Backup", variant: "secondary", icon: Shield },
  reject: { label: "Reject", variant: "destructive", icon: Ban },
};

interface PerformanceTagProps {
  generationId: string;
  initialTag: string | null;
}

export function PerformanceTagButton({
  generationId,
  initialTag,
}: PerformanceTagProps) {
  const [tag, setTag] = useState<PerformanceTag>(
    TAGS.includes(initialTag as PerformanceTag)
      ? (initialTag as PerformanceTag)
      : null
  );
  const [updating, setUpdating] = useState(false);

  const cycle = useCallback(async () => {
    if (updating) return;
    const currentIndex = TAGS.indexOf(tag);
    const nextTag = TAGS[(currentIndex + 1) % TAGS.length];

    setUpdating(true);
    // Optimistic update
    setTag(nextTag);

    try {
      const res = await fetch(`/api/generations/${generationId}/tag`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tag: nextTag }),
      });

      if (!res.ok) {
        // Revert on failure
        setTag(tag);
      }
    } catch {
      setTag(tag);
    } finally {
      setUpdating(false);
    }
  }, [generationId, tag, updating]);

  if (!tag) {
    return (
      <button
        type="button"
        onClick={cycle}
        disabled={updating}
        className="rounded-md border border-dashed border-border px-2 py-0.5 text-xs text-muted-foreground transition-colors hover:border-primary/50 hover:text-foreground disabled:opacity-50"
        aria-label="Add performance tag"
      >
        + Tag
      </button>
    );
  }

  const config = TAG_CONFIG[tag];
  const Icon = config.icon;

  return (
    <Badge
      variant={config.variant}
      className="cursor-pointer select-none"
      onClick={cycle}
      role="button"
      aria-label={`Performance tag: ${config.label}. Click to cycle.`}
    >
      <Icon className="size-3" />
      {config.label}
    </Badge>
  );
}
