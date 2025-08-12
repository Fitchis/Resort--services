import { NextResponse } from "next/server";
import { validateRoom } from "@/lib/rooms";

export async function GET(
  _: Request,
  { params }: { params: Promise<{ roomNumber: string }> }
) {
  const { roomNumber } = await params;
  const ok = await validateRoom(roomNumber);
  return NextResponse.json({ ok });
}
