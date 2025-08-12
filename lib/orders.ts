export async function getOrdersByRoom(room_number: string) {
  const orders = await prisma.orders.findMany({
    where: { room_number },
    orderBy: { created_at: "desc" },
  });
  return orders.map((order) => ({
    id: order.id,
    room_number: order.room_number,
    status: order.status as Order["status"],
    total_amount: order.total_amount,
    special_instructions: order.special_instructions ?? undefined,
    created_at: order.created_at.toISOString(),
    estimated_delivery: order.estimated_delivery ?? undefined,
  }));
}
import { prisma } from "./prisma";
import type { Order } from "@/types/db";
import { publish } from "./realtime";

export async function getOrderById(id: string) {
  const order = await prisma.orders.findUnique({
    where: { id },
    include: { OrderItems: true },
  });
  if (!order) return null;
  const result: Order = {
    id: order.id,
    room_number: order.room_number,
    status: order.status as Order["status"],
    total_amount: order.total_amount,
    special_instructions: order.special_instructions ?? undefined,
    created_at: order.created_at.toISOString(),
    estimated_delivery: order.estimated_delivery ?? undefined,
    items: order.OrderItems.map((it) => ({
      id: it.id,
      order_id: it.order_id,
      menu_item_id: it.menu_item_id,
      quantity: it.quantity,
      customizations: it.customizations ?? undefined,
      unit_price: it.unit_price,
    })),
  };
  return result;
}

export async function listOrders() {
  const orders = await prisma.orders.findMany({
    orderBy: { created_at: "desc" },
    include: { OrderItems: true },
  });
  return orders.map((order) => ({
    id: order.id,
    room_number: order.room_number,
    status: order.status as Order["status"],
    total_amount: order.total_amount,
    special_instructions: order.special_instructions ?? undefined,
    created_at: order.created_at.toISOString(),
    estimated_delivery: order.estimated_delivery ?? undefined,
    items: order.OrderItems.map((it) => ({
      id: it.id,
      order_id: it.order_id,
      menu_item_id: it.menu_item_id,
      quantity: it.quantity,
      customizations: it.customizations ?? undefined,
      unit_price: it.unit_price,
    })),
  }));
}

export async function createNewOrder(input: {
  room_number: string;
  items: {
    menu_item_id: string;
    quantity: number;
    customizations?: string;
    unit_price: number;
  }[];
  special_instructions?: string;
  requested_eta?: string;
}) {
  const created = await prisma.orders.create({
    data: {
      room_number: input.room_number,
      status: "received",
      total_amount: input.items.reduce(
        (s, it) => s + it.unit_price * it.quantity,
        0
      ),
      special_instructions: input.special_instructions,
      estimated_delivery:
        input.requested_eta && input.requested_eta !== "asap"
          ? `${input.requested_eta} minutes`
          : "ASAP",
      OrderItems: {
        create: input.items.map((it) => ({
          menu_item_id: it.menu_item_id,
          quantity: it.quantity,
          customizations: it.customizations,
          unit_price: it.unit_price,
        })),
      },
    },
    include: { OrderItems: true },
  });
  const order = await getOrderById(created.id);
  if (order) {
    publish("orders", { type: "created", order });
    publish(`order:${order.id}`, { status: order.status });
    publish(`room:${order.room_number}`, { type: "order", order });
  }
  return order!;
}

export async function advanceOrderStatus(id: string) {
  const current = await prisma.orders.findUnique({ where: { id } });
  if (!current) return null;
  const flow: Order["status"][] = [
    "received",
    "preparing",
    "ready",
    "delivered",
  ];
  const idx = Math.min(
    flow.indexOf(current.status as Order["status"]) + 1,
    flow.length - 1
  );
  const next = flow[idx];
  const updated = await prisma.orders.update({
    where: { id },
    data: { status: next },
  });
  const order = await getOrderById(updated.id);
  if (order) {
    publish("orders", { type: "updated", order });
    publish(`order:${order.id}`, { status: order.status });
    publish(`room:${order.room_number}`, { type: "order", order });
  }
  return order;
}
