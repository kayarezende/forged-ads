import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { PLANS } from "@/lib/constants";
import type { SubscriptionTier } from "@/types";
import { BrandKitForm } from "@/components/brand-kits/BrandKitForm";

export default async function NewBrandKitPage() {
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

  const { count } = await supabase
    .from("brand_kits")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id);

  if ((count ?? 0) >= plan.maxBrandKits) {
    redirect("/dashboard/brand-kits");
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8">
      <BrandKitForm />
    </div>
  );
}
