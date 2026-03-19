"use client";

import { cn } from "@/lib/utils";
import { ASPECT_RATIOS, type AspectRatio } from "@/types";

/** Visual dimensions (px) for the ratio preview rectangles. */
const RATIO_DIMS: Record<AspectRatio, { w: number; h: number }> = {
  "1:1": { w: 24, h: 24 },
  "4:5": { w: 20, h: 25 },
  "9:16": { w: 16, h: 28 },
  "16:9": { w: 28, h: 16 },
};

interface AspectRatioSelectorProps {
  value: AspectRatio;
  onValueChange: (value: AspectRatio) => void;
  disabled?: boolean;
}

export function AspectRatioSelector({
  value,
  onValueChange,
  disabled,
}: AspectRatioSelectorProps) {
  return (
    <div className="flex gap-2" role="radiogroup" aria-label="Aspect ratio">
      {ASPECT_RATIOS.map((r) => {
        const dims = RATIO_DIMS[r.value];
        const selected = r.value === value;
        return (
          <button
            key={r.value}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={r.label}
            onClick={() => onValueChange(r.value)}
            disabled={disabled}
            className={cn(
              "flex flex-1 flex-col items-center gap-1.5 rounded-lg border px-3 py-2.5 text-xs transition-colors",
              selected
                ? "border-primary bg-primary/5 text-foreground"
                : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground",
              disabled && "cursor-not-allowed opacity-50"
            )}
          >
            <span
              className={cn(
                "rounded-sm border",
                selected
                  ? "border-primary bg-primary/20"
                  : "border-muted-foreground/30 bg-muted"
              )}
              style={{ width: dims.w, height: dims.h }}
            />
            <span className="font-medium">{r.value}</span>
          </button>
        );
      })}
    </div>
  );
}
