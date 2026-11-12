"use client";

import { Profile } from "@/types/database";
import { SignOutButton } from "@/components/signout-button";
import { Menu, User, ShieldAlert, School } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface DashboardHeaderProps {
  profile: Profile;
  onOpenMobileMenu: () => void;
}

export function DashboardHeader({
  profile,
  onOpenMobileMenu,
}: DashboardHeaderProps) {
  const isAgency = profile.role === "agency_admin";

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-border/40 bg-slate-900/60 px-4 sm:px-6 backdrop-blur-xl">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onOpenMobileMenu}
          className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white md:hidden"
          aria-label="Open Navigation Sidebar"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="hidden sm:flex items-center gap-2">
          {isAgency ? (
            <Badge variant="outline" className="border-purple-500/30 text-purple-400 bg-purple-500/5 gap-1.5 py-1">
              <ShieldAlert className="h-3.5 w-3.5" />
              Agency SaaS Master Console
            </Badge>
          ) : (
            <Badge variant="outline" className="border-blue-500/30 text-blue-400 bg-blue-500/5 gap-1.5 py-1">
              <School className="h-3.5 w-3.5" />
              {profile.institution?.name || "Campus Surveillance Unit"}
            </Badge>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* User Profile Pill */}
        <div className="flex items-center gap-3 rounded-full border border-border/50 bg-slate-800/40 py-1 pl-1.5 pr-3 shadow-inner">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600/20 text-blue-400 ring-1 ring-blue-500/30">
            <User className="h-4 w-4" />
          </div>
          <div className="flex flex-col text-left">
            <span className="text-xs font-semibold text-white max-w-[140px] truncate sm:max-w-[200px]">
              {profile.full_name || profile.email}
            </span>
            <span className="text-[10px] text-muted-foreground truncate">
              {profile.email}
            </span>
          </div>
        </div>

        {/* Secure Logout Button */}
        <SignOutButton />
      </div>
    </header>
  );
}

