import { prisma } from "@/lib/prisma";
import { enqueueJob } from "@/lib/jobs/queue";
import {
  hashAccessCode,
  normalizeAccessCode,
} from "@/lib/services/access-code-service";
import { grantDiscordRole } from "@/lib/services/discord-service";

export type RedeemFailure =
  | "invalid"
  | "used"
  | "expired"
  | "revoked"
  | "rate_limited";

export type RedeemResult =
  | {
      status: "ok";
      className: string;
      accessUntil: string | null;
      roleStatus: "granted" | "pending";
    }
  | { status: RedeemFailure };

type RedeemTransactionResult =
  | { kind: "failure"; failure: RedeemFailure }
  | {
      kind: "ok";
      memberId: bigint;
      className: string;
      accessUntil: Date | null;
      roleId: string;
    };

const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;

function computeAccessUntil(
  accessDays: number | null,
  current: Date | null | undefined,
) {
  if (accessDays === null) {
    return null;
  }

  const now = new Date();
  const base = current && current.getTime() > now.getTime() ? current : now;

  return new Date(base.getTime() + accessDays * 24 * 60 * 60 * 1000);
}

export async function redeemCode(input: {
  code: string;
  discordUserId: string;
}): Promise<RedeemResult> {
  const normalized = normalizeAccessCode(input.code);
  const codeHash = hashAccessCode(normalized);

  const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW_MS);
  const failedAttempts = await prisma.redeemAttempt.count({
    where: {
      discordUserId: input.discordUserId,
      createdAt: { gte: windowStart },
      result: { in: ["invalid", "used", "expired", "revoked"] },
    },
  });

  if (failedAttempts >= RATE_LIMIT_MAX) {
    await prisma.redeemAttempt.create({ data: { discordUserId: input.discordUserId, codeHashTried: codeHash, result: "rate_limited" } });
    return { status: "rate_limited" };
  }

  const transactionResult = await prisma.$transaction(
    async (tx): Promise<RedeemTransactionResult> => {
      const lockedRows = await tx.$queryRaw<{ id: bigint }[]>`
        SELECT id FROM access_codes WHERE code_hash = ${codeHash} FOR UPDATE
      `;

      if (lockedRows.length === 0) {
        await tx.redeemAttempt.create({ data: { discordUserId: input.discordUserId, codeHashTried: codeHash, result: "invalid" } });
        return { kind: "failure", failure: "invalid" };
      }

      const accessCode = await tx.accessCode.findUnique({
        where: { codeHash },
        include: { order: { include: { class: true } } },
      });

      if (!accessCode) {
        await tx.redeemAttempt.create({ data: { discordUserId: input.discordUserId, codeHashTried: codeHash, result: "invalid" } });
        return { kind: "failure", failure: "invalid" };
      }

      let failure: RedeemFailure | null = null;

      if (accessCode.status === "redeemed") {
        failure = "used";
      } else if (
        accessCode.status === "expired" ||
        (accessCode.expiresAt && accessCode.expiresAt.getTime() < Date.now())
      ) {
        failure = "expired";
      } else if (accessCode.status === "revoked") {
        failure = "revoked";
      } else if (accessCode.order.status !== "paid") {
        failure = "invalid";
      }

      if (failure) {
        if (failure === "expired" && accessCode.status === "active") {
          await tx.accessCode.update({
            where: { id: accessCode.id },
            data: { status: "expired" },
          });
        }

        await tx.redeemAttempt.create({ data: { discordUserId: input.discordUserId, codeHashTried: codeHash, result: failure } });
        return { kind: "failure", failure };
      }

      const existingMember = await tx.member.findUnique({
        where: {
          discordUserId_classId: {
            discordUserId: input.discordUserId,
            classId: accessCode.order.classId,
          },
        },
      });

      const nextAccessUntil = computeAccessUntil(
        accessCode.order.class.accessDays,
        existingMember?.accessUntil,
      );

      const member = existingMember
        ? await tx.member.update({
            where: { id: existingMember.id },
            data: {
              accessCodeId: accessCode.id,
              accessUntil: nextAccessUntil,
              status: "active",
              roleStatus: "pending",
              roleGrantedAt: null,
            },
          })
        : await tx.member.create({
            data: {
              discordUserId: input.discordUserId,
              classId: accessCode.order.classId,
              accessCodeId: accessCode.id,
              accessUntil: nextAccessUntil,
              status: "active",
              roleStatus: "pending",
            },
          });

      await tx.accessCode.update({
        where: { id: accessCode.id },
        data: {
          status: "redeemed",
          redeemedAt: new Date(),
          redeemedByDiscordId: input.discordUserId,
        },
      });

      await tx.redeemAttempt.create({ data: { discordUserId: input.discordUserId, codeHashTried: codeHash, result: "success" } });

      return {
        kind: "ok",
        memberId: member.id,
        className: accessCode.order.class.name,
        accessUntil: member.accessUntil,
        roleId: accessCode.order.class.discordRoleId,
      };
    },
  );

  if (transactionResult.kind === "failure") {
    return { status: transactionResult.failure };
  }

  const { memberId, className, accessUntil, roleId } = transactionResult;
  let roleStatus: "granted" | "pending" = "pending";

  if (roleId) {
    try {
      await grantDiscordRole(input.discordUserId, roleId);
      roleStatus = "granted";

      await prisma.member.update({
        where: { id: memberId },
        data: { roleStatus: "granted", roleGrantedAt: new Date() },
      });
    } catch (error) {
      console.error("Gagal memberi role Discord", error);

      await prisma.member.update({
        where: { id: memberId },
        data: { roleStatus: "pending" },
      });

      await enqueueJob("grant_discord_role", {
        memberId: memberId.toString(),
      });
    }
  }

  return {
    status: "ok",
    className,
    accessUntil: accessUntil ? accessUntil.toISOString() : null,
    roleStatus,
  };
}

export async function getMemberships(discordUserId: string) {
  return prisma.member.findMany({
    where: { discordUserId },
    include: { class: true },
    orderBy: { createdAt: "desc" },
  });
}
