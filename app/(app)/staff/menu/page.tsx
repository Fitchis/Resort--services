import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import MenuAdminClient from "./menu-admin-client";
import StaffNav from "@/components/staff-nav";

export default async function MenuAdminPage() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!session?.user || !["admin", "manager"].includes(role ?? "")) {
    redirect("/login");
  }
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Menu administration</h1>
          <p className="text-sm text-muted-foreground">
            Create and update items available for ordering.
          </p>
        </div>
        <StaffNav />
      </div>
      <MenuAdminClient />
    </div>
  );
}
