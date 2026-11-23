"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { UserRole } from "@/types/database";
import {
  Building2,
  LayoutDashboard,
  GraduationCap,
  Car,
  AlertTriangle,
  Video,
  BarChart3,
  Shield,
  FileText,
  Settings,
  ShieldCheck,
  ChevronRight,
  Server,
  Film,
} from "lucide-react";

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

const agencyNavItems: NavItem[] = [
  { title: "Institutions & Clients", href: "/agency", icon: Building2 },
  { title: "Agency Analytics", href: "/agency/analytics", icon: BarChart3 },
  { title: "Platform Infrastructure", href: "/agency/infrastructure", icon: Server },
  { title: "Audit Logs", href: "/agency/logs", icon: FileText },
  { title: "Global Settings", href: "/agency/settings", icon: Settings },
];

const universityNavItems: NavItem[] = [
  { title: "Campus Overview", href: "/university", icon: LayoutDashboard },
  { title: "Video Ingestion", href: "/university/videos", icon: Film, badge: "Direct S3" },
  { title: "Classroom AI", href: "/university/classroom", icon: GraduationCap, badge: "Live" },
  { title: "Parking & Vehicle AI", href: "/university/parking", icon: Car },
  { title: "Security Reports", href: "/university/reports", icon: AlertTriangle },
  { title: "Camera Streams", href: "/university/cameras", icon: Video },
  { title: "Campus Settings", href: "/university/settings", icon: Shield },
];

interface DashboardSidebarProps {
  role: UserRole;
  institutionName?: string | null;
  className?: string;
  onNavigate?: () => void;
}

export function DashboardSidebar({
  role,
  institutionName,
  className,
  onNavigate,
}: DashboardSidebarProps) {
  const pathname = usePathname();
  const isAgency = role === "agency_admin";

  const renderNavLink = (item: NavItem) => {
    const isActive =
      item.href === "/agency" || item.href === "/university"
        ? pathname === item.href
        : pathname.startsWith(item.href);

    return (
      <Link
        key={item.href}
        href={item.href}
        onClick={onNavigate}
        className={cn(
          "group flex items-center justify-between rounded-xl px-3 py-2 text-sm font-medium transition-all duration-150",
          isActive
            ? "bg-blue-600 text-white shadow-sm shadow-blue-500/25"
            : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
        )}
      >
        <div className="flex items-center gap-2.5">
          <item.icon
            className={cn(
              "h-4 w-4 shrink-0 transition-colors",
              isActive
                ? "text-white"
                : "text-slate-500 group-hover:text-slate-900"
            )}
          />
          <span className="truncate">{item.title}</span>
        </div>

        <div className="flex items-center gap-1.5">
          {item.badge && (
            <span
              className={cn(
                "rounded px-1.5 py-0.5 text-[10px] font-bold uppercase",
                isActive
                  ? "bg-white/20 text-white"
                  : "bg-blue-100 text-blue-700"
              )}
            >
              {item.badge}
            </span>
          )}
          {isActive && (
            <ChevronRight className="h-3.5 w-3.5 text-white/80" />
          )}
        </div>
      </Link>
    );
  };

  return (
    <div
      className={cn(
        "flex h-full flex-col justify-between border-r border-slate-200 bg-white px-3.5 py-4 shadow-sm overflow-y-auto",
        className
      )}
    >
      <div className="space-y-5">
        {/* Brand Header */}
        <div className="flex items-center gap-2.5 px-1.5 pt-1">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-sm shadow-blue-500/20">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div className="flex flex-col overflow-hidden">
            <span className="font-bold text-sm tracking-tight text-slate-900 truncate">
              Campus AI
            </span>
            <span className="text-[11px] font-medium text-slate-500 truncate">
              {isAgency ? "Agency Master Console" : institutionName || "Security Portal"}
            </span>
          </div>
        </div>

        {/* Clean Role Pill */}
        <div className="rounded-lg border border-slate-200/80 bg-slate-50/80 px-2.5 py-1.5 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-slate-500 font-medium">Role:</span>
            <span
              className={cn(
                "rounded-md px-2 py-0.5 text-[11px] font-semibold tracking-wide",
                isAgency
                  ? "bg-blue-100 text-blue-800 border border-blue-200"
                  : "bg-emerald-100 text-emerald-800 border border-emerald-200"
              )}
            >
              {isAgency ? "Agency Admin" : "University Admin"}
            </span>
          </div>
        </div>

        {/* Agency Navigation Section */}
        {isAgency && (
          <div className="space-y-1">
            <p className="px-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              Agency Management
            </p>
            <nav className="space-y-0.5">
              {agencyNavItems.map(renderNavLink)}
            </nav>
          </div>
        )}

        {/* University / Campus Surveillance Navigation Section */}
        <div className="space-y-1">
          <p className="px-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
            Campus AI Surveillance
          </p>
          <nav className="space-y-0.5">
            {universityNavItems.map(renderNavLink)}
          </nav>
        </div>
      </div>

      {/* Footer System Status */}
      <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50/80 p-2.5">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-xs font-semibold text-slate-800">
            System Operational
          </span>
        </div>
        <p className="mt-0.5 text-[10px] text-slate-500">
          Supabase PostgreSQL RLS Active
        </p>
      </div>
    </div>
  );
}
