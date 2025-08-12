import { NextResponse } from "next/server";
import { createNewOrder, listOrders } from "@/lib/orders";
import { validateRoom } from "@/lib/rooms";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { OrderCreateSchema } from "@/lib/validation";

function isStaff(role?: string) {
  return role === "admin" || role === "manager" || role === "kitchen";
}

export async function GET() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!isStaff(role)) return new NextResponse("Unauthorized", { status: 401 });
  const orders = await listOrders();
  return NextResponse.json(orders);
}

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const parsed = OrderCreateSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { errors: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const room = parsed.data.room_number;
    if (!room || !(await validateRoom(room)))
      return new NextResponse("Invalid room", { status: 400 });
    const items = parsed.data.items;
    const order = await createNewOrder({
      room_number: room,
      items: items.map((it) => ({
        menu_item_id: it.menu_item_id,
        quantity: it.quantity ?? 1,
        customizations: it.customizations,
        unit_price: it.unit_price,
      })),
      special_instructions: parsed.data.special_instructions,
      requested_eta: parsed.data.requested_eta,
    });
    return NextResponse.json({ id: order.id });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Invalid payload";
    return new NextResponse(message, { status: 400 });
  }
}
