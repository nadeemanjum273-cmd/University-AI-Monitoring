"use client";

import { useState, useTransition } from "react";
import { registerClient } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  PlusCircle,
  X,
  Loader2,
  Building2,
  Mail,
  Lock,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

export function RegisterClientModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccess(false);

    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await registerClient(formData);
      if (result.error) {
        setErrorMessage(result.error);
      } else if (result.success) {
        setSuccess(true);
        setTimeout(() => {
          setIsOpen(false);
          setSuccess(false);
        }, 1500);
      }
    });
  };

  return (
    <>
      <Button
        onClick={() => {
          setIsOpen(true);
          setErrorMessage(null);
          setSuccess(false);
        }}
        className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm shadow-blue-500/20 font-semibold gap-2 rounded-xl"
      >
        <PlusCircle className="h-4 w-4" />
        Register New Client
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <Card className="relative w-full max-w-lg border-slate-200 bg-white shadow-2xl rounded-2xl overflow-hidden">
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-600 to-indigo-600" />

            <button
              onClick={() => setIsOpen(false)}
              className="absolute right-4 top-4 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
              aria-label="Close modal"
            >
              <X className="h-5 w-5" />
            </button>

            <CardHeader className="space-y-1 pb-4">
              <div className="flex items-center gap-2 text-blue-600">
                <Building2 className="h-5 w-5" />
                <span className="text-xs font-semibold uppercase tracking-wider">
                  New Client Onboarding
                </span>
              </div>
              <CardTitle className="text-xl font-bold text-slate-900">
                Register New Institution
              </CardTitle>
              <CardDescription className="text-slate-500 text-sm">
                Create a dedicated university surveillance tenant and assign an initial administrator.
              </CardDescription>
            </CardHeader>

            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-4 pt-2">
                {errorMessage && (
                  <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                {success && (
                  <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    <span>Institution and Admin created successfully!</span>
                  </div>
                )}

                <div className="space-y-1.5">
                  <Label htmlFor="name" className="text-xs font-semibold uppercase text-slate-600">
                    Institution / University Name
                  </Label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <Input
                      id="name"
                      name="name"
                      placeholder="e.g. Stanford University"
                      required
                      disabled={isPending}
                      className="pl-9 bg-white border-slate-200 text-slate-900 rounded-xl"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="adminEmail" className="text-xs font-semibold uppercase text-slate-600">
                    Campus Admin Email
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <Input
                      id="adminEmail"
                      name="adminEmail"
                      type="email"
                      placeholder="admin@institution.edu"
                      required
                      disabled={isPending}
                      className="pl-9 bg-white border-slate-200 text-slate-900 rounded-xl"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="adminPassword" className="text-xs font-semibold uppercase text-slate-600">
                    Initial Admin Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <Input
                      id="adminPassword"
                      name="adminPassword"
                      type="password"
                      placeholder="••••••••••••"
                      required
                      minLength={6}
                      disabled={isPending}
                      className="pl-9 bg-white border-slate-200 text-slate-900 rounded-xl"
                    />
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Minimum 6 characters. The administrator can change this upon sign-in.
                  </p>
                </div>
              </CardContent>

              <CardFooter className="flex justify-end gap-2 border-t border-slate-100 bg-slate-50/50 p-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsOpen(false)}
                  disabled={isPending}
                  className="border-slate-200 text-slate-700 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isPending}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl px-5"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Provisioning...
                    </>
                  ) : (
                    "Create Institution"
                  )}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>
      )}
    </>
  );
}
