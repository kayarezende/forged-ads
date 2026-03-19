import { createClient } from "@/lib/supabase/server";
import { TemplatesContent } from "./templates-content";
import type { Template } from "@/types";

export const metadata = {
  title: "Templates — ForgedAds",
  description: "Browse ad creative templates",
};

export default async function TemplatesPage() {
  const supabase = await createClient();

  const { data } = await supabase
    .from("templates")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-semibold tracking-tight">Templates</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Choose a template to get started with guided generation
      </p>
      <TemplatesContent templates={(data ?? []) as Template[]} />
    </div>
  );
}
