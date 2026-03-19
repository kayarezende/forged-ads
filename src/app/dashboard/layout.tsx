import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SidebarNav } from "@/components/SidebarNav";
import { DashboardHeader } from "@/components/DashboardHeader";
import type { Profile } from "@/types";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("credits_balance, display_name, avatar_url, email")
    .eq("id", user.id)
    .single();

  const credits = (profile as Pick<Profile, "credits_balance"> | null)?.credits_balance ?? 0;
  const displayName = (profile as Pick<Profile, "display_name"> | null)?.display_name ?? null;
  const avatarUrl = (profile as Pick<Profile, "avatar_url"> | null)?.avatar_url ?? null;
  const email = (profile as Pick<Profile, "email"> | null)?.email ?? user.email ?? "";

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
