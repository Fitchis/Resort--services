import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getOrdersByRoom } from "@/lib/orders";

function isStaff(role?: string) {
  return (
    role === "admin" ||
    role === "manager" ||
    role === "staff" ||
    role === "kitchen"
  );
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ roomNumber: string }> }
) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!isStaff(role)) return new NextResponse("Unauthorized", { status: 401 });

  const url = new URL(request.url);
  const limit = Math.max(
    1,
    Math.min(50, Number(url.searchParams.get("limit") || 5))
  );

  const { roomNumber } = await params;
  const orders = await getOrdersByRoom(roomNumber);
  return NextResponse.json({ orders: orders.slice(0, limit) });
}
