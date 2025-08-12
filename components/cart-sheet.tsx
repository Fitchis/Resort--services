"use client";

import { useEffect, useRef, useState } from "react";
import { useCartStore } from "@/store/cart-store";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Minus, Plus, ShoppingCart, Trash } from "lucide-react";
import CheckoutDialog from "@/components/checkout-dialog";

export default function CartSheet({
  roomNumber = "",
}: {
  roomNumber?: string;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const items = useCartStore((s) => s.items);
  const inc = useCartStore((s) => s.increment);
  const dec = useCartStore((s) => s.decrement);
  const remove = useCartStore((s) => s.remove);
  const total = useCartStore((s) => s.total());

  // Avoid hydration mismatch: render empty values until mounted
  const hydratedItems = mounted ? items : [];
  const itemCount = hydratedItems.length;
  const displayTotal = mounted ? total : 0;

  // Bump animation when item count increases
  const [bump, setBump] = useState(false);
  const prevCountRef = useRef<number | null>(null);
  useEffect(() => {
    if (!mounted) return;
    const prev = prevCountRef.current;
    prevCountRef.current = itemCount;
    if (prev === null) return; // skip first hydrate
    if (itemCount > (prev ?? 0)) {
      setBump(true);
      const t = setTimeout(() => setBump(false), 220);
      return () => clearTimeout(t);
    }
  }, [mounted, itemCount]);

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" className="w-full bg-transparent">
          <ShoppingCart className="mr-2 h-4 w-4" />
          Cart (
          <span
            className={
              "inline-block translate-z-0 transform-gpu transition-transform duration-200 " +
              (bump ? "scale-110" : "scale-100")
            }
          >
            {itemCount}
          </span>
          ) • ${(displayTotal / 100).toFixed(2)}
        </Button>
      </SheetTrigger>
      <SheetContent className="flex w-full max-w-[420px] flex-col p-0 sm:w-[420px]">
        <SheetHeader className="border-b p-4">
          <SheetTitle>Your Order</SheetTitle>
        </SheetHeader>
        <ScrollArea className="flex-1 p-4 pb-32 sm:pb-4">
          <div className="space-y-4">
            {itemCount === 0 ? (
              <p className="text-sm text-muted-foreground">
                Your cart is empty.
              </p>
            ) : (
              hydratedItems.map((it) => (
                <div
                  key={it.key}
                  className="flex items-start justify-between gap-3 rounded-xl border-2 border-card bg-card p-4 shadow-sm transition hover:shadow-md hover:border-primary"
                >
                  <div className="min-w-0">
                    <div className="font-semibold text-base break-words mb-1">
                      {it.name}
                    </div>
                    {it.customizations ? (
                      <div className="text-xs text-muted-foreground">
                        {it.customizations}
                      </div>
                    ) : null}
                    {it.notes ? (
                      <div className="text-xs text-muted-foreground">
                        Note: {it.notes}
                      </div>
                    ) : null}
                    <div className="text-xs text-muted-foreground mt-1">
                      ${(it.unit_price / 100).toFixed(2)} each
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2 min-w-[80px]">
                    <div className="flex items-center gap-1">
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-8 w-8 rounded-full border-primary/40"
                        onClick={() => dec(it.key)}
                        aria-label="Decrease"
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="w-7 text-center font-semibold text-base">
                        {it.quantity}
                      </span>
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-8 w-8 rounded-full border-primary/40"
                        onClick={() => inc(it.key)}
                        aria-label="Increase"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 text-destructive hover:bg-destructive/10"
                      onClick={() => remove(it.key)}
                      aria-label="Remove"
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
        {/* Sticky footer for total and checkout on mobile */}
        <div className="border-t bg-background p-4 fixed bottom-0 left-0 right-0 z-20 sm:static sm:z-auto sm:bg-transparent sm:p-4">
          <div className="mb-3 flex items-center justify-between text-base font-medium">
            <span>Total</span>
            <span className="font-semibold">
              ${(displayTotal / 100).toFixed(2)}
            </span>
          </div>
          <CheckoutDialog roomNumber={roomNumber} disabled={itemCount === 0} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
