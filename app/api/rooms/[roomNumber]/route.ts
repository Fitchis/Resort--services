import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getRoom, updateRoom, deleteRoom } from "@/lib/rooms";
import { RoomUpdateSchema } from "@/lib/validation";

function isStaff(role?: string) {
  return role === "admin" || role === "manager" || role === "kitchen";
}

function isManager(role?: string) {
  return role === "admin" || role === "manager";
}

export async function GET(
  _: Request,
  { params }: { params: Promise<{ roomNumber: string }> }
) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!isStaff(role)) return new NextResponse("Unauthorized", { status: 401 });
  const { roomNumber } = await params;
  const r = await getRoom(roomNumber);
  if (!r) return new NextResponse("Not found", { status: 404 });
  return NextResponse.json(r);
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ roomNumber: string }> }
) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!isManager(role)) return new NextResponse("Forbidden", { status: 403 });
  const json = await request.json();
  const parsed = RoomUpdateSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { errors: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const { roomNumber } = await params;
  const updated = await updateRoom(roomNumber, {
    status: parsed.data.status,
    current_guest: parsed.data.current_guest ?? undefined,
    qr_code_url: parsed.data.qr_code_url ?? undefined,
  });
  if (!updated) return new NextResponse("Not found", { status: 404 });
  return NextResponse.json(updated);
}

export async function DELETE(
  _: Request,
  { params }: { params: Promise<{ roomNumber: string }> }
) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!isManager(role)) return new NextResponse("Forbidden", { status: 403 });
  const { roomNumber } = await params;
  const ok = await deleteRoom(roomNumber);
  if (!ok) return new NextResponse("Not found", { status: 404 });
  return NextResponse.json({ ok: true });
}
