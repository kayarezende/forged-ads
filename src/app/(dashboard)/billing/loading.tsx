import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

function SkeletonBlock({ className }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-muted ${className ?? ""}`} />;
}

export default function BillingLoading() {
  return (
    <div className="mx-auto w-full max-w-4xl space-y-8 px-4 py-8">
      <div>
        <SkeletonBlock className="h-8 w-24" />
        <SkeletonBlock className="mt-2 h-4 w-64" />
      </div>

      {/* Plan overview cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <SkeletonBlock className="h-4 w-24" />
              <SkeletonBlock className="mt-1 h-7 w-20" />
            </CardHeader>
            <CardContent>
              <SkeletonBlock className="h-8 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>

      <SkeletonBlock className="h-10 w-48 rounded-md" />

      <Separator />

      {/* Plans */}
      <div>
        <SkeletonBlock className="mb-4 h-6 w-16" />
        <div className="grid gap-4 sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="space-y-3 p-6">
                <SkeletonBlock className="h-6 w-20" />
                <SkeletonBlock className="h-8 w-16" />
                <SkeletonBlock className="h-4 w-full" />
                <SkeletonBlock className="h-4 w-3/4" />
                <SkeletonBlock className="h-4 w-full" />
                <SkeletonBlock className="mt-4 h-10 w-full rounded-md" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
