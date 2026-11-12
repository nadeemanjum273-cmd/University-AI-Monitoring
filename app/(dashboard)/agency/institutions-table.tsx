"use client";

import { useState } from "react";
import { Institution, Profile } from "@/types/database";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Building2,
  Search,
  ExternalLink,
  Calendar,
  Users,
  ShieldCheck,
} from "lucide-react";

export type InstitutionWithProfiles = Institution & {
  profiles?: Profile[] | null;
};

interface InstitutionsTableProps {
  institutions: InstitutionWithProfiles[];
}

export function InstitutionsTable({ institutions }: InstitutionsTableProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const filtered = institutions.filter((inst) => {
    const adminEmail = inst.profiles?.[0]?.email || "";
    return (
      inst.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      adminEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inst.id.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  return (
    <div className="space-y-4">
      {/* Search & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search institution by name or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 bg-card/60 border-input"
          />
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground self-end sm:self-center">
          <Users className="h-4 w-4" />
          <span>
            Showing <strong className="text-white">{filtered.length}</strong> of{" "}
            {institutions.length} tenants
          </span>
        </div>
      </div>

      {/* Table Container */}
      <div className="rounded-xl border border-border/40 bg-card/40 backdrop-blur overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-slate-900/80">
            <TableRow>
              <TableHead className="w-[300px]">Institution</TableHead>
              <TableHead>Tenant ID</TableHead>
              <TableHead>Designated Admin</TableHead>
              <TableHead>Isolation Status</TableHead>
              <TableHead>Registered</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="h-48 text-center text-muted-foreground"
                >
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <Building2 className="h-8 w-8 text-slate-500" />
                    <p className="font-medium text-slate-300">
                      No institutions found
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {searchTerm
                        ? "No universities match your search query."
                        : "Use the 'Register New Client' button to onboard your first campus tenant."}
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((inst) => {
                const adminProfile = inst.profiles?.[0];
                const adminEmail = adminProfile?.email || "Admin Provisioned";

                return (
                  <TableRow
                    key={inst.id}
                    className="hover:bg-slate-800/40 transition-colors"
                  >
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-600/10 text-blue-400 border border-blue-500/20">
                          <Building2 className="h-4 w-4" />
                        </div>
                        <div className="flex flex-col">
                          <span className="font-semibold text-white">
                            {inst.name}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            Surveillance Tier 1
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-xs text-slate-400 bg-slate-900/80 px-2 py-1 rounded border border-border/40">
                        {inst.id.slice(0, 8)}...
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-slate-300">
                        {adminEmail}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="success"
                        className="gap-1.5 capitalize font-medium"
                      >
                        <ShieldCheck className="h-3 w-3" />
                        RLS Isolated
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5" />
                        {new Date(inst.created_at).toLocaleDateString(undefined, {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 text-blue-400 hover:text-blue-300 hover:bg-blue-600/10 gap-1.5"
                        onClick={() =>
                          alert(`Managing institution: ${inst.name} (${inst.id})`)
                        }
                      >
                        <span>Manage</span>
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
