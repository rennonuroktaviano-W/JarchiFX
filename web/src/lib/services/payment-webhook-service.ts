import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { enqueueJob } from "@/lib/jobs/queue";
import { generateAccessCode } from "@/lib/services/access-code-service";
import {
  mapMidtransStatus,
  type MidtransNotification,
} from "@/lib/services/payment/gateway";

export type WebhookOutcome =
  | "paid"
  | "pending"
  | "failed"
  | "expired"
  | "already_paid"
  | "ignored"
  | "not_found"
  | "amount_mismatch";

const CODE_VALIDITY_DAYS = 30;

export async function processPaymentNotification(
  payload: MidtransNotification,
): Promise<{ outcome: WebhookOutcome }> {
  const orderCode = payload.order_id;
  const normalized = mapMidtransStatus(payload);

  const order = await prisma.order.findUnique({
    where: { orderCode },
    include: { accessCode: true },
  });

  if (!order) {
    return { outcome: "not_found" };
  }

  const grossAmount = Number.parseFloat(payload.gross_amount);

  if (!Number.isFinite(grossAmount) || grossAmount !== order.amount) {
    return { outcome: "amount_mismatch" };
  }

  let createdCode = false;
  let outcome: WebhookOutcome = "ignored";

  await prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT id FROM orders WHERE id = ${order.id} FOR UPDATE`;

    const lockedOrder = await tx.order.findUnique({
      where: { id: order.id },
      include: { accessCode: true },
    });

    if (!lockedOrder) {
      outcome = "not_found";
      return;
    }

    const payment = await tx.payment.findFirst({
      where: { orderId: lockedOrder.id },
      orderBy: { createdAt: "desc" },
    });

    const providerRef =
      payment?.providerRef ?? `midtrans:${lockedOrder.orderCode}`;

    await tx.payment.upsert({
      where: { providerRef },
      update: {
        status: normalized,
        method: payload.payment_type ?? payment?.method ?? "unknown",
        rawPayload: payload as unknown as Prisma.InputJsonValue,
      },
      create: {
        orderId: lockedOrder.id,
        provider: "midtrans",
        providerRef,
        method: payload.payment_type ?? "unknown",
        status: normalized,
        rawPayload: payload as unknown as Prisma.InputJsonValue,
      },
    });

    if (lockedOrder.status === "paid" && normalized !== "paid") {
      outcome = "already_paid";
      return;
    }

    if (normalized === "paid") {
      if (lockedOrder.status !== "paid") {
        await tx.order.update({
          where: { id: lockedOrder.id },
          data: {
            status: "paid",
            paidAt: lockedOrder.paidAt ?? new Date(),
          },
        });
      }

      if (!lockedOrder.accessCode) {
        for (let attempt = 0; attempt < 5; attempt += 1) {
          const generated = generateAccessCode();
          const existing = await tx.accessCode.findUnique({
            where: { codeHash: generated.hash },
          });

          if (existing) {
            continue;
          }

          await tx.accessCode.create({
            data: {
              orderId: lockedOrder.id,
              codeHash: generated.hash,
              codeEncrypted: generated.encrypted,
              status: "active",
              expiresAt: new Date(
                Date.now() + CODE_VALIDITY_DAYS * 24 * 60 * 60 * 1000,
              ),
            },
          });

          createdCode = true;
          break;
        }

        if (!createdCode) {
          throw new Error("Gagal membuat kode akses unik.");
        }
      }

      outcome = "paid";
      return;
    }

    if (lockedOrder.status === "pending") {
      if (normalized === "failed") {
        await tx.order.update({
          where: { id: lockedOrder.id },
          data: { status: "failed" },
        });
        outcome = "failed";
        return;
      }

      if (normalized === "expired") {
        await tx.order.update({
          where: { id: lockedOrder.id },
          data: { status: "expired" },
        });
        outcome = "expired";
        return;
      }

      outcome = "pending";
    }
  });

  if (createdCode) {
    await enqueueJob("send_access_code", {
      orderId: order.id.toString(),
    });
  }

  return { outcome };
}
