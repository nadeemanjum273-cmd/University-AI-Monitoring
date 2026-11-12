"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type ToastType = "success" | "error" | "info";

export interface ToastItem {
  id: string;
  title: string;
  description?: string;
  type: ToastType;
}

interface ToastContextValue {
  toast: (options: { title: string; description?: string; type?: ToastType }) => void;
  success: (title: string, description?: string) => void;
  error: (title: string, description?: string) => void;
  info: (title: string, description?: string) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    ({
      title,
      description,
      type = "info",
    }: {
      title: string;
      description?: string;
      type?: ToastType;
    }) => {
      const id = Math.random().toString(36).substring(2, 9);
      setToasts((prev) => [...prev, { id, title, description, type }]);

      setTimeout(() => {
        removeToast(id);
      }, 5000);
    },
    [removeToast]
  );

  const value: ToastContextValue = {
    toast: addToast,
    success: (title, description) => addToast({ title, description, type: "success" }),
    error: (title, description) => addToast({ title, description, type: "error" }),
    info: (title, description) => addToast({ title, description, type: "info" }),
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      {/* Toast viewport */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cn(
              "pointer-events-auto flex items-start gap-3 rounded-xl border p-4 shadow-xl backdrop-blur-md animate-in slide-in-from-bottom-2 fade-in duration-200 transition-all",
              t.type === "success" &&
                "bg-emerald-950/90 border-emerald-500/40 text-emerald-200",
              t.type === "error" &&
                "bg-red-950/90 border-red-500/40 text-red-200",
              t.type === "info" &&
                "bg-slate-900/95 border-blue-500/40 text-slate-100"
            )}
          >
            {t.type === "success" && (
              <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
            )}
            {t.type === "error" && (
              <AlertCircle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
            )}
            {t.type === "info" && (
              <Info className="h-5 w-5 text-blue-400 shrink-0 mt-0.5" />
            )}

            <div className="flex-1 space-y-1">
              <h5 className="font-semibold text-sm leading-tight text-white">
                {t.title}
              </h5>
              {t.description && (
                <p className="text-xs opacity-90 leading-relaxed">
                  {t.description}
                </p>
              )}
            </div>

            <button
              onClick={() => removeToast(t.id)}
              className="text-slate-400 hover:text-white transition-colors p-1"
              aria-label="Dismiss toast"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    // Return safe fallback if rendered outside provider
    return {
      toast: console.log,
      success: console.log,
      error: console.error,
      info: console.info,
    };
  }
  return context;
}

