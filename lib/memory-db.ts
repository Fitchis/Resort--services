import type { Category, MenuItem, Order, OrderItem, Review, Room } from "@/types/db"
import { randomUUID } from "crypto"

// This in-memory store is for preview/demo. Replace with Prisma in production.
const db = {
  rooms: new Map<string, Room>(),
  categories: new Map<string, Category>(),
  items: new Map<string, MenuItem>(),
  orders: new Map<string, Order>(),
  reviews: new Map<string, Review>(),
}

function seedOnce() {
  if (db.rooms.size > 0) return // Rooms
  ;["1201", "1202", "1203", "1408"].forEach((r) =>
    db.rooms.set(r, { room_number: r, status: "occupied", current_guest: "Guest" }),
  )
  // Categories
  const catApp = { id: "app", name: "Appetizers", is_active: true }
  const catMain = { id: "main", name: "Mains", is_active: true }
  const catDess = { id: "dess", name: "Desserts", is_active: true }
  const catBev = { id: "bev", name: "Beverages", is_active: true }
  ;[catApp, catMain, catDess, catBev].forEach((c) => db.categories.set(c.id, c))

  // Items
  const items: MenuItem[] = [
    {
      id: "bruschetta",
      name: "Tomato Bruschetta",
      description: "Grilled bread, tomato, basil, olive oil",
      price: 900,
      category_id: "app",
      image_url: "/tomato-bruschetta.png",
      dietary_info: { vegetarian: true },
      is_available: true,
    },
    {
      id: "pasta",
      name: "Penne Arrabbiata",
      description: "Tomato, garlic, chili, parsley",
      price: 1800,
      category_id: "main",
      image_url: "/penne-arrabbiata.png",
      dietary_info: { vegetarian: true, vegan: true },
      is_available: true,
    },
    {
      id: "steak",
      name: "Ribeye Steak",
      description: "Chargrilled steak with herb butter",
      price: 3800,
      category_id: "main",
      image_url: "/steak-herb-butter.png",
      is_available: true,
    },
    {
      id: "cheesecake",
      name: "New York Cheesecake",
      description: "Classic cheesecake with berry compote",
      price: 1200,
      category_id: "dess",
      image_url: "/cheesecake-berry.png",
      is_available: true,
    },
    {
      id: "lemonade",
      name: "Fresh Lemonade",
      description: "House-made lemonade",
      price: 600,
      category_id: "bev",
      image_url: "/placeholder-0tvi8.png",
      dietary_info: { vegan: true, glutenFree: true },
      is_available: true,
    },
  ]
  items.forEach((i) => db.items.set(i.id, i))
}

seedOnce()

export const memoryDb = db

export function createOrder({
  room_number,
  items,
  special_instructions,
  requested_eta,
}: {
  room_number: string
  items: { menu_item_id: string; quantity: number; customizations?: string; unit_price: number }[]
  special_instructions?: string
  requested_eta?: string
}): Order {
  const id = randomUUID()
  const orderItems: OrderItem[] = items.map((it) => ({
    id: randomUUID(),
    order_id: id,
    ...it,
  }))
  const total = items.reduce((sum, it) => sum + it.unit_price * it.quantity, 0)
  const newOrder: Order = {
    id,
    room_number,
    status: "received",
    total_amount: total,
    special_instructions,
    created_at: new Date().toISOString(),
    estimated_delivery: requested_eta && requested_eta !== "asap" ? `${requested_eta} minutes` : "ASAP",
    items: orderItems,
  }
  db.orders.set(id, newOrder)
  return newOrder
}

export function advanceOrder(id: string): Order | null {
  const o = db.orders.get(id)
  if (!o) return null
  const flow: Order["status"][] = ["received", "preparing", "ready", "delivered"]
  const next = flow[Math.min(flow.indexOf(o.status) + 1, flow.length - 1)]
  o.status = next
  db.orders.set(id, o)
  return o
}
