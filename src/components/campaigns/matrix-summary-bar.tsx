"use client";

import { CREDIT_COSTS } from "@/lib/constants";
import type { ContentType } from "@/types";
import { Grid3X3, Coins } from "lucide-react";

interface MatrixSummaryBarProps {
  placements: number;
  adAngles: number;
  visualStyles: number;
  contentType: ContentType;
}

export function MatrixSummaryBar({
  placements,
  adAngles,
  visualStyles,
  contentType,
}: MatrixSummaryBarProps) {
  const totalVariants = placements * adAngles * visualStyles;
  const creditCost = totalVariants * CREDIT_COSTS[contentType];

  if (totalVariants === 0) return null;

  return (
    <div className="flex items-center justify-between rounded-lg border bg-muted/50 px-4 py-3">
      <div className="flex items-center gap-4 text-sm">
        <span className="flex items-center gap-1.5 text-muted-foreground">
          <Grid3X3 className="h-3.5 w-3.5" />
          <span>
            {placements} placement{placements !== 1 ? "s" : ""}
            {" x "}
            {adAngles} angle{adAngles !== 1 ? "s" : ""}
            {" x "}
            {visualStyles} style{visualStyles !== 1 ? "s" : ""}
          </span>
        </span>
      </div>
      <div className="flex items-center gap-3 text-sm font-medium">
        <span>{totalVariants} variant{totalVariants !== 1 ? "s" : ""}</span>
        <span className="flex items-center gap-1 text-muted-foreground">
          <Coins className="h-3.5 w-3.5" />
          {creditCost} credit{creditCost !== 1 ? "s" : ""}
        </span>
      </div>
    </div>
  );
}
