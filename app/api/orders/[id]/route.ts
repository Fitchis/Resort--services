import { NextResponse } from "next/server";
import { advanceOrderStatus, getOrderById } from "@/lib/orders";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(
  _: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const order = await getOrderById(id);
  if (!order) return new NextResponse("Not found", { status: 404 });
  return NextResponse.json(order);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string } | undefined)?.role;
  const staff = role === "admin" || role === "manager" || role === "kitchen";
  if (!staff) return new NextResponse("Unauthorized", { status: 401 });
  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  if (body.op === "advance") {
    const updated = await advanceOrderStatus(id);
    if (!updated) return new NextResponse("Not found", { status: 404 });
    return NextResponse.json({ ok: true });
  }
  return new NextResponse("Unsupported operation", { status: 400 });
}
