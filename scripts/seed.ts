import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // Seed demo staff users
  const demoPw = await bcrypt.hash("demo", 10);
  await prisma.users.upsert({
    where: { email: "admin@resort.com" },
    update: {},
    create: {
      email: "admin@resort.com",
      role: "admin",
      password_hash: demoPw,
      name: "Admin",
    },
  });
  await prisma.users.upsert({
    where: { email: "manager@resort.com" },
    update: {},
    create: {
      email: "manager@resort.com",
      role: "manager",
      password_hash: demoPw,
      name: "Manager",
    },
  });
  await prisma.users.upsert({
    where: { email: "kitchen@resort.com" },
    update: {},
    create: {
      email: "kitchen@resort.com",
      role: "kitchen",
      password_hash: demoPw,
      name: "Kitchen",
    },
  });
  await prisma.$transaction([
    prisma.categories.createMany({
      data: [
        { id: "app", name: "Appetizers", is_active: true },
        { id: "main", name: "Mains", is_active: true },
        { id: "dess", name: "Desserts", is_active: true },
        { id: "bev", name: "Beverages", is_active: true },
      ],
      skipDuplicates: true,
    }),
    prisma.rooms.createMany({
      data: [
        { room_number: "1201", status: "occupied", current_guest: "Guest" },
        { room_number: "1202", status: "occupied", current_guest: "Guest" },
        { room_number: "1203", status: "occupied", current_guest: "Guest" },
        { room_number: "1408", status: "occupied", current_guest: "Guest" },
      ],
      skipDuplicates: true,
    }),
  ]);

  await prisma.menuItems.createMany({
    data: [
      {
        id: "bruschetta",
        name: "Tomato Bruschetta",
        description: "Grilled bread, tomato, basil, olive oil",
        price: 900,
        category_id: "app",
        image_url: "/tomato-bruschetta.png",
        dietary_info: { vegetarian: true },
        is_available: true,
      },
      {
        id: "pasta",
        name: "Penne Arrabbiata",
        description: "Tomato, garlic, chili, parsley",
        price: 1800,
        category_id: "main",
        image_url: "/penne-arrabbiata.png",
        dietary_info: { vegetarian: true, vegan: true },
        is_available: true,
      },
      {
        id: "steak",
        name: "Ribeye Steak",
        description: "Chargrilled steak with herb butter",
        price: 3800,
        category_id: "main",
        image_url: "/steak-herb-butter.png",
        is_available: true,
      },
    ],
    skipDuplicates: true,
  });

  console.log("Seed complete");
}

main().finally(() => prisma.$disconnect());
