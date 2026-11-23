"use client";

import { useTransition } from "react";
import { logout } from "@/app/login/actions";
import { Button } from "@/components/ui/button";
import { LogOut, Loader2 } from "lucide-react";

export function SignOutButton() {
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      variant="outline"
      size="sm"
      disabled={isPending}
      onClick={() => startTransition(() => logout())}
      className="border-slate-200 bg-white text-slate-700 hover:bg-red-50 hover:text-red-600 hover:border-red-200 shadow-sm transition-colors"
    >
      {isPending ? (
        <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
      ) : (
        <LogOut className="h-4 w-4 mr-1.5 text-slate-400 group-hover:text-red-600" />
      )}
      Sign Out
    </Button>
  );
}
