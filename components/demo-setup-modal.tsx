"use client";

import { useState, useEffect } from "react";
import { useDemoBranding } from "./demo-branding-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles,
  Building2,
  ShieldCheck,
  X,
  Check,
  RotateCcw,
  Sliders,
  ExternalLink,
} from "lucide-react";

interface DemoSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const UNIVERSITY_PRESETS = [
  "Stanford University",
  "Bahria University",
  "Oxford University",
  "MIT Department of Security",
];

const PARTNER_PRESETS = [
  "Apex Vision AI",
  "OmniGuard Security",
  "NeuralEdge Solutions",
];

export function DemoSetupModal({ isOpen, onClose }: DemoSetupModalProps) {
  const {
    universityName,
    partnerName,
    isDemoActive,
    setDemoBranding,
    resetDemoBranding,
  } = useDemoBranding();

  const [active, setActive] = useState(isDemoActive);
  const [targetUni, setTargetUni] = useState(universityName);
  const [partner, setPartner] = useState(partnerName);

  useEffect(() => {
    setActive(isDemoActive);
    setTargetUni(universityName);
    setPartner(partnerName);
  }, [isDemoActive, universityName, partnerName, isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    setDemoBranding({
      isDemoActive: active,
      universityName: targetUni.trim() || "Target University",
      partnerName: partner.trim() || "Authorized AI Partner",
    });
    onClose();
  };

  const handleReset = () => {
    resetDemoBranding();
    setActive(false);
    setTargetUni("Stanford University");
    setPartner("Apex Vision AI");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative z-50 w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl transition-all">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white shadow-md shadow-orange-500/20">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-slate-900">
                  VIP Vendor Demo Mode
                </h3>
                <Badge className="bg-amber-100 text-amber-800 border-amber-200 text-[10px] font-bold uppercase tracking-wider">
                  Live Customizer
                </Badge>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Dynamic white-label branding for prospective university clients.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="space-y-5 py-4">
          {/* Active Switch */}
          <div className="flex items-center justify-between p-3.5 rounded-2xl border border-slate-200/80 bg-slate-50/70">
            <div>
              <p className="text-sm font-bold text-slate-800">
                Enable VIP White-Label Branding
              </p>
              <p className="text-xs text-slate-500">
                Replaces titles and audit headers across dashboard and PDF reports.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setActive(!active)}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                active ? "bg-blue-600" : "bg-slate-300"
              }`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  active ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>

          {/* Target University Input */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Building2 className="h-3.5 w-3.5 text-blue-600" />
              Target University Name
            </label>
            <Input
              type="text"
              value={targetUni}
              onChange={(e) => setTargetUni(e.target.value)}
              placeholder="e.g. Stanford University"
              className="rounded-xl border-slate-200 bg-white"
            />
            {/* Presets */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {UNIVERSITY_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setTargetUni(preset)}
                  className={`text-[11px] px-2.5 py-1 rounded-lg border transition-all ${
                    targetUni === preset
                      ? "border-blue-500 bg-blue-50 text-blue-700 font-semibold"
                      : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          {/* Authorized Partner Input */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-indigo-600" />
              Authorized Partner / Vendor Name
            </label>
            <Input
              type="text"
              value={partner}
              onChange={(e) => setPartner(e.target.value)}
              placeholder="e.g. Apex Vision AI"
              className="rounded-xl border-slate-200 bg-white"
            />
            {/* Presets */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {PARTNER_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setPartner(preset)}
                  className={`text-[11px] px-2.5 py-1 rounded-lg border transition-all ${
                    partner === preset
                      ? "border-indigo-500 bg-indigo-50 text-indigo-700 font-semibold"
                      : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          {/* Live Preview Card */}
          <div className="rounded-2xl border border-blue-100 bg-blue-50/60 p-3.5 space-y-1">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-blue-800">
              Live Preview Header Badge:
            </p>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-slate-900">
                {targetUni || "University"}
              </span>
              <span className="text-xs text-slate-400">&bull;</span>
              <span className="text-xs font-medium text-blue-700">
                Powered by {partner || "Partner"}
              </span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between border-t border-slate-100 pt-4">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleReset}
            className="text-slate-500 hover:text-slate-700 gap-1.5 text-xs"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset Defaults
          </Button>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              className="rounded-xl border-slate-200"
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={handleSave}
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-sm gap-1.5"
            >
              <Check className="h-4 w-4" />
              Apply VIP Mode
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

