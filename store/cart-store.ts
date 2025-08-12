"use client"

import { create } from "zustand"
import type { MenuItem } from "@/types/db"
import { persist } from "zustand/middleware"

type CartItem = {
  key: string
  menu_item_id: string
  name: string
  quantity: number
  customizations?: string
  notes?: string
  unit_price: number
}

type CartState = {
  items: CartItem[]
  add: (item: MenuItem) => void
  increment: (key: string) => void
  decrement: (key: string) => void
  remove: (key: string) => void
  clear: () => void
  total: () => number
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      add: (item) =>
        set((state) => {
          const key = item.id
          const existing = state.items.find((i) => i.key === key)
          if (existing) {
            return { items: state.items.map((i) => (i.key === key ? { ...i, quantity: i.quantity + 1 } : i)) }
          }
          return {
            items: [
              ...state.items,
              {
                key,
                menu_item_id: item.id,
                name: item.name,
                quantity: 1,
                unit_price: item.price,
              },
            ],
          }
        }),
      increment: (key) =>
        set((s) => ({ items: s.items.map((i) => (i.key === key ? { ...i, quantity: i.quantity + 1 } : i)) })),
      decrement: (key) =>
        set((s) => ({
          items: s.items
            .map((i) => (i.key === key ? { ...i, quantity: Math.max(0, i.quantity - 1) } : i))
            .filter((i) => i.quantity > 0),
        })),
      remove: (key) => set((s) => ({ items: s.items.filter((i) => i.key !== key) })),
      clear: () => set({ items: [] }),
      total: () => get().items.reduce((sum, i) => sum + i.unit_price * i.quantity, 0),
    }),
    { name: "resort-cart" },
  ),
)
