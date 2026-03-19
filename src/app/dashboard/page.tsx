import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Image as ImageIcon, Video, Plus, Clock } from "lucide-react";
import Link from "next/link";
import type { Generation } from "@/types";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/");

  const { data: generations } = await supabase
    .from("generations")
    .select("id, content_type, status, output_url, thumbnail_url, prompt, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(12);

  const items = (generations ?? []) as Pick<
    Generation,
    "id" | "content_type" | "status" | "output_url" | "thumbnail_url" | "prompt" | "created_at"
  >[];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Your recent ad generations
          </p>
        </div>
        <Button render={<Link href="/dashboard/create" />}>
          <Plus data-icon="inline-start" className="size-4" />
          Create
        </Button>
      </div>

      {items.length === 0 ? (
        <Card className="flex flex-col items-center justify-center gap-4 py-16 text-center">
          <div className="rounded-full bg-muted p-4">
            <ImageIcon className="size-8 text-muted-foreground" />
          </div>
          <div className="space-y-1">
            <p className="font-medium">No generations yet</p>
            <p className="text-sm text-muted-foreground">
              Create your first ad to get started
            </p>
          </div>
          <Button render={<Link href="/dashboard/create" />}>
            <Plus data-icon="inline-start" className="size-4" />
            Create Ad
          </Button>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {items.map((gen) => (
            <Card key={gen.id} className="group overflow-hidden">
              <div className="relative aspect-square bg-muted">
                {gen.thumbnail_url || gen.output_url ? (
                  <img
                    src={gen.thumbnail_url ?? gen.output_url!}
                    alt={gen.prompt.slice(0, 80)}
                    className="size-full object-cover"
                  />
                ) : (
                  <div className="flex size-full items-center justify-center">
                    {gen.content_type === "video" ? (
                      <Video className="size-8 text-muted-foreground" />
                    ) : (
                      <ImageIcon className="size-8 text-muted-foreground" />
                    )}
                  </div>
                )}
                <div className="absolute top-2 right-2">
                  <Badge
                    variant={gen.status === "completed" ? "secondary" : "outline"}
                  >
                    {gen.status}
                  </Badge>
                </div>
              </div>
              <div className="space-y-1 p-3">
                <p className="line-clamp-2 text-sm leading-snug">
                  {gen.prompt.slice(0, 120)}
                </p>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Clock className="size-3" />
                  <time dateTime={gen.created_at}>
                    {new Date(gen.created_at).toLocaleDateString()}
                  </time>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
