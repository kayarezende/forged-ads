import { notFound } from "next/navigation";
import { queryOne } from "@/lib/db";
import { GuidedFlow } from "@/components/GuidedFlow";
import type { Template } from "@/types";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ templateId: string }>;
}) {
  const { templateId } = await params;

  const data = await queryOne<{ name: string }>(
    `SELECT name FROM templates
     WHERE id = $1 AND is_active = true`,
    [templateId]
  );

  return {
    title: data ? data.name : "Template",
    description: data
      ? `Generate ad creatives with the ${data.name} template.`
      : "Generate ad creatives with a template.",
  };
}

export default async function GuidedCreatePage({
  params,
}: {
  params: Promise<{ templateId: string }>;
}) {
  const { templateId } = await params;

  const data = await queryOne<Template>(
    `SELECT * FROM templates
     WHERE id = $1 AND is_active = true`,
    [templateId]
  );

  if (!data) {
    notFound();
  }

  return <GuidedFlow template={data} />;
}
