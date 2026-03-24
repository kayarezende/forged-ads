import { getUserId } from "@/lib/auth";
import { query } from "@/lib/db";
import { GalleryContent } from "./gallery-content";
import type { Generation } from "@/types";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 12;

export const metadata = {
  title: "Gallery",
  description: "Browse and manage your AI-generated ad creatives.",
};

export default async function GalleryPage() {
  const userId = await getUserId();

  const result = await query<Generation>(
    `SELECT * FROM generations
     WHERE user_id = $1
     ORDER BY created_at DESC
     LIMIT $2`,
    [userId, PAGE_SIZE]
  );

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-semibold tracking-tight">Gallery</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Your generation history
      </p>
      <GalleryContent
        initialGenerations={result.rows}
        pageSize={PAGE_SIZE}
      />
    </div>
  );
}
