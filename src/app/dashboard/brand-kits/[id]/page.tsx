import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { BrandKitForm } from "@/components/brand-kits/BrandKitForm";
import type { BrandKit } from "@/types";

export const metadata: Metadata = {
  title: "Edit Brand Kit",
  description: "Update your brand kit settings.",
};

export default async function EditBrandKitPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: brandKit } = await supabase
    .from("brand_kits")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!brandKit) notFound();

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8">
      <BrandKitForm brandKit={brandKit as BrandKit} />
    </div>
  );
}
