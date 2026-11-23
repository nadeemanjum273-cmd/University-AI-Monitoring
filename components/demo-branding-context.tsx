"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export interface DemoBranding {
  universityName: string;
  partnerName: string;
  isDemoActive: boolean;
}

interface DemoBrandingContextType extends DemoBranding {
  setDemoBranding: (branding: Partial<DemoBranding>) => void;
  resetDemoBranding: () => void;
  getDisplayUniversity: (fallback?: string | null) => string;
  getDisplayPartner: (fallback?: string | null) => string;
}

const STORAGE_KEY = "campus_ai_vip_demo_branding";

const DEFAULT_BRANDING: DemoBranding = {
  universityName: "Stanford University",
  partnerName: "Apex Vision AI",
  isDemoActive: false,
};

const DemoBrandingContext = createContext<DemoBrandingContextType>({
  ...DEFAULT_BRANDING,
  setDemoBranding: () => {},
  resetDemoBranding: () => {},
  getDisplayUniversity: (fallback) => fallback || "Campus Surveillance Unit",
  getDisplayPartner: (fallback) => fallback || "Campus AI Enterprise",
});

export function DemoBrandingProvider({
  children,
  defaultInstitutionName,
}: {
  children: React.ReactNode;
  defaultInstitutionName?: string | null;
}) {
  const [branding, setBrandingState] = useState<DemoBranding>(DEFAULT_BRANDING);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        setBrandingState({
          universityName: parsed.universityName || DEFAULT_BRANDING.universityName,
          partnerName: parsed.partnerName || DEFAULT_BRANDING.partnerName,
          isDemoActive: Boolean(parsed.isDemoActive),
        });
      }
    } catch (e) {
      console.warn("Failed to read demo branding from localStorage:", e);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  const setDemoBranding = (newBranding: Partial<DemoBranding>) => {
    setBrandingState((prev) => {
      const updated = { ...prev, ...newBranding };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch (e) {
        console.warn("Failed to persist demo branding:", e);
      }
      return updated;
    });
  };

  const resetDemoBranding = () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
    setBrandingState({
      ...DEFAULT_BRANDING,
      isDemoActive: false,
    });
  };

  const getDisplayUniversity = (fallback?: string | null) => {
    if (branding.isDemoActive && branding.universityName.trim()) {
      return branding.universityName;
    }
    return fallback || defaultInstitutionName || "Campus Surveillance Unit";
  };

  const getDisplayPartner = (fallback?: string | null) => {
    if (branding.isDemoActive && branding.partnerName.trim()) {
      return branding.partnerName;
    }
    return fallback || "Campus AI Platform";
  };

  return (
    <DemoBrandingContext.Provider
      value={{
        ...branding,
        setDemoBranding,
        resetDemoBranding,
        getDisplayUniversity,
        getDisplayPartner,
      }}
    >
      {children}
    </DemoBrandingContext.Provider>
  );
}

export function useDemoBranding() {
  return useContext(DemoBrandingContext);
}

