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
  Users,
  ShieldCheck,
  Calendar,
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
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search by institution name or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 bg-white border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-blue-500 rounded-xl shadow-sm"
          />
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500 self-end sm:self-center">
          <Users className="h-4 w-4" />
          <span>
            Showing <strong className="text-slate-900">{filtered.length}</strong> of{" "}
            {institutions.length} institutions
          </span>
        </div>
      </div>

      {/* Table Container */}
      <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-slate-50/80 border-b border-slate-200">
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-[300px] text-xs font-semibold uppercase text-slate-500">Institution</TableHead>
              <TableHead className="text-xs font-semibold uppercase text-slate-500">Tenant ID</TableHead>
              <TableHead className="text-xs font-semibold uppercase text-slate-500">Designated Admin</TableHead>
              <TableHead className="text-xs font-semibold uppercase text-slate-500">Isolation Status</TableHead>
              <TableHead className="text-xs font-semibold uppercase text-slate-500">Enrolled Date</TableHead>
              <TableHead className="text-right text-xs font-semibold uppercase text-slate-500">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="h-48 text-center text-slate-400"
                >
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                      <Building2 className="h-6 w-6" />
                    </div>
                    <p className="font-semibold text-slate-700">
                      No institutions found
                    </p>
                    <p className="text-xs text-slate-500">
                      {searchTerm
                        ? "No universities match your search query."
                        : "Click 'Register New Client' to onboard your first campus tenant."}
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((inst) => {
                const adminProfile = inst.profiles?.[0];
                return (
                  <TableRow
                    key={inst.id}
                    className="border-b border-slate-100 hover:bg-slate-50/70 transition-colors"
                  >
                    <TableCell className="font-medium text-slate-900">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600 font-bold border border-blue-100">
                          <Building2 className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="font-semibold text-slate-900">
                            {inst.name}
                          </div>
                          <div className="text-xs text-slate-500">
                            Surveillance Tier 1
                          </div>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell className="font-mono text-xs text-slate-600">
                      <span className="bg-slate-100 px-2 py-1 rounded-md border border-slate-200">
                        {inst.id.slice(0, 8)}...
                      </span>
                    </TableCell>

                    <TableCell className="text-sm text-slate-700">
                      {adminProfile ? (
                        <div className="flex flex-col">
                          <span className="font-medium text-slate-900">
                            {adminProfile.email}
                          </span>
                          <span className="text-[11px] text-slate-500">
                            {adminProfile.full_name || "Admin"}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 italic">
                          No admin assigned
                        </span>
                      )}
                    </TableCell>

                    <TableCell>
                      <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 font-medium flex items-center gap-1 w-fit shadow-none">
                        <ShieldCheck className="h-3 w-3" />
                        RLS Isolated
                      </Badge>
                    </TableCell>

                    <TableCell className="text-xs text-slate-500">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-slate-400" />
                        <span>{new Date(inst.created_at).toLocaleDateString()}</span>
                      </div>
                    </TableCell>

                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        asChild
                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 text-xs font-semibold gap-1"
                      >
                        <a href="/university" target="_blank" rel="noopener noreferrer">
                          <span>Open</span>
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
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
