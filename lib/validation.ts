import { z } from "zod";

export const MenuDietarySchema = z
  .object({
    vegetarian: z.boolean().optional(),
    vegan: z.boolean().optional(),
    glutenFree: z.boolean().optional(),
    allergens: z.array(z.string()).optional(),
  })
  .optional();

export const MenuCreateSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  price: z.number().int().nonnegative(),
  category_id: z.string().optional(),
  image_url: z.string().url().optional(),
  dietary_info: MenuDietarySchema,
  is_available: z.boolean().default(true).optional(),
});

export const MenuUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  price: z.number().int().nonnegative().optional(),
  category_id: z.string().nullable().optional(),
  image_url: z.string().url().nullable().optional(),
  dietary_info: MenuDietarySchema,
  is_available: z.boolean().optional(),
});

export const RoomCreateSchema = z.object({
  room_number: z.string().min(1),
  status: z.enum(["vacant", "occupied", "cleaning"]).optional(),
  current_guest: z.string().nullable().optional(),
  qr_code_url: z.string().url().nullable().optional(),
});

export const RoomUpdateSchema = z.object({
  status: z.enum(["vacant", "occupied", "cleaning"]).optional(),
  current_guest: z.string().nullable().optional(),
  qr_code_url: z.string().url().nullable().optional(),
});

export const OrderItemSchema = z.object({
  menu_item_id: z.string().min(1),
  quantity: z.number().int().positive().default(1),
  customizations: z.string().optional(),
  unit_price: z.number().int().nonnegative(),
});

export const OrderCreateSchema = z.object({
  room_number: z.string().min(1),
  items: z.array(OrderItemSchema).min(1),
  special_instructions: z.string().optional(),
  requested_eta: z.string().optional(),
});

export type MenuCreateInput = z.infer<typeof MenuCreateSchema>;
export type MenuUpdateInput = z.infer<typeof MenuUpdateSchema>;
export type RoomCreateInput = z.infer<typeof RoomCreateSchema>;
export type RoomUpdateInput = z.infer<typeof RoomUpdateSchema>;
export type OrderCreateInput = z.infer<typeof OrderCreateSchema>;
