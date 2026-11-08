import { beforeEach, describe, expect, it } from "vitest";
import { POST as paymentWebhook } from "@/app/api/webhooks/payment/route";
import { prisma } from "@/lib/prisma";
import { createOrder } from "@/lib/services/order-service";
import {
  buildMockNotification,
  type MidtransNotification,
} from "@/lib/services/payment/gateway";
import { processPaymentNotification } from "@/lib/services/payment-webhook-service";
import {
  createTestOrder,
  resetDatabase,
  seedClasses,
} from "./helpers";

function jsonRequest(payload: MidtransNotification) {
  return new Request("http://localhost/api/webhooks/payment", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
}

beforeEach(async () => {
  await resetDatabase();
  await seedClasses();
});

describe("checkout", () => {
  it("menghitung harga dari server, bukan dari input", async () => {
    const result = await createOrder({
      name: "Pembeli Tes",
      email: "pembeli@example.com",
      whatsapp: "08123456789",
      classSlug: "kelas-dasar",
    });

    const order = await prisma.order.findUniqueOrThrow({
      where: { orderCode: result.orderCode },
    });

    expect(order.amount).toBe(499000);
    expect(order.status).toBe("pending");
  });
});

describe("payment webhook", () => {
  it("menolak signature yang salah tanpa mengubah order", async () => {
    const order = await createTestOrder();
    const notification = buildMockNotification({
      orderCode: order.orderCode,
      amount: order.amount,
    });

    const response = await paymentWebhook(
      jsonRequest({ ...notification, signature_key: "invalid" }),
    );

    expect(response.status).toBe(401);

    const stored = await prisma.order.findUniqueOrThrow({
      where: { id: order.id },
      include: { accessCode: true },
    });

    expect(stored.status).toBe("pending");
    expect(stored.accessCode).toBeNull();
  });

  it("membuat tepat satu kode dan idempotent saat webhook diulang", async () => {
    const order = await createTestOrder();
    const notification = buildMockNotification({
      orderCode: order.orderCode,
      amount: order.amount,
    });

    const first = await processPaymentNotification(notification);
    const second = await processPaymentNotification(notification);

    expect(first.outcome).toBe("paid");
    expect(["paid", "already_paid"]).toContain(second.outcome);

    const stored = await prisma.order.findUniqueOrThrow({
      where: { id: order.id },
      include: { accessCode: true },
    });

    expect(stored.status).toBe("paid");
    expect(stored.accessCode).not.toBeNull();
    expect(await prisma.accessCode.count()).toBe(1);
    expect(
      await prisma.job.count({ where: { type: "send_access_code" } }),
    ).toBe(1);
  });

  it("tidak memproses order jika gross_amount tidak cocok", async () => {
    const order = await createTestOrder();
    const notification = buildMockNotification({
      orderCode: order.orderCode,
      amount: order.amount + 1000,
    });

    const result = await processPaymentNotification(notification);

    expect(result.outcome).toBe("amount_mismatch");

    const stored = await prisma.order.findUniqueOrThrow({
      where: { id: order.id },
      include: { accessCode: true },
    });

    expect(stored.status).toBe("pending");
    expect(stored.accessCode).toBeNull();
  });

  it("memproses pembayaran sukses setelah order kedaluwarsa", async () => {
    const order = await createTestOrder();
    await prisma.order.update({
      where: { id: order.id },
      data: { status: "expired" },
    });

    const notification = buildMockNotification({
      orderCode: order.orderCode,
      amount: order.amount,
    });

    const result = await processPaymentNotification(notification);

    expect(result.outcome).toBe("paid");

    const stored = await prisma.order.findUniqueOrThrow({
      where: { id: order.id },
      include: { accessCode: true },
    });

    expect(stored.status).toBe("paid");
    expect(stored.accessCode).not.toBeNull();
  });

  it("tidak menurunkan status paid menjadi pending", async () => {
    const order = await createTestOrder();
    const paidNotification = buildMockNotification({
      orderCode: order.orderCode,
      amount: order.amount,
    });

    await processPaymentNotification(paidNotification);

    const pendingNotification: MidtransNotification = {
      ...paidNotification,
      transaction_status: "pending",
      signature_key: paidNotification.signature_key,
    };

    const result = await processPaymentNotification(pendingNotification);
    const stored = await prisma.order.findUniqueOrThrow({
      where: { id: order.id },
    });

    expect(result.outcome).toBe("already_paid");
    expect(stored.status).toBe("paid");
  });
});
