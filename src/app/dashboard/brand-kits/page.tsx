import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { PLANS } from "@/lib/constants";
import type { BrandKit, SubscriptionTier } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DeleteBrandKitButton } from "@/components/brand-kits/DeleteBrandKitButton";
import { Plus, Pencil, Palette } from "lucide-react";

export default async function BrandKitsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("subscription_tier")
    .eq("id", user.id)
    .single();

  const tier = (profile?.subscription_tier ?? "starter") as SubscriptionTier;
  const plan = PLANS[tier];

  const { data: brandKits } = await supabase
    .from("brand_kits")
    .select("*")
    .eq("user_id", user.id)
    .order("is_default", { ascending: false })
    .order("created_at", { ascending: false });

  const kits = (brandKits ?? []) as BrandKit[];
  const atLimit = kits.length >= plan.maxBrandKits;

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Brand Kits</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {kits.length} / {plan.maxBrandKits} brand kits used ({plan.name}{" "}
            plan)
          </p>
        </div>
        {atLimit ? (
          <Button disabled>
            <Plus className="mr-2 h-4 w-4" />
            New Brand Kit
          </Button>
        ) : (
          <Button render={<Link href="/dashboard/brand-kits/new" />}>
            <Plus className="mr-2 h-4 w-4" />
            New Brand Kit
          </Button>
        )}
      </div>

      {atLimit && (
        <p className="mt-2 text-sm text-amber-600 dark:text-amber-400">
          You&apos;ve reached the {plan.name} plan limit. Upgrade to create more
          brand kits.
        </p>
      )}

      {kits.length === 0 ? (
        <Card className="mt-8">
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <Palette className="h-10 w-10 text-muted-foreground/50" />
            <div>
              <p className="text-sm font-medium">No brand kits yet</p>
              <p className="text-sm text-muted-foreground">
                Create a brand kit to maintain consistent branding across your
                ads.
              </p>
            </div>
            <Button className="mt-2" render={<Link href="/dashboard/brand-kits/new" />}>
              <Plus className="mr-2 h-4 w-4" />
              Create Your First Brand Kit
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {kits.map((kit) => (
            <Card key={kit.id} className="group relative">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="min-w-0 space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="truncate font-medium">{kit.name}</h3>
                      {kit.is_default && (
                        <Badge variant="secondary" className="shrink-0 text-xs">
                          Default
                        </Badge>
                      )}
                    </div>
                    {(kit.font_heading || kit.font_body) && (
                      <p className="text-xs text-muted-foreground">
                        {[kit.font_heading, kit.font_body]
                          .filter(Boolean)
                          .join(" / ")}
                      </p>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      render={<Link href={`/dashboard/brand-kits/${kit.id}`} />}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <DeleteBrandKitButton id={kit.id} name={kit.name} />
                  </div>
                </div>

                {/* Color swatches */}
                <div className="mt-3 flex gap-1.5">
                  {[
                    kit.primary_color,
                    kit.secondary_color,
                    kit.accent_color,
                    kit.background_color,
                  ]
                    .filter(Boolean)
                    .map((color, i) => (
                      <div
                        key={i}
                        className="h-6 w-6 rounded-full border"
                        style={{ backgroundColor: color! }}
                        title={color!}
                      />
                    ))}
                </div>

                {kit.brand_voice && (
                  <p className="mt-2 line-clamp-2 text-xs text-muted-foreground">
                    {kit.brand_voice}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
