import "dotenv/config";
import bcrypt from "bcryptjs";
import { prisma } from "../src/lib/prisma";

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL ?? "admin@jarchifx.local";
  const adminPassword = process.env.ADMIN_PASSWORD ?? "admin12345";
  const passwordHash = await bcrypt.hash(adminPassword, 12);

  await prisma.admin.upsert({
    where: { email: adminEmail },
    update: { passwordHash },
    create: { name: "Admin JarchiFX", email: adminEmail, passwordHash },
  });

  await prisma.courseClass.upsert({
    where: { slug: "kelas-dasar" },
    update: {},
    create: {
      name: "Kelas Dasar",
      slug: "kelas-dasar",
      price: 499000,
      accessDays: 90,
      discordRoleId: "",
      isActive: true,
    },
  });

  await prisma.courseClass.upsert({
    where: { slug: "kelas-pro" },
    update: {},
    create: {
      name: "Kelas Pro",
      slug: "kelas-pro",
      price: 999000,
      accessDays: null,
      discordRoleId: "",
      isActive: true,
    },
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
