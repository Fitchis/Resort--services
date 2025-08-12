import type React from "react";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import AuthNav from "@/components/auth-nav";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string } | undefined)?.role;
  const isAuthed = !!session?.user;
  const canSeeStaff = role === "admin" || role === "manager" || role === "kitchen";
  return (
    <>
      <header className="sticky top-0 z-30 w-full border-b bg-background/60 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link href="/" className="font-semibold">
            Resort Dining
          </Link>
          <nav className="flex items-center gap-4 text-sm text-muted-foreground">
            {isAuthed && canSeeStaff && (
              <Link href="/staff/dashboard" className="hover:underline">
                Staff
              </Link>
            )}
            {isAuthed && <AuthNav />}
          </nav>
        </div>
      </header>
      <main className="mx-auto min-h-[calc(100svh-56px)] w-full max-w-6xl px-4 py-6">
        {children}
      </main>
    </>
  );
}
