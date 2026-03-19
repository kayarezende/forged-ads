import { createClient } from "@/lib/supabase/server";
import { GalleryContent } from "./gallery-content";
import type { Generation } from "@/types";

const PAGE_SIZE = 12;

export const metadata = {
  title: "Gallery",
  description: "Browse and manage your AI-generated ad creatives.",
};

export default async function GalleryPage() {
  const supabase = await createClient();

  const { data } = await supabase
    .from("generations")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(PAGE_SIZE);

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-semibold tracking-tight">Gallery</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Your generation history
      </p>
      <GalleryContent
        initialGenerations={(data ?? []) as Generation[]}
        pageSize={PAGE_SIZE}
      />
    </div>
  );
}
