"use client";

import { z } from "zod";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { useCartStore } from "@/store/cart-store";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

const CheckoutSchema = z.object({
  deliveryTime: z.enum(["asap", "15", "30", "45", "60"]),
  specialInstructions: z.string().max(300).optional(),
  dietaryNotes: z.string().max(300).optional(),
});

type CheckoutValues = z.infer<typeof CheckoutSchema>;

export default function CheckoutDialog({
  roomNumber = "",
  disabled = false,
}: {
  roomNumber?: string;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const { toast } = useToast();
  const router = useRouter();
  const cart = useCartStore();
  const form = useForm<CheckoutValues>({
    resolver: zodResolver(CheckoutSchema),
    defaultValues: { deliveryTime: "asap" },
  });

  const createOrder = useMutation({
    mutationFn: async (values: CheckoutValues) => {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          room_number: roomNumber,
          items: cart.items.map((i) => ({
            menu_item_id: i.menu_item_id,
            quantity: i.quantity,
            customizations: i.customizations ?? "",
            unit_price: i.unit_price,
          })),
          special_instructions: [
            values.specialInstructions,
            values.dietaryNotes,
          ]
            .filter(Boolean)
            .join(" • "),
          requested_eta: values.deliveryTime,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json() as Promise<{ id: string }>;
    },
    onSuccess: (data) => {
      cart.clear();
      setOpen(false);
      toast({
        title: "Order placed!",
        description: "We'll keep you updated with status.",
      });
      router.push(`/orders/${data.id}`);
    },
    onError: (err: unknown) => {
      console.error(err);
      toast({
        title: "Order failed",
        description: "Please try again.",
        variant: "destructive",
      });
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          disabled={disabled}
          className="w-full font-semibold px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition"
        >
          Place order
        </Button>
      </DialogTrigger>
      <DialogContent
        role="dialog"
        aria-label="Checkout dialog"
        className="max-w-[95vw] sm:max-w-lg p-0"
      >
        <div className="rounded-2xl border-2 border-card bg-card shadow-sm">
          <DialogHeader className="border-b p-4">
            <DialogTitle>Delivery preferences</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={form.handleSubmit((values) => {
              createOrder.mutate(values);
            })}
            className="space-y-4 p-4"
          >
            <div className="space-y-2 bg-muted/40 rounded-lg p-3">
              <Label className="mb-1">Delivery time</Label>
              <Controller
                control={form.control}
                name="deliveryTime"
                render={({ field }) => (
                  <RadioGroup
                    value={field.value}
                    onValueChange={field.onChange}
                    className="grid grid-cols-3 gap-2"
                  >
                    <Label
                      className="flex items-center gap-2 rounded-md border p-2 bg-background hover:bg-muted transition cursor-pointer"
                      htmlFor="asap"
                    >
                      <RadioGroupItem value="asap" id="asap" />
                      <span>ASAP</span>
                    </Label>
                    <Label
                      className="flex items-center gap-2 rounded-md border p-2 bg-background hover:bg-muted transition cursor-pointer"
                      htmlFor="15"
                    >
                      <RadioGroupItem value="15" id="15" />
                      <span>15 min</span>
                    </Label>
                    <Label
                      className="flex items-center gap-2 rounded-md border p-2 bg-background hover:bg-muted transition cursor-pointer"
                      htmlFor="30"
                    >
                      <RadioGroupItem value="30" id="30" />
                      <span>30 min</span>
                    </Label>
                    <Label
                      className="flex items-center gap-2 rounded-md border p-2 bg-background hover:bg-muted transition cursor-pointer"
                      htmlFor="45"
                    >
                      <RadioGroupItem value="45" id="45" />
                      <span>45 min</span>
                    </Label>
                    <Label
                      className="flex items-center gap-2 rounded-md border p-2 bg-background hover:bg-muted transition cursor-pointer"
                      htmlFor="60"
                    >
                      <RadioGroupItem value="60" id="60" />
                      <span>60 min</span>
                    </Label>
                  </RadioGroup>
                )}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="special">Special instructions</Label>
              <Textarea
                id="special"
                placeholder="e.g., Ring the doorbell twice"
                className="bg-muted/30 text-card-foreground"
                {...form.register("specialInstructions")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dietary">Dietary notes</Label>
              <Input
                id="dietary"
                placeholder="e.g., peanut allergy"
                className="bg-muted/30 text-card-foreground"
                {...form.register("dietaryNotes")}
              />
            </div>
            <DialogFooter>
              <Button
                type="submit"
                disabled={createOrder.isPending}
                className="w-full font-semibold px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition"
              >
                {createOrder.isPending ? "Placing..." : "Confirm order"}
              </Button>
            </DialogFooter>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
