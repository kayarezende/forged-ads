import { Card, CardContent } from "@/components/ui/card";

function SkeletonBlock({ className }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-md bg-muted ${className ?? ""}`}
    />
  );
}

export default function CampaignsLoading() {
  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8">
      <div className="flex items-center justify-between">
        <div>
          <SkeletonBlock className="h-8 w-36" />
          <SkeletonBlock className="mt-2 h-4 w-24" />
        </div>
        <SkeletonBlock className="h-10 w-36 rounded-md" />
      </div>

      {/* Filter skeletons */}
      <div className="mt-4 flex gap-2">
        <SkeletonBlock className="h-8 w-32 rounded-lg" />
        <SkeletonBlock className="h-8 w-32 rounded-lg" />
      </div>

      {/* Card skeletons */}
      <div className="mt-4 grid gap-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <SkeletonBlock className="h-5 w-40" />
                    <SkeletonBlock className="h-5 w-16 rounded-full" />
                  </div>
                  <div className="flex gap-3">
                    <SkeletonBlock className="h-3 w-14" />
                    <SkeletonBlock className="h-3 w-20" />
                    <SkeletonBlock className="h-3 w-24" />
                  </div>
                </div>
                <SkeletonBlock className="size-4" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
