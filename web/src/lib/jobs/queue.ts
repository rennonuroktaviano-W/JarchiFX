import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

export async function enqueueJob(
  type: string,
  payload: Prisma.InputJsonValue,
  delayMs = 0,
) {
  return prisma.job.create({
    data: {
      type,
      payload,
      runAt: new Date(Date.now() + delayMs),
    },
  });
}
