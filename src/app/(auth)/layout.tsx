import type { Metadata } from "next";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="dark flex min-h-screen items-center justify-center bg-[oklch(0.145_0_0)] px-4">
      <div className="w-full max-w-sm">{children}</div>
    </div>
  );
}
