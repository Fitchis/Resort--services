import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { MenuCreateSchema } from "@/lib/validation";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const all = url.searchParams.get("all") === "1";
  let includeHidden = false;
  if (all) {
    const session = await getServerSession(authOptions);
    const role = (session?.user as { role?: string } | undefined)?.role;
    includeHidden = role === "admin" || role === "manager";
  }
  const [categories, items] = await Promise.all([
    prisma.categories.findMany({
      where: { is_active: true },
      orderBy: { display_order: "asc" },
    }),
    prisma.menuItems.findMany({
      where: includeHidden ? {} : { is_available: true },
    }),
  ]);
  return NextResponse.json({
    categories: categories.map((c) => ({
      id: c.id,
      name: c.name,
      display_order: c.display_order ?? undefined,
      is_active: c.is_active,
    })),
    items: items.map((i) => ({
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
    })),
  });
}

// (type removed; using inline typing below)

export async function POST(request: Request) {
  try {
    // Only admin/manager can create menu items
    const session = await getServerSession(authOptions);
    const role = (session?.user as { role?: string } | undefined)?.role;
    if (!(role === "admin" || role === "manager")) {
      return new NextResponse("Forbidden", { status: 403 });
    }
    const json = await request.json();
    const parsed = MenuCreateSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { errors: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const created = await prisma.menuItems.create({
      data: {
        name: parsed.data.name,
        description: parsed.data.description ?? undefined,
        price: parsed.data.price,
        category_id: parsed.data.category_id ?? undefined,
        image_url: parsed.data.image_url ?? undefined,
        dietary_info: parsed.data.dietary_info ?? undefined,
        is_available:
          parsed.data.is_available === undefined
            ? true
            : parsed.data.is_available,
      },
    });
    return NextResponse.json({ id: created.id });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Invalid payload";
    return new NextResponse(message, { status: 400 });
  }
}
