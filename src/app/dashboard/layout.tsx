import { getCurrentUser } from "@/lib/auth";
import { queryOne } from "@/lib/db";
import { SidebarNav } from "@/components/SidebarNav";
import { DashboardHeader } from "@/components/DashboardHeader";
import type { Profile } from "@/types";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  const profile = await queryOne<Pick<Profile, "credits_balance" | "display_name" | "avatar_url" | "email">>(
    `SELECT credits_balance, display_name, avatar_url, email
     FROM public.profiles WHERE id = $1`,
    [user.id]
  );

  const credits = profile?.credits_balance ?? 0;
  const displayName = profile?.display_name ?? null;
  const avatarUrl = profile?.avatar_url ?? null;
  const email = profile?.email ?? user.email ?? "";

  return (
    <div className="flex h-full">
      {/* Desktop sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-sidebar lg:flex">
        <div className="flex h-14 items-center border-b border-sidebar-border px-4">
          <span className="text-base font-semibold tracking-tight text-sidebar-foreground">
            ForgedAds
          </span>
        </div>
        <div className="flex flex-1 flex-col gap-4 overflow-y-auto py-4">
          <SidebarNav />
        </div>
      </aside>

      {/* Main area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <DashboardHeader
          credits={credits}
          displayName={displayName}
          avatarUrl={avatarUrl}
          email={email}
        />
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
