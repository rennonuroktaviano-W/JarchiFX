import type { Job } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import {
  decryptAccessCode,
  formatAccessCode,
} from "@/lib/services/access-code-service";
import {
  grantDiscordRole,
  revokeDiscordRole,
} from "@/lib/services/discord-service";
import { sendAccessCodeEmail } from "@/lib/services/email-service";

type SendAccessCodePayload = {
  orderId: string;
};

type GrantDiscordRolePayload = {
  memberId: string;
};

type RevokeDiscordRolePayload = {
  discordUserId: string;
  roleId: string;
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

async function processGrantDiscordRole(payload: GrantDiscordRolePayload) {
  const member = await prisma.member.findUnique({
    where: { id: BigInt(payload.memberId) },
    include: { class: true },
  });

  if (!member || member.roleStatus === "granted") {
    return;
  }

  await grantDiscordRole(member.discordUserId, member.class.discordRoleId);

  await prisma.member.update({
    where: { id: member.id },
    data: { roleStatus: "granted", roleGrantedAt: new Date() },
  });
}

async function processRevokeDiscordRole(payload: RevokeDiscordRolePayload) {
  if (!payload.roleId) {
    return;
  }

  await revokeDiscordRole(payload.discordUserId, payload.roleId);
}

export async function processJob(job: Job) {
  switch (job.type) {
    case "send_access_code":
      return processSendAccessCode(job.payload as SendAccessCodePayload);
    case "grant_discord_role":
      return processGrantDiscordRole(job.payload as GrantDiscordRolePayload);
    case "revoke_discord_role":
      return processRevokeDiscordRole(
        job.payload as unknown as RevokeDiscordRolePayload,
      );
    default:
      throw new Error(`Tipe job tidak dikenal: ${job.type}`);
  }
}
