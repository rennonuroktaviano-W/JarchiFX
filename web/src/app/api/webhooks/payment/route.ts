import { NextResponse } from "next/server";
import {
  verifyMidtransSignature,
  type MidtransNotification,
} from "@/lib/services/payment/gateway";
import { processPaymentNotification } from "@/lib/services/payment-webhook-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let payload: Partial<MidtransNotification>;

  try {
    payload = (await request.json()) as Partial<MidtransNotification>;
  } catch {
    return NextResponse.json({ status: "invalid" }, { status: 400 });
  }

  if (
    !payload.order_id ||
    !payload.status_code ||
    !payload.gross_amount ||
    !payload.signature_key ||
    !payload.transaction_status
  ) {
    return NextResponse.json({ status: "invalid" }, { status: 400 });
  }

  const notification = payload as MidtransNotification;

  if (!verifyMidtransSignature(notification)) {
    return NextResponse.json({ status: "invalid_signature" }, { status: 401 });
  }

  const result = await processPaymentNotification(notification);

  return NextResponse.json({ status: result.outcome });
}
