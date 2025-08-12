import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import OrdersBoard from "@/components/admin/orders-board";
import StaffNav from "@/components/staff-nav";

export default async function StaffDashboardPage() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!session?.user || !["admin", "manager", "kitchen"].includes(role ?? "")) {
    redirect("/login");
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Orders dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Monitor and advance guest orders in real time.
          </p>
        </div>
        <StaffNav />
      </div>
      <OrdersBoard />
    </div>
  );
}
