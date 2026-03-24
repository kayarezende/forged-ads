"use client";

import { cn } from "@/lib/utils";
import { X } from "lucide-react";

interface ChipOption<T extends string> {
  value: T;
  label: string;
  description?: string;
}

interface ChipSelectProps<T extends string> {
  label: string;
  options: ChipOption<T>[];
  selected: T[];
  onToggle: (value: T) => void;
  disabled?: boolean;
}

export function ChipSelect<T extends string>({
  label,
  options,
  selected,
  onToggle,
  disabled,
}: ChipSelectProps<T>) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{label}</span>
        <span className="text-xs text-muted-foreground">
          {selected.length} selected
        </span>
      </div>
      <div className="flex flex-wrap gap-2" role="group" aria-label={label}>
        {options.map((opt) => {
          const active = selected.includes(opt.value);
          return (
            <button
              key={opt.value}
              type="button"
              role="checkbox"
              aria-checked={active}
              aria-label={opt.description ? `${opt.label}: ${opt.description}` : opt.label}
              onClick={() => onToggle(opt.value)}
              disabled={disabled}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                active
                  ? "border-primary bg-primary/10 text-foreground"
                  : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground",
                disabled && "cursor-not-allowed opacity-50"
              )}
            >
              {opt.label}
              {active && <X className="h-3 w-3" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
