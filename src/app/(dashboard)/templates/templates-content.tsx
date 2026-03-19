"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ShoppingBag,
  Tag,
  Camera,
  Share2,
  LayoutTemplate,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Template } from "@/types";

const CATEGORIES: {
  value: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { value: "all", label: "All", icon: LayoutTemplate },
  { value: "product_showcase", label: "Product Showcase", icon: ShoppingBag },
  { value: "sale_banner", label: "Sale Banner", icon: Tag },
  { value: "lifestyle", label: "Lifestyle", icon: Camera },
  { value: "social_post", label: "Social Post", icon: Share2 },
];

function categoryLabel(category: string): string {
  return (
    CATEGORIES.find((c) => c.value === category)?.label ??
    category.replace(/_/g, " ")
  );
}

export function TemplatesContent({ templates }: { templates: Template[] }) {
  const [activeCategory, setActiveCategory] = useState("all");

  const filtered =
    activeCategory === "all"
      ? templates
      : templates.filter((t) => t.category === activeCategory);

  return (
    <div className="mt-6">
      {/* Category filters */}
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          const isActive = activeCategory === cat.value;
          return (
            <button
              key={cat.value}
              onClick={() => setActiveCategory(cat.value)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
                isActive
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-background text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <Icon className="size-3.5" />
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Template grid */}
      {filtered.length === 0 ? (
        <div className="mt-12 text-center">
          <LayoutTemplate className="mx-auto size-10 text-muted-foreground/40" />
          <p className="mt-3 text-sm text-muted-foreground">
            No templates in this category
          </p>
        </div>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((template) => (
            <Link
              key={template.id}
              href={`/dashboard/create/${template.id}`}
              className="group"
            >
              <Card className="overflow-hidden transition-colors hover:border-primary/50">
                {/* Thumbnail */}
                <div className="relative aspect-[4/3] bg-muted">
                  {template.thumbnail_url ? (
                    <img
                      src={template.thumbnail_url}
                      alt={template.name}
                      className="size-full object-cover"
                    />
                  ) : (
                    <div className="flex size-full items-center justify-center">
                      <LayoutTemplate className="size-10 text-muted-foreground/30" />
                    </div>
                  )}
                </div>

                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="truncate text-sm font-medium group-hover:text-primary">
                        {template.name}
                      </h3>
                      {template.description && (
                        <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                          {template.description}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">
                      {categoryLabel(template.category)}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {template.aspect_ratio}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
