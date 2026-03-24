import type { Metadata } from "next";
import Link from "next/link";
import { getUserId } from "@/lib/auth";
import { listCampaigns } from "@/lib/campaigns";
import { CampaignCard } from "@/components/campaigns/campaign-card";
import { CampaignFilters } from "@/components/campaigns/campaign-filters";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Layers } from "lucide-react";

export const metadata: Metadata = {
  title: "Campaigns",
  description: "View and manage your ad generation campaigns.",
};

export default async function CampaignsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; sort?: string }>;
}) {
  const params = await searchParams;
  const userId = await getUserId();
  const status = params.status ?? "all";
  const sort = params.sort ?? "newest";

  const { campaigns, total } = await listCampaigns(userId, {
    status,
    sort,
  });

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Campaigns</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {total} campaign{total !== 1 ? "s" : ""}
          </p>
        </div>
        <Button render={<Link href="/dashboard/create" />}>
          <Plus className="mr-2 h-4 w-4" />
          New Campaign
        </Button>
      </div>

      <div className="mt-4">
        <CampaignFilters status={status} sort={sort} />
      </div>

      {campaigns.length === 0 ? (
        <Card className="mt-8">
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <Layers className="h-10 w-10 text-muted-foreground/50" />
            <div>
              <p className="text-sm font-medium">
                {status !== "all" ? "No matching campaigns" : "No campaigns yet"}
              </p>
              <p className="text-sm text-muted-foreground">
                {status !== "all"
                  ? "Try adjusting your filters or create a new campaign."
                  : "Create your first campaign to start generating ads."}
              </p>
            </div>
            {status === "all" && (
              <Button
                className="mt-2"
                render={<Link href="/dashboard/create" />}
              >
                <Plus className="mr-2 h-4 w-4" />
                Create Your First Campaign
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="mt-4 grid gap-3">
          {campaigns.map((campaign) => (
            <CampaignCard key={campaign.id} campaign={campaign} />
          ))}
        </div>
      )}
    </div>
  );
}
