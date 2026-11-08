import "server-only";
import { randomBytes } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { enqueueJob } from "@/lib/jobs/queue";
import {
  decryptAccessCode,
  formatAccessCode,
  generateAccessCode,
} from "@/lib/services/access-code-service";

export type ManualCodeInput = {
  classId: number;
  buyerName: string;
  buyerEmail: string;
};

export function displayAccessCode(encrypted: string) {
  try {
    return formatAccessCode(decryptAccessCode(encrypted));
  } catch {
    return "Tidak dapat dibaca";
  }
}

export type CourseClassUpdate = {
  name: string;
  price: number;
  accessDays: number | null;
  discordRoleId: string;
  isActive: boolean;
};

function manualOrderCode() {
  return randomBytes(15).toString("base64url");
}

export async function generateManualAccessCode(input: ManualCodeInput) {
  return prisma.$transaction(async (tx) => {
    const courseClass = await tx.courseClass.findUnique({
      where: { id: input.classId },
    });

    if (!courseClass) {
      throw new Error("Kelas tidak ditemukan.");
    }

    let orderCode = manualOrderCode();

    for (let attempt = 0; attempt < 5; attempt += 1) {
      const existing = await tx.order.findUnique({ where: { orderCode } });

      if (!existing) {
        break;
      }

      orderCode = manualOrderCode();
    }

    const order = await tx.order.create({
      data: {
        orderCode,
        classId: courseClass.id,
        buyerName: input.buyerName.trim() || "Kode Manual",
        buyerEmail:
          input.buyerEmail.trim().toLowerCase() || "manual@jarchifx.local",
        buyerWhatsapp: "-",
        amount: 0,
        status: "paid",
        paidAt: new Date(),
      },
    });

    let generated = generateAccessCode();
    let createdCode:
      | {
          id: bigint;
        }
      | null = null;

    for (let attempt = 0; attempt < 5; attempt += 1) {
      const existing = await tx.accessCode.findUnique({
        where: { codeHash: generated.hash },
      });

      if (!existing) {
        createdCode = await tx.accessCode.create({
          data: {
            orderId: order.id,
            codeHash: generated.hash,
            codeEncrypted: generated.encrypted,
            status: "active",
          },
        });
        break;
      }

      generated = generateAccessCode();
    }

    if (!createdCode) {
      throw new Error("Gagal membuat kode akses unik.");
    }

    return {
      orderId: order.id,
      accessCodeId: createdCode.id,
    };
  });
}

export async function revokeAccessCode(accessCodeId: bigint) {
  const result = await prisma.$transaction(async (tx) => {
    const locked = await tx.$queryRaw<{ id: bigint }[]>`
      SELECT id FROM access_codes WHERE id = ${accessCodeId} FOR UPDATE
    `;

    if (locked.length === 0) {
      return null;
    }

    const accessCode = await tx.accessCode.findUnique({
      where: { id: accessCodeId },
      include: {
        member: true,
        order: { include: { class: true } },
      },
    });

    if (!accessCode) {
      return null;
    }

    const changed = accessCode.status !== "revoked";

    if (changed) {
      await tx.accessCode.update({
        where: { id: accessCode.id },
        data: { status: "revoked" },
      });
    }

    if (accessCode.member) {
      await tx.member.update({
        where: { id: accessCode.member.id },
        data: { status: "revoked" },
      });
    }

    return {
      changed,
      discordUserId: accessCode.member?.discordUserId ?? null,
      roleId: accessCode.order.class.discordRoleId,
    };
  });

  if (result?.changed && result.discordUserId && result.roleId) {
    await enqueueJob("revoke_discord_role", {
      discordUserId: result.discordUserId,
      roleId: result.roleId,
    });
  }

  return result;
}

export async function revokeMember(memberId: bigint) {
  const member = await prisma.member.findUnique({
    where: { id: memberId },
    include: { class: true },
  });

  if (!member) {
    return null;
  }

  await prisma.$transaction([
    prisma.member.update({
      where: { id: member.id },
      data: { status: "revoked" },
    }),
    prisma.accessCode.update({
      where: { id: member.accessCodeId },
      data: { status: "revoked" },
    }),
  ]);

  if (member.class.discordRoleId) {
    await enqueueJob("revoke_discord_role", {
      discordUserId: member.discordUserId,
      roleId: member.class.discordRoleId,
    });
  }

  return member;
}

export async function updateCourseClass(
  classId: number,
  input: CourseClassUpdate,
) {
  return prisma.courseClass.update({
    where: { id: classId },
    data: {
      name: input.name,
      price: input.price,
      accessDays: input.accessDays,
      discordRoleId: input.discordRoleId,
      isActive: input.isActive,
    },
  });
}

export async function enqueueAccessCodeEmail(orderId: bigint) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { accessCode: true },
  });

  if (!order || order.status !== "paid" || !order.accessCode) {
    return false;
  }

  await enqueueJob("send_access_code", { orderId: order.id.toString() });

  return true;
}
