import { prisma } from "@/lib/prisma";
import { createOrder } from "@/lib/services/order-service";

export async function resetDatabase() {
  await prisma.job.deleteMany();
  await prisma.member.deleteMany();
  await prisma.redeemAttempt.deleteMany();
  await prisma.accessCode.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.order.deleteMany();
  await prisma.admin.deleteMany();
  await prisma.courseClass.deleteMany();
}

export async function seedClasses() {
  await prisma.courseClass.create({
    data: {
      name: "Kelas Dasar",
      slug: "kelas-dasar",
      price: 499000,
      accessDays: 90,
      discordRoleId: "role-dasar",
      isActive: true,
    },
  });

  await prisma.courseClass.create({
    data: {
      name: "Kelas Pro",
      slug: "kelas-pro",
      price: 999000,
      accessDays: null,
      discordRoleId: "role-pro",
      isActive: true,
    },
  });
}

export async function createTestOrder(slug = "kelas-dasar") {
  const result = await createOrder({
    name: "Pembeli Tes",
    email: "pembeli@example.com",
    whatsapp: "08123456789",
    classSlug: slug,
  });

  const order = await prisma.order.findUniqueOrThrow({
    where: { orderCode: result.orderCode },
  });

  return order;
}
