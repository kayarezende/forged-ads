import { query } from "@/lib/db";
import { TemplatesContent } from "./templates-content";
import type { Template } from "@/types";

export const metadata = {
  title: "Templates",
  description: "Browse ad creative templates optimized for every major ad platform.",
};

export default async function TemplatesPage() {
  const result = await query<Template>(
    `SELECT * FROM templates
     WHERE is_active = true
     ORDER BY sort_order ASC`
  );

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-semibold tracking-tight">Templates</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Choose a template to get started with guided generation
      </p>
      <TemplatesContent templates={result.rows} />
    </div>
  );
}
