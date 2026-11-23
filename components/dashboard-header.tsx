"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Profile } from "@/types/database";
import { SignOutButton } from "@/components/signout-button";
import { useDemoBranding } from "@/components/demo-branding-context";
import { DemoSetupModal } from "@/components/demo-setup-modal";
import { Menu, User, ShieldCheck, School, Building2, Sparkles, SlidersHorizontal } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface DashboardHeaderProps {
  profile: Profile;
  onOpenMobileMenu: () => void;
}

export function DashboardHeader({
  profile,
  onOpenMobileMenu,
}: DashboardHeaderProps) {
  const pathname = usePathname();
  const isAgency = profile.role === "agency_admin";
  const isAgencyDashboard = isAgency && (pathname ? pathname.startsWith("/agency") : false);
  const { isDemoActive, getDisplayUniversity, getDisplayPartner } = useDemoBranding();
  const [demoModalOpen, setDemoModalOpen] = useState(false);

  const displayUni = getDisplayUniversity(profile.institution?.name);
  const displayPartner = getDisplayPartner();

  return (
    <>
      <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white/90 px-4 sm:px-6 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onOpenMobileMenu}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900 md:hidden transition-colors"
            aria-label="Open Navigation Sidebar"
          >
            <Menu className="h-5 w-5" />
          </button>

          {/* Dynamic Campus / Agency Title Header */}
          <div className="hidden sm:flex items-center gap-2">
            {isDemoActive ? (
              <Badge
                variant="outline"
                className="border-amber-300 bg-amber-50 text-amber-900 font-semibold gap-1.5 py-1 px-3 shadow-sm"
              >
                <Sparkles className="h-3.5 w-3.5 text-amber-600 animate-pulse" />
                <span className="font-bold">{displayUni}</span>
                <span className="text-amber-500 font-normal">&bull;</span>
                <span className="text-amber-700 font-medium">Powered by {displayPartner}</span>
              </Badge>
            ) : isAgency ? (
              <Badge variant="outline" className="border-slate-200 bg-slate-50 text-slate-700 font-medium gap-1.5 py-1 px-3 shadow-sm">
                <Building2 className="h-3.5 w-3.5 text-blue-600" />
                Agency Operations Console
              </Badge>
            ) : (
              <Badge variant="outline" className="border-slate-200 bg-slate-50 text-slate-700 font-medium gap-1.5 py-1 px-3 shadow-sm">
                <School className="h-3.5 w-3.5 text-blue-600" />
                {displayUni}
              </Badge>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2.5 sm:gap-3">
          {/* VIP Demo Setup Button - ONLY visible on Agency Admin dashboard */}
          {isAgencyDashboard && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setDemoModalOpen(true)}
              className={`rounded-xl border transition-all gap-1.5 px-3 py-1.5 shadow-sm text-xs font-semibold ${
                isDemoActive
                  ? "border-amber-300 bg-amber-50 text-amber-900 hover:bg-amber-100/80 shadow-amber-500/10 ring-1 ring-amber-400/30"
                  : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <Sparkles className={`h-3.5 w-3.5 ${isDemoActive ? "text-amber-600 fill-amber-500/30" : "text-slate-400"}`} />
              <span className="hidden xs:inline">
                {isDemoActive ? "VIP Demo Active" : "Demo Setup"}
              </span>
              {isDemoActive && (
                <span className="relative flex h-2 w-2 ml-0.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                </span>
              )}
            </Button>
          )}

          {/* User Profile Pill */}
          <div className="flex items-center gap-2.5 rounded-full border border-slate-200 bg-slate-50/80 py-1 pl-1.5 pr-3 shadow-sm">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-white font-bold text-xs shadow-sm">
              <User className="h-3.5 w-3.5" />
            </div>
            <div className="flex flex-col text-left">
              <span className="text-xs font-semibold text-slate-900 max-w-[110px] truncate sm:max-w-[170px]">
                {profile.full_name || profile.email}
              </span>
              <span className="text-[10px] text-slate-500 truncate">
                {profile.email}
              </span>
            </div>
          </div>

          {/* Secure Logout Button */}
          <SignOutButton />
        </div>
      </header>

      {/* Demo Setup Modal - only for Agency dashboard */}
      {isAgencyDashboard && (
        <DemoSetupModal
          isOpen={demoModalOpen}
          onClose={() => setDemoModalOpen(false)}
        />
      )}
    </>
  );
}
