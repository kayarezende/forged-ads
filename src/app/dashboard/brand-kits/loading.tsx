import { Card, CardContent } from "@/components/ui/card";

function SkeletonBlock({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-muted ${className ?? ""}`} />;
}

export default function BrandKitsLoading() {
  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8">
      <div className="flex items-center justify-between">
        <div>
          <SkeletonBlock className="h-8 w-36" />
          <SkeletonBlock className="mt-2 h-4 w-56" />
        </div>
        <SkeletonBlock className="h-10 w-36 rounded-md" />
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <SkeletonBlock className="h-5 w-32" />
                  <SkeletonBlock className="h-3 w-24" />
                </div>
                <div className="flex gap-1">
                  <SkeletonBlock className="size-8 rounded-md" />
                  <SkeletonBlock className="size-8 rounded-md" />
                </div>
              </div>
              <div className="mt-3 flex gap-1.5">
                {Array.from({ length: 4 }).map((_, j) => (
                  <SkeletonBlock key={j} className="size-6 rounded-full" />
                ))}
              </div>
              <SkeletonBlock className="mt-2 h-3 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
