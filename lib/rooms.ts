import { prisma } from "./prisma";

export type Room = {
  room_number: string;
  status: string;
  current_guest?: string | null;
  qr_code_url?: string | null;
};

function mapRoom(r: {
  room_number: string;
  status: string;
  current_guest: string | null;
  qr_code_url: string | null;
}): Room {
  return {
    room_number: r.room_number,
    status: r.status,
    current_guest: r.current_guest,
    qr_code_url: r.qr_code_url,
  };
}

export async function validateRoom(roomNumber: string): Promise<boolean> {
  const count = await prisma.rooms.count({
    where: { room_number: roomNumber },
  });
  return count > 0;
}

export async function getRoom(roomNumber: string): Promise<Room | null> {
  const r = await prisma.rooms.findUnique({
    where: { room_number: roomNumber },
  });
  return r ? mapRoom(r) : null;
}

export async function listRooms(): Promise<Room[]> {
  const rooms = await prisma.rooms.findMany({
    orderBy: { room_number: "asc" },
  });
  return rooms.map(mapRoom);
}

export async function createRoom(data: {
  room_number: string;
  status?: string;
  current_guest?: string | null;
  qr_code_url?: string | null;
}): Promise<Room> {
  const created = await prisma.rooms.create({
    data: {
      room_number: data.room_number,
      status: data.status ?? "vacant",
      current_guest: data.current_guest ?? null,
      qr_code_url: data.qr_code_url ?? null,
    },
  });
  return mapRoom(created);
}

export async function updateRoom(
  roomNumber: string,
  data: Partial<{
    status: string;
    current_guest: string | null;
    qr_code_url: string | null;
  }>
): Promise<Room | null> {
  const updated = await prisma.rooms
    .update({
      where: { room_number: roomNumber },
      data: {
        status: data.status,
        current_guest: data.current_guest,
        qr_code_url: data.qr_code_url,
      },
    })
    .catch(() => null);
  return updated ? mapRoom(updated) : null;
}

export async function deleteRoom(roomNumber: string): Promise<boolean> {
  const deleted = await prisma.rooms
    .delete({ where: { room_number: roomNumber } })
    .catch(() => null);
  return Boolean(deleted);
}
