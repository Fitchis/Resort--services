"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function AuthNav() {
  const { status, data } = useSession();

  if (status === "authenticated") {
    const role = (data?.user as { role?: string; email?: string } | undefined)
      ?.role;
    const email = (data?.user as { email?: string } | undefined)?.email;
    return (
      <div className="flex items-center gap-2">
        {role && (
          <Badge variant="secondary" className="capitalize">
            {role}
          </Badge>
        )}
        {email && (
          <span className="hidden sm:inline text-xs text-muted-foreground truncate max-w-[160px]">
            {email}
          </span>
        )}
        <Button
          size="sm"
          variant="outline"
          onClick={() => signOut({ callbackUrl: "/" })}
          className="bg-transparent"
        >
          Sign out
        </Button>
      </div>
    );
  }
  // Hide login on nav when guest
  return null;
}
