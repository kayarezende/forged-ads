import type { Metadata } from "next";
import { getUserId } from "@/lib/auth";
import { queryOne } from "@/lib/db";
import { notFound } from "next/navigation";
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
  const userId = await getUserId();

  const brandKit = await queryOne<BrandKit>(
    `SELECT * FROM brand_kits
     WHERE id = $1 AND user_id = $2`,
    [id, userId]
  );

  if (!brandKit) notFound();

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8">
      <BrandKitForm brandKit={brandKit} />
    </div>
  );
}
