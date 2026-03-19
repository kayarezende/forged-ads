import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create",
  description: "Generate AI-powered ad creatives — freeform or template-guided.",
};

export default function CreateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
