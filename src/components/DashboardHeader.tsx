"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from "@/components/ui/sheet";
import { SidebarNav } from "@/components/SidebarNav";
import { CreditsBadge } from "@/components/CreditsBadge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function DashboardHeader({
  credits,
  displayName,
  avatarUrl,
  email,
}: {
  credits: number;
  displayName: string | null;
  avatarUrl: string | null;
  email: string;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const initials =
    displayName
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() ?? email[0].toUpperCase();

  return (
    <header className="flex h-14 items-center gap-3 border-b border-border px-4 lg:px-6">
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <Button
          variant="ghost"
          size="icon-sm"
          className="lg:hidden"
          onClick={() => setSidebarOpen(true)}
        >
          <Menu className="size-5" />
          <span className="sr-only">Open sidebar</span>
        </Button>

        <SheetContent side="left" className="w-64 p-0">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <div className="flex h-14 items-center border-b border-border px-4">
            <span className="text-base font-semibold tracking-tight">
              ForgedAds
            </span>
          </div>
          <div className="flex flex-col gap-4 py-4">
            <SidebarNav onNavigate={() => setSidebarOpen(false)} />
          </div>
        </SheetContent>
      </Sheet>

      <div className="flex-1" />

      <CreditsBadge credits={credits} />

      <Avatar size="sm">
        {avatarUrl && <AvatarImage src={avatarUrl} alt={displayName ?? email} />}
        <AvatarFallback>{initials}</AvatarFallback>
      </Avatar>
    </header>
  );
}
