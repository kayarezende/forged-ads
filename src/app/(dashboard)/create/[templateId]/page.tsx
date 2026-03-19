import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { GuidedFlow } from "@/components/GuidedFlow";
import type { Template } from "@/types";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ templateId: string }>;
}) {
  const { templateId } = await params;
  const supabase = await createClient();

  const { data } = await supabase
    .from("templates")
    .select("name")
    .eq("id", templateId)
    .eq("is_active", true)
    .single();

  return {
    title: data ? `${data.name} — ForgedAds` : "Template — ForgedAds",
  };
}

export default async function GuidedCreatePage({
  params,
}: {
  params: Promise<{ templateId: string }>;
}) {
  const { templateId } = await params;
  const supabase = await createClient();

  const { data } = await supabase
    .from("templates")
    .select("*")
    .eq("id", templateId)
    .eq("is_active", true)
    .single();

  if (!data) {
    notFound();
  }

  return <GuidedFlow template={data as Template} />;
}
