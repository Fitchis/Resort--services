import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { MenuUpdateSchema } from "@/lib/validation";

export async function GET(
  _: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const i = await prisma.menuItems.findUnique({ where: { id } });
  if (!i) return new NextResponse("Not found", { status: 404 });
  return NextResponse.json({
    id: i.id,
    name: i.name,
    description: i.description ?? undefined,
    price: i.price,
    category_id: i.category_id ?? undefined,
    image_url: i.image_url ?? undefined,
    dietary_info: i.dietary_info as
      | {
          vegetarian?: boolean;
          vegan?: boolean;
          glutenFree?: boolean;
          allergens?: string[];
        }
      | undefined,
    is_available: i.is_available,
  });
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!(role === "admin" || role === "manager")) {
    return new NextResponse("Forbidden", { status: 403 });
  }
  const { id } = await params;
  const json = await request.json();
  const parsed = MenuUpdateSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { errors: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const updated = await prisma.menuItems
    .update({
      where: { id },
      data: {
        name: parsed.data.name,
        description: parsed.data.description,
        price: parsed.data.price,
        category_id: parsed.data.category_id ?? undefined,
        image_url: parsed.data.image_url ?? undefined,
        dietary_info: parsed.data.dietary_info,
        is_available: parsed.data.is_available,
      },
    })
    .catch(() => null);
  if (!updated) return new NextResponse("Not found", { status: 404 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as { role?: string } | undefined)?.role;
  if (!(role === "admin" || role === "manager")) {
    return new NextResponse("Forbidden", { status: 403 });
  }
  const { id } = await params;
  await prisma.menuItems.delete({ where: { id } }).catch(() => null);
  return NextResponse.json({ ok: true });
}
