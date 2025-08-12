import OrderTrackingClient from "./tracking-client";
import { getOrderById } from "@/lib/orders";

export default async function OrderTrackingPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = await params;
  const order = await getOrderById(orderId);
  if (!order) {
    return (
      <div className="text-sm text-muted-foreground text-center mt-12">
        Order not found.
      </div>
    );
  }
  return (
    <div className="mx-auto max-w-xl px-2 py-8">
      <div className="rounded-2xl border-2 border-muted/40 p-6 shadow-sm">
        <h1 className="text-2xl font-extrabold mb-4 tracking-tight">
          Order #{order.id.slice(0, 8)}
        </h1>
        <OrderTrackingClient orderId={order.id} initialStatus={order.status} />
      </div>
    </div>
  );
}
