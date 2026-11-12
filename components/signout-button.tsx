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
      className="border-border/60 hover:bg-destructive/10 hover:text-red-400 hover:border-red-500/30 transition-colors"
    >
      {isPending ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <>
          <LogOut className="h-4 w-4 mr-2" />
          Sign Out
        </>
      )}
    </Button>
  );
}

