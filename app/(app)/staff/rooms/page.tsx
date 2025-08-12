import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import StaffNav from "@/components/staff-nav";
import RoomsAdminClient from "@/app/(app)/staff/rooms/rooms-admin-client";

export default async function RoomsAdminPage() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!session?.user || !["admin", "manager"].includes(role ?? "")) {
    redirect("/login");
  }
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Rooms administration</h1>
          <p className="text-sm text-muted-foreground">
            Create and manage rooms available for ordering.
          </p>
        </div>
        <StaffNav />
      </div>
      <RoomsAdminClient />
    </div>
  );
}
