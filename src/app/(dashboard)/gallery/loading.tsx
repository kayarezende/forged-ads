import { Card } from "@/components/ui/card";

function SkeletonBlock({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-muted ${className ?? ""}`} />;
}

export default function GalleryLoading() {
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <SkeletonBlock className="h-8 w-32" />
      <SkeletonBlock className="mt-2 h-4 w-48" />

      {/* Filter buttons */}
      <div className="mt-6 flex gap-2">
        <SkeletonBlock className="h-9 w-16 rounded-md" />
        <SkeletonBlock className="h-9 w-20 rounded-md" />
        <SkeletonBlock className="h-9 w-20 rounded-md" />
      </div>

      {/* Grid */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Card key={i} className="overflow-hidden">
            <SkeletonBlock className="aspect-square w-full rounded-none" />
            <div className="space-y-2 p-4">
              <SkeletonBlock className="h-4 w-full" />
              <SkeletonBlock className="h-4 w-2/3" />
              <div className="flex justify-between">
                <SkeletonBlock className="h-3 w-20" />
                <SkeletonBlock className="h-3 w-8" />
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
