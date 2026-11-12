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
  { title: "Classroom AI", href: "/university/classroom", icon: GraduationCap, badge: "AI Live" },
  { title: "Parking & Vehicle AI", href: "/university/parking", icon: Car },
  { title: "Security & Incidents", href: "/university/reports", icon: AlertTriangle },
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
  const navItems = role === "agency_admin" ? agencyNavItems : universityNavItems;

  return (
    <div
      className={cn(
        "flex h-full flex-col justify-between border-r border-border/40 bg-slate-900/70 backdrop-blur-xl px-4 py-6",
        className
      )}
    >
      <div className="space-y-6">
        {/* Brand Header */}
        <div className="flex items-center gap-3 px-2">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/25">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div className="flex flex-col overflow-hidden">
            <span className="font-bold text-sm tracking-tight text-white truncate">
              {role === "agency_admin"
                ? "SaaS Control Plane"
                : institutionName || "Campus Surveillance"}
            </span>
            <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
              {role === "agency_admin" ? "Agency Operator" : "University Portal"}
            </span>
          </div>
        </div>

        {/* Role Pill Banner */}
        <div className="rounded-lg border border-border/50 bg-slate-800/40 px-3 py-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Access Level:</span>
            <span
              className={cn(
                "rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider",
                role === "agency_admin"
                  ? "bg-purple-500/10 text-purple-400 border border-purple-500/20"
                  : "bg-blue-500/10 text-blue-400 border border-blue-500/20"
              )}
            >
              {role === "agency_admin" ? "Agency Super Admin" : "Campus Admin"}
            </span>
          </div>
        </div>

        {/* Dynamic Navigation Links */}
        <nav className="space-y-1">
          <div className="px-2 pb-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/80">
            Navigation
          </div>
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/agency" &&
                item.href !== "/university" &&
                pathname.startsWith(item.href));

            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                className={cn(
                  "group flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150",
                  isActive
                    ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
                    : "text-slate-300 hover:bg-slate-800/60 hover:text-white"
                )}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={cn(
                      "h-4 w-4 transition-colors",
                      isActive
                        ? "text-white"
                        : "text-slate-400 group-hover:text-white"
                    )}
                  />
                  <span>{item.title}</span>
                </div>
                {item.badge && (
                  <span className="rounded-full bg-cyan-500/20 px-2 py-0.5 text-[10px] font-semibold text-cyan-300 border border-cyan-500/30">
                    {item.badge}
                  </span>
                )}
                {!item.badge && isActive && (
                  <ChevronRight className="h-4 w-4 opacity-70" />
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Cloud & PostgreSQL Security Indicator */}
      <div className="rounded-xl border border-border/30 bg-slate-950/40 p-3 text-xs space-y-1.5">
        <div className="flex items-center gap-2 text-emerald-400 font-medium">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>PostgreSQL RLS Active</span>
        </div>
        <p className="text-[11px] text-muted-foreground leading-relaxed">
          Tenant-isolated data streaming via Supabase Cloud SSR.
        </p>
      </div>
    </div>
  );
}
