import { getUserId } from "@/lib/auth";
import { query } from "@/lib/db";
import { listCampaigns } from "@/lib/campaigns";
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

  const [generationsResult, campaignsResult] = await Promise.all([
    query<Generation>(
      `SELECT * FROM generations
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT $2`,
      [userId, PAGE_SIZE]
    ),
    listCampaigns(userId, { limit: 50, sort: "newest" }),
  ]);

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-semibold tracking-tight">Gallery</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Your generation history
      </p>
      <GalleryContent
        initialGenerations={generationsResult.rows}
        initialCampaigns={campaignsResult.campaigns}
        pageSize={PAGE_SIZE}
      />
    </div>
  );
}
