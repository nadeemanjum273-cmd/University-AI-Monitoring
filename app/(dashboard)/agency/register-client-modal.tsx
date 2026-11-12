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
        className="bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/25 gap-2"
      >
        <PlusCircle className="h-4 w-4" />
        Register New Client
      </Button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <Card className="relative w-full max-w-lg border-border/50 bg-slate-900 shadow-2xl overflow-hidden">
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-600" />

            <button
              onClick={() => setIsOpen(false)}
              className="absolute right-4 top-4 rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white"
              aria-label="Close modal"
            >
              <X className="h-5 w-5" />
            </button>

            <CardHeader className="space-y-1">
              <div className="flex items-center gap-2 text-blue-400">
                <Building2 className="h-5 w-5" />
                <span className="text-xs font-semibold uppercase tracking-wider">
                  Multi-Tenant Provisioning
                </span>
              </div>
              <CardTitle className="text-xl font-bold text-white">
                Register New Institution
              </CardTitle>
              <CardDescription className="text-slate-400 text-sm">
                Deploy an isolated university surveillance tenant with an allocated administrator.
              </CardDescription>
            </CardHeader>

            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-4 pt-2">
                {errorMessage && (
                  <div className="flex items-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                {success && (
                  <div className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-400">
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    <span>Institution and Admin provisioned successfully!</span>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="name" className="text-xs font-semibold uppercase text-slate-300">
                    Institution / University Name
                  </Label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="name"
                      name="name"
                      placeholder="e.g. Stanford Technology Institute"
                      required
                      disabled={isPending}
                      className="pl-9 bg-background/50 border-input"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="adminEmail" className="text-xs font-semibold uppercase text-slate-300">
                    Campus Admin Email
                  </Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="adminEmail"
                      name="adminEmail"
                      type="email"
                      placeholder="admin@institution.edu"
                      required
                      disabled={isPending}
                      className="pl-9 bg-background/50 border-input"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="adminPassword" className="text-xs font-semibold uppercase text-slate-300">
                    Initial Admin Password
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="adminPassword"
                      name="adminPassword"
                      type="password"
                      placeholder="••••••••••••"
                      required
                      minLength={6}
                      disabled={isPending}
                      className="pl-9 bg-background/50 border-input"
                    />
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Must be at least 6 characters. The administrator can change this upon initial login.
                  </p>
                </div>
              </CardContent>

              <CardFooter className="flex justify-end gap-3 pt-4 border-t border-border/40">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsOpen(false)}
                  disabled={isPending}
                  className="border-border/60 text-slate-300 hover:bg-slate-800"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isPending}
                  className="bg-blue-600 hover:bg-blue-500 text-white min-w-[140px]"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
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

