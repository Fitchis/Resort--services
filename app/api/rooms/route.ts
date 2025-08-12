import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { listRooms, createRoom } from "@/lib/rooms";
import { RoomCreateSchema } from "@/lib/validation";

function isStaff(role?: string) {
  return role === "admin" || role === "manager" || role === "kitchen";
}

function isManager(role?: string) {
  return role === "admin" || role === "manager";
}

export async function GET() {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!isStaff(role)) return new NextResponse("Unauthorized", { status: 401 });
  const rooms = await listRooms();
  return NextResponse.json({ rooms });
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!isManager(role)) return new NextResponse("Forbidden", { status: 403 });

  try {
    const json = await request.json();
    const parsed = RoomCreateSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { errors: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const room = await createRoom(parsed.data);
    return NextResponse.json(room, { status: 201 });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Invalid payload";
    return new NextResponse(message, { status: 400 });
  }
}
