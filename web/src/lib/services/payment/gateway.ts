import { createHash, timingSafeEqual } from "node:crypto";
import { env, getMidtransServerKey } from "@/lib/env";

export type PaymentOrder = {
  orderCode: string;
  amount: number;
  buyerName: string;
  buyerEmail: string;
};

export type PaymentInit = {
  provider: "mock" | "midtrans";
  providerRef: string;
  method: string;
  status: string;
  redirectUrl: string;
  rawPayload: unknown;
};

export type MidtransNotification = {
  order_id: string;
  status_code: string;
  gross_amount: string;
  signature_key: string;
  transaction_status: string;
  fraud_status?: string;
  transaction_id?: string;
  payment_type?: string;
};

export type NormalizedPaymentStatus =
  | "paid"
  | "pending"
  | "failed"
  | "expired"
  | "ignored";

export async function createPayment(
  order: PaymentOrder,
): Promise<PaymentInit> {
  if (env.paymentMock) {
    return {
      provider: "mock",
      providerRef: `mock:${order.orderCode}`,
      method: "mock",
      status: "pending",
      redirectUrl: `${env.appUrl}/order/${order.orderCode}?mock=1`,
      rawPayload: { mock: true, orderCode: order.orderCode },
    };
  }

  const serverKey = getMidtransServerKey();

  if (!serverKey) {
    throw new Error("MIDTRANS_SERVER_KEY belum diisi.");
  }

  const baseUrl = env.midtrans.production
    ? "https://app.midtrans.com/snap/v1/transactions"
    : "https://app.sandbox.midtrans.com/snap/v1/transactions";

  const response = await fetch(baseUrl, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Basic ${Buffer.from(`${serverKey}:`).toString("base64")}`,
    },
    body: JSON.stringify({
      transaction_details: {
        order_id: order.orderCode,
        gross_amount: order.amount,
      },
      customer_details: {
        first_name: order.buyerName,
        email: order.buyerEmail,
      },
      callbacks: {
        finish: `${env.appUrl}/order/${order.orderCode}`,
      },
      expiry: {
        unit: "hours",
        duration: 24,
      },
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Midtrans menolak transaksi: ${errorBody}`);
  }

  const data = (await response.json()) as {
    token?: string;
    redirect_url?: string;
  };

  if (!data.redirect_url) {
    throw new Error("Midtrans tidak mengembalikan redirect_url.");
  }

  return {
    provider: "midtrans",
    providerRef: `midtrans:${order.orderCode}`,
    method: "snap",
    status: "pending",
    redirectUrl: data.redirect_url,
    rawPayload: data,
  };
}

export function verifyMidtransSignature(payload: MidtransNotification) {
  const serverKey = getMidtransServerKey();

  if (!serverKey || !payload.signature_key) {
    return false;
  }

  const expected = createHash("sha512")
    .update(
      `${payload.order_id}${payload.status_code}${payload.gross_amount}${serverKey}`,
    )
    .digest("hex");

  const expectedBuffer = Buffer.from(expected, "utf8");
  const providedBuffer = Buffer.from(payload.signature_key, "utf8");

  if (expectedBuffer.length !== providedBuffer.length) {
    return false;
  }

  return timingSafeEqual(expectedBuffer, providedBuffer);
}

export function mapMidtransStatus(
  payload: MidtransNotification,
): NormalizedPaymentStatus {
  if (payload.transaction_status === "settlement") {
    return "paid";
  }

  if (payload.transaction_status === "capture") {
    if (payload.fraud_status === "accept") {
      return "paid";
    }

    if (payload.fraud_status === "deny") {
      return "failed";
    }

    return "pending";
  }

  if (payload.transaction_status === "pending") {
    return "pending";
  }

  if (
    payload.transaction_status === "deny" ||
    payload.transaction_status === "cancel" ||
    payload.transaction_status === "failure"
  ) {
    return "failed";
  }

  if (payload.transaction_status === "expire") {
    return "expired";
  }

  return "ignored";
}

export function buildMockNotification(params: {
  orderCode: string;
  amount: number;
}): MidtransNotification {
  const serverKey = getMidtransServerKey();
  const statusCode = "200";
  const grossAmount = `${params.amount}.00`;
  const signatureKey = createHash("sha512")
    .update(
      `${params.orderCode}${statusCode}${grossAmount}${serverKey}`,
    )
    .digest("hex");

  return {
    order_id: params.orderCode,
    status_code: statusCode,
    gross_amount: grossAmount,
    signature_key: signatureKey,
    transaction_status: "settlement",
    transaction_id: `mock-${params.orderCode}`,
    payment_type: "qris",
  };
}
