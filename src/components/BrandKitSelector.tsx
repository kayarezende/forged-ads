"use client";

import { useState, useCallback } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { BrandKit } from "@/types";

type BrandKitSummary = Pick<
  BrandKit,
  "id" | "name" | "primary_color" | "secondary_color" | "accent_color" | "is_default"
>;

interface BrandKitSelectorProps {
  value: string;
  onValueChange: (value: string) => void;
  disabled?: boolean;
}

function ColorSwatch({ color }: { color: string | null }) {
  if (!color) return null;
  return (
    <span
      className="inline-block h-3 w-3 shrink-0 rounded-full border border-border"
      style={{ backgroundColor: color }}
    />
  );
}

function Swatches({ kit }: { kit: BrandKitSummary }) {
  const colors = [kit.primary_color, kit.secondary_color, kit.accent_color].filter(
    Boolean
  ) as string[];
  if (colors.length === 0) return null;
  return (
    <span className="inline-flex items-center gap-0.5">
      {colors.map((c, i) => (
        <ColorSwatch key={i} color={c} />
      ))}
    </span>
  );
}

export function BrandKitSelector({
  value,
  onValueChange,
  disabled,
}: BrandKitSelectorProps) {
  const [kits, setKits] = useState<BrandKitSummary[]>([]);
  const [loaded, setLoaded] = useState(false);

  const load = useCallback(async () => {
    if (loaded) return;
    try {
      const { createBrowserClient } = await import("@supabase/ssr");
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      const { data } = await supabase
        .from("brand_kits")
        .select(
          "id, name, primary_color, secondary_color, accent_color, is_default"
        )
        .order("is_default", { ascending: false });
      setKits(data ?? []);
      setLoaded(true);
    } catch {
      // Non-critical — brand kits are optional
    }
  }, [loaded]);

  return (
    <Select
      value={value || "none"}
      onValueChange={(v) => onValueChange(!v || v === "none" ? "" : v)}
      disabled={disabled}
      onOpenChange={(open: boolean) => {
        if (open) load();
      }}
    >
      <SelectTrigger>
        <SelectValue placeholder="No brand kit" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="none">No brand kit</SelectItem>
        {kits.map((kit) => (
          <SelectItem key={kit.id} value={kit.id}>
            <Swatches kit={kit} />
            {kit.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
