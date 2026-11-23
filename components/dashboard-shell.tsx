"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Profile } from "@/types/database";
import { DashboardSidebar } from "./dashboard-sidebar";
import { DashboardHeader } from "./dashboard-header";
import { DemoBrandingProvider } from "./demo-branding-context";
import { AskCampusAiWidget } from "./ask-campus-ai-widget";
import { X } from "lucide-react";

interface DashboardShellProps {
  profile: Profile;
  children: React.ReactNode;
}

export function DashboardShell({ profile, children }: DashboardShellProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const isUniversityDashboard = pathname ? pathname.startsWith("/university") : false;

  return (
    <DemoBrandingProvider defaultInstitutionName={profile.institution?.name}>
      <div className="relative flex min-h-screen bg-[#f8fafc] text-slate-900">
        {/* Desktop Sidebar (hidden during printing) */}
        <aside className="hidden md:fixed md:inset-y-0 md:left-0 md:z-40 md:flex md:w-64 md:flex-col print:hidden">
          <DashboardSidebar
            role={profile.role}
            institutionName={profile.institution?.name}
          />
        </aside>

        {/* Mobile Drawer Overlay */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-50 md:hidden flex print:hidden">
            {/* Backdrop */}
            <div
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
              onClick={() => setMobileMenuOpen(false)}
            />

            {/* Drawer Content */}
            <div className="relative z-50 flex w-72 max-w-[85vw] flex-col bg-white border-r border-slate-200 shadow-xl">
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="absolute right-3 top-4 rounded-lg p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                aria-label="Close menu"
              >
                <X className="h-5 w-5" />
              </button>
              <DashboardSidebar
                role={profile.role}
                institutionName={profile.institution?.name}
                onNavigate={() => setMobileMenuOpen(false)}
              />
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <div className="flex flex-1 flex-col md:pl-64 print:pl-0 print:m-0">
          <div className="print:hidden">
            <DashboardHeader
              profile={profile}
              onOpenMobileMenu={() => setMobileMenuOpen(true)}
            />
          </div>
          <main className="flex-1 p-4 sm:p-6 lg:p-8 print:p-0">{children}</main>
        </div>

        {/* Floating Ask Campus AI Assistant Widget - ONLY on University Dashboard */}
        {isUniversityDashboard && <AskCampusAiWidget />}
      </div>
    </DemoBrandingProvider>
  );
}
