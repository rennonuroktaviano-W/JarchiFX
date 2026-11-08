import { randomBytes } from "node:crypto";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { createPayment } from "@/lib/services/payment/gateway";
import type { CheckoutInput } from "@/lib/validation/checkout";

export class OrderError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OrderError";
  }
}

export async function createOrder(input: CheckoutInput) {
  const courseClass = await prisma.courseClass.findFirst({
    where: { slug: input.classSlug, isActive: true },
  });

  if (!courseClass) {
    throw new OrderError("Paket tidak tersedia.");
  }

  const orderCode = randomBytes(15).toString("base64url");
  const order = await prisma.order.create({
    data: {
      orderCode,
      classId: courseClass.id,
      buyerName: input.name,
      buyerEmail: input.email,
      buyerWhatsapp: input.whatsapp,
      amount: courseClass.price,
      status: "pending",
    },
  });

  try {
    const payment = await createPayment({
      orderCode: order.orderCode,
      amount: order.amount,
      buyerName: order.buyerName,
      buyerEmail: order.buyerEmail,
    });

    await prisma.payment.create({
      data: {
        orderId: order.id,
        provider: payment.provider,
        providerRef: payment.providerRef,
        method: payment.method,
        status: payment.status,
        rawPayload: payment.rawPayload as Prisma.InputJsonValue,
      },
    });

    return {
      orderCode: order.orderCode,
      redirectUrl: payment.redirectUrl,
    };
  } catch (error) {
    console.error("Gagal membuat transaksi pembayaran", error);

    return {
      orderCode: order.orderCode,
      redirectUrl: `/order/${order.orderCode}`,
    };
  }
}

export async function getOrderByCode(orderCode: string) {
  return prisma.order.findUnique({
    where: { orderCode },
    include: {
      class: true,
      accessCode: true,
      payments: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });
}
