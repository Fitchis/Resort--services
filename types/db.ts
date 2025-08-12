export type UserRole = "admin" | "manager" | "kitchen"

export type Category = {
  id: string
  name: string
  display_order?: number
  is_active: boolean
}

export type MenuItem = {
  id: string
  name: string
  description?: string
  price: number // cents
  category_id?: string
  image_url?: string
  dietary_info?: {
    vegetarian?: boolean
    vegan?: boolean
    glutenFree?: boolean
    allergens?: string[]
  }
  is_available: boolean
}

export type OrderItem = {
  id: string
  order_id: string
  menu_item_id: string
  quantity: number
  customizations?: string
  unit_price: number
}

export type Order = {
  id: string
  room_number: string
  status: "received" | "preparing" | "ready" | "delivered"
  total_amount: number
  special_instructions?: string
  created_at: string
  estimated_delivery?: string
  items: OrderItem[]
}

export type Review = {
  id: string
  order_id: string
  rating: number
  comment?: string
  created_at: string
}

export type Room = {
  room_number: string
  status: "occupied" | "vacant" | "cleaning"
  current_guest?: string
  qr_code_url?: string
}
