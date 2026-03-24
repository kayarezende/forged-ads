import { Layers } from "lucide-react";

export const metadata = {
  title: "Campaigns",
  description: "Manage batch ad generation campaigns.",
};

export default function CampaignsPage() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-semibold tracking-tight">Campaigns</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Manage your batch ad generation campaigns
      </p>

      <div className="mt-12 flex flex-col items-center justify-center gap-3 text-center">
        <Layers className="h-10 w-10 text-muted-foreground/40" />
        <p className="text-sm text-muted-foreground">
          No campaigns yet. Create one from the Create page.
        </p>
      </div>
    </div>
  );
}
