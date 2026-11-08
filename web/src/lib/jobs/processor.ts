import type { Job } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import {
  decryptAccessCode,
  formatAccessCode,
} from "@/lib/services/access-code-service";
import { sendAccessCodeEmail } from "@/lib/services/email-service";

type SendAccessCodePayload = {
  orderId: string;
};

async function processSendAccessCode(payload: SendAccessCodePayload) {
  const order = await prisma.order.findUnique({
    where: { id: BigInt(payload.orderId) },
    include: { class: true, accessCode: true },
  });

  if (!order || !order.accessCode) {
    throw new Error("Order atau kode akses tidak ditemukan.");
  }

  const code = formatAccessCode(
    decryptAccessCode(order.accessCode.codeEncrypted),
  );

  await sendAccessCodeEmail({
    to: order.buyerEmail,
    buyerName: order.buyerName,
    className: order.class.name,
    code,
    orderCode: order.orderCode,
  });
}

export async function processJob(job: Job) {
  switch (job.type) {
    case "send_access_code":
      return processSendAccessCode(job.payload as SendAccessCodePayload);
    default:
      throw new Error(`Tipe job tidak dikenal: ${job.type}`);
  }
}
