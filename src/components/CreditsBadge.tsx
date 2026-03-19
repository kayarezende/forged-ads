import { Zap } from "lucide-react";
import { cn } from "@/lib/utils";

export function CreditsBadge({
  credits,
  className,
}: {
  credits: number;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-1.5 rounded-full border border-border bg-muted/50 px-3 py-1 text-sm font-medium",
        className
      )}
    >
      <Zap className="size-3.5 text-amber-400" />
      <span className="font-mono text-xs tabular-nums">{credits.toLocaleString()}</span>
      <span className="text-muted-foreground text-xs">credits</span>
    </div>
  );
}
