import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";
import {
  buildMockNotification,
  verifyMidtransSignature,
} from "@/lib/services/payment/gateway";
import { processPaymentNotification } from "@/lib/services/payment-webhook-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!env.paymentMock || process.env.NODE_ENV === "production") {
    return NextResponse.json({ status: "not_found" }, { status: 404 });
  }

  const formData = await request.formData();
  const orderCode = String(formData.get("orderCode") ?? "");

  const order = await prisma.order.findUnique({
    where: { orderCode },
    select: { orderCode: true, amount: true },
  });

  if (!order) {
    return NextResponse.redirect(new URL("/", request.url), 303);
  }

  const notification = buildMockNotification({
    orderCode: order.orderCode,
    amount: order.amount,
  });

  if (!verifyMidtransSignature(notification)) {
    return NextResponse.json(
      { status: "invalid_signature" },
      { status: 500 },
    );
  }

  await processPaymentNotification(notification);

  return NextResponse.redirect(
    new URL(`/order/${order.orderCode}`, request.url),
    303,
  );
}
