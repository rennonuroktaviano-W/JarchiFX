import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import bcrypt from "bcryptjs";
import { verifyAdminCredentials } from "@/lib/auth/admin-session";
import { prisma } from "@/lib/prisma";
import {
  displayAccessCode,
  enqueueAccessCodeEmail,
  generateManualAccessCode,
  revokeAccessCode,
  revokeMember,
  updateCourseClass,
} from "@/lib/services/admin-service";
import { redeemCode } from "@/lib/services/redeem-service";
import { processPaymentNotification } from "@/lib/services/payment-webhook-service";
import { buildMockNotification } from "@/lib/services/payment/gateway";
import {
  createTestOrder,
  resetDatabase,
  seedClasses,
} from "./helpers";

const USER_A = "111111111111111111";

function mockDiscordSuccess() {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue(new Response(null, { status: 204 })),
  );
}

async function createPaidOrder(slug = "kelas-dasar") {
  const order = await createTestOrder(slug);
  const result = await processPaymentNotification(
    buildMockNotification({ orderCode: order.orderCode, amount: order.amount }),
  );

  expect(result.outcome).toBe("paid");

  return prisma.order.findUniqueOrThrow({
    where: { id: order.id },
    include: { class: true, accessCode: true },
  });
}

beforeEach(async () => {
  await resetDatabase();
  await seedClasses();
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe("admin auth", () => {
  it("memverifikasi kredensial admin", async () => {
    const passwordHash = await bcrypt.hash("rahasia123", 4);

    await prisma.admin.create({
      data: {
        name: "Admin Tes",
        email: "admin@example.com",
        passwordHash,
      },
    });

    const admin = await verifyAdminCredentials(
      "ADMIN@example.com",
      "rahasia123",
    );

    expect(admin?.email).toBe("admin@example.com");
    expect(await verifyAdminCredentials("admin@example.com", "salah")).toBeNull();
    expect(await verifyAdminCredentials("lain@example.com", "rahasia123")).toBeNull();
  });
});

describe("admin service", () => {
  it("membuat order manual lunas beserta kode aktif", async () => {
    const courseClass = await prisma.courseClass.findUniqueOrThrow({
      where: { slug: "kelas-dasar" },
    });

    const result = await generateManualAccessCode({
      classId: courseClass.id,
      buyerName: "Penerima Beasiswa",
      buyerEmail: "Penerima@Example.com",
    });

    const order = await prisma.order.findUniqueOrThrow({
      where: { id: result.orderId },
      include: { accessCode: true },
    });

    expect(order.status).toBe("paid");
    expect(order.amount).toBe(0);
    expect(order.buyerEmail).toBe("penerima@example.com");
    expect(order.accessCode?.status).toBe("active");
    expect(displayAccessCode(order.accessCode!.codeEncrypted)).toMatch(
      /^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/,
    );
  });

  it("mencabut kode aktif tanpa member", async () => {
    const order = await createPaidOrder();

    const result = await revokeAccessCode(order.accessCode!.id);

    expect(result?.changed).toBe(true);

    const stored = await prisma.accessCode.findUniqueOrThrow({
      where: { id: order.accessCode!.id },
    });

    expect(stored.status).toBe("revoked");
    expect(
      await prisma.job.count({ where: { type: "revoke_discord_role" } }),
    ).toBe(0);
  });

  it("mencabut kode redeemed, member, dan mengantre cabut role", async () => {
    mockDiscordSuccess();
    const order = await createPaidOrder();
    const code = displayAccessCode(order.accessCode!.codeEncrypted);

    const redeemed = await redeemCode({
      code,
      discordUserId: USER_A,
    });

    expect(redeemed.status).toBe("ok");

    const result = await revokeAccessCode(order.accessCode!.id);

    expect(result?.changed).toBe(true);

    const stored = await prisma.accessCode.findUniqueOrThrow({
      where: { id: order.accessCode!.id },
      include: { member: true },
    });

    expect(stored.status).toBe("revoked");
    expect(stored.member?.status).toBe("revoked");

    const jobs = await prisma.job.findMany({
      where: { type: "revoke_discord_role" },
    });

    expect(jobs).toHaveLength(1);
    expect(jobs[0].payload).toMatchObject({
      discordUserId: USER_A,
      roleId: "role-dasar",
    });
  });

  it("mencabut member beserta kode aksesnya", async () => {
    mockDiscordSuccess();
    const order = await createPaidOrder();
    const code = displayAccessCode(order.accessCode!.codeEncrypted);

    await redeemCode({ code, discordUserId: USER_A });

    const member = await prisma.member.findFirstOrThrow();
    const removed = await revokeMember(member.id);

    expect(removed?.id).toBe(member.id);

    const [storedMember, storedCode] = await Promise.all([
      prisma.member.findUniqueOrThrow({ where: { id: member.id } }),
      prisma.accessCode.findUniqueOrThrow({
        where: { id: member.accessCodeId },
      }),
    ]);

    expect(storedMember.status).toBe("revoked");
    expect(storedCode.status).toBe("revoked");
    expect(
      await prisma.job.count({ where: { type: "revoke_discord_role" } }),
    ).toBe(1);
  });

  it("memperbarui paket kelas", async () => {
    const courseClass = await prisma.courseClass.findUniqueOrThrow({
      where: { slug: "kelas-dasar" },
    });

    const updated = await updateCourseClass(courseClass.id, {
      name: "Kelas Dasar Baru",
      price: 549000,
      accessDays: 120,
      discordRoleId: "role-baru",
      isActive: false,
    });

    expect(updated.name).toBe("Kelas Dasar Baru");
    expect(updated.price).toBe(549000);
    expect(updated.accessDays).toBe(120);
    expect(updated.discordRoleId).toBe("role-baru");
    expect(updated.isActive).toBe(false);
  });

  it("hanya mengantre email untuk order lunas dengan kode", async () => {
    const pending = await createTestOrder();

    expect(await enqueueAccessCodeEmail(pending.id)).toBe(false);

    const paid = await createPaidOrder();

    expect(await enqueueAccessCodeEmail(paid.id)).toBe(true);

    const jobs = await prisma.job.findMany({
      where: { type: "send_access_code" },
    });

    expect(jobs).toHaveLength(2);
    expect(jobs.some((job) => job.payload)).toBe(true);
  });
});
