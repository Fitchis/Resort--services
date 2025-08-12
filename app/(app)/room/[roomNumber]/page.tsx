import { notFound } from "next/navigation";
import MenuGrid from "@/components/menu-grid";
import CartSheet from "@/components/cart-sheet";
import { validateRoom } from "@/lib/rooms";
import { Suspense } from "react";
import Link from "next/link";

export default async function RoomMenuPage({
  params,
}: {
  params: Promise<{ roomNumber: string }>;
}) {
  const { roomNumber } = await params;
  const valid = await validateRoom(roomNumber);
  if (!valid) return notFound();

  return (
    <div className="mx-auto max-w-6xl px-2 py-8 text-foreground">
      <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight mb-1">
            Room {roomNumber} Menu
          </h1>
          <p className="text-muted-foreground text-base">
            Order food and drinks to your room.
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            href={`/orders?room=${roomNumber}`}
            className="text-sm font-semibold px-4 py-2 rounded-lg border border-primary bg-primary/10 text-primary hover:bg-primary/20 transition"
          >
            Track my orders
          </Link>
        </div>
      </div>
      <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
        <div className="min-w-0">
          <div className="rounded-2xl border border-card bg-card p-6 shadow-sm text-card-foreground">
            <Suspense
              fallback={
                <div className="text-sm text-muted-foreground">
                  Loading menu...
                </div>
              }
            >
              <MenuGrid />
            </Suspense>
          </div>
        </div>
        <aside className="min-w-0 lg:sticky lg:top-24">
          <CartSheet roomNumber={roomNumber} />
        </aside>
      </div>
    </div>
  );
}
