import { PrismaClient } from "@prisma/client";

async function main() {
  const prisma = new PrismaClient();
  try {
    const rooms = await prisma.rooms.count();
    const categories = await prisma.categories.count();
    const menuItems = await prisma.menuItems.count();
    console.log(JSON.stringify({ ok: true, rooms, categories, menuItems }));
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(JSON.stringify({ ok: false, error: String(e) }));
  process.exit(1);
});
