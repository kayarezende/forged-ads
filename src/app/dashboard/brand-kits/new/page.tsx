import type { Metadata } from "next";
import { getUserId } from "@/lib/auth";
import { queryOne } from "@/lib/db";
import { redirect } from "next/navigation";
import { PLANS } from "@/lib/constants";
import type { SubscriptionTier } from "@/types";
import { BrandKitForm } from "@/components/brand-kits/BrandKitForm";

export const metadata: Metadata = {
  title: "New Brand Kit",
  description: "Create a new brand kit for consistent ad creatives.",
};

export default async function NewBrandKitPage() {
  const userId = await getUserId();

  const profile = await queryOne<{ subscription_tier: string }>(
    `SELECT subscription_tier FROM profiles WHERE id = $1`,
    [userId]
  );

  const tier = (profile?.subscription_tier ?? "starter") as SubscriptionTier;
  const plan = PLANS[tier];

  const countResult = await queryOne<{ count: string }>(
    `SELECT COUNT(*)::text AS count FROM brand_kits WHERE user_id = $1`,
    [userId]
  );

  if (Number(countResult?.count ?? 0) >= plan.maxBrandKits) {
    redirect("/dashboard/brand-kits");
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8">
      <BrandKitForm />
    </div>
  );
}
