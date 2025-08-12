"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";

function NavLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const active = pathname === href;
  return (
    <Link
      href={href}
      className={
        "rounded-full px-3 py-1.5 text-sm transition border " +
        (active
          ? "bg-primary text-primary-foreground border-primary"
          : "bg-card text-card-foreground border-card hover:bg-muted")
      }
    >
      {children}
    </Link>
  );
}

export default function StaffNav() {
  const { data } = useSession();
  const role = (data?.user as { role?: string } | undefined)?.role;
  return (
    <nav className="flex flex-wrap items-center gap-2">
      <NavLink href="/staff/dashboard">Dashboard</NavLink>
      {(role === "admin" || role === "manager") && (
        <>
          <NavLink href="/staff/menu">Menu admin</NavLink>
          <NavLink href="/staff/rooms">Rooms admin</NavLink>
        </>
      )}
    </nav>
  );
}
