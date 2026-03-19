/**
 * Renders JSON-LD structured data. Only used with hardcoded application
 * constants (product schema, org schema) — never with user-supplied content.
 */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
