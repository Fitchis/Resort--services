import { getOrdersByRoom } from "@/lib/orders";
import type { Order } from "@/types/db";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowRight } from "lucide-react";

export default async function OrdersListPage({
  searchParams,
}: {
  searchParams: Promise<{ room?: string }>;
}) {
  const { room } = await searchParams;
  if (!room) redirect("/");
  const orders = await getOrdersByRoom(room);
  if (!orders) return notFound();

  function statusBadge(status: string) {
    // Use theme variables for status colors
    let color = "bg-muted text-muted-foreground border-border";
    if (status === "received")
      color = "bg-primary/10 text-primary border-primary/30";
    if (status === "preparing")
      color =
        "bg-yellow-200/20 text-yellow-700 border-yellow-400/30 dark:bg-yellow-900/40 dark:text-yellow-200 dark:border-yellow-400/40";
    if (status === "ready")
      color =
        "bg-green-200/20 text-green-700 border-green-400/30 dark:bg-green-900/40 dark:text-green-200 dark:border-green-400/40";
    if (status === "delivered")
      color = "bg-muted text-muted-foreground border-border";
    return (
      <span
        className={`inline-block rounded-full border px-2 py-0.5 text-xs font-semibold ${color}`}
        style={{ minWidth: 70, textAlign: "center" }}
      >
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-2 py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-extrabold tracking-tight">My Orders</h1>
        <Link
          href={`/room/${encodeURIComponent(room)}`}
          className="text-sm font-semibold px-4 py-2 rounded-lg border border-muted-foreground/30 bg-muted/40 text-muted-foreground hover:bg-muted/60 transition"
        >
          Back to menu
        </Link>
      </div>
      {orders.length === 0 ? (
        <div className="text-muted-foreground text-center">
          No orders found for this room.
        </div>
      ) : (
        <ul className="grid gap-6 sm:grid-cols-2">
          {(orders as Order[]).map((order) => (
            <li
              key={order.id}
              className="rounded-2xl border-2 border-card bg-card p-5 flex flex-col gap-3 shadow-sm hover:shadow-lg transition group hover:border-primary relative overflow-hidden"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-lg tracking-wide text-card-foreground">
                  Order #{order.id.slice(0, 8)}
                </span>
                <span className="text-xs text-muted-foreground">
                  {new Date(order.created_at).toLocaleString()}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {statusBadge(order.status)}
                <span className="text-xs text-muted-foreground">
                  {order.estimated_delivery
                    ? `• ETA: ${order.estimated_delivery}`
                    : null}
                </span>
              </div>
              {order.special_instructions && (
                <div className="text-xs bg-yellow-50 text-yellow-900 rounded px-2 py-1 mt-1">
                  <span className="font-medium">Note:</span>{" "}
                  {order.special_instructions}
                </div>
              )}
              <div className="flex items-center justify-between mt-2">
                <span className="font-semibold text-base text-card-foreground">
                  Total: ${(order.total_amount / 100).toFixed(2)}
                </span>
                <Link
                  href={`/orders/${order.id}`}
                  className="flex items-center gap-1 text-primary font-semibold hover:underline underline-offset-2 text-sm group-hover:text-primary/90 transition"
                >
                  View details <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
              <div className="absolute right-0 top-0 h-2 w-2 rounded-bl-2xl bg-primary group-hover:w-8 group-hover:h-8 transition-all duration-300" />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
