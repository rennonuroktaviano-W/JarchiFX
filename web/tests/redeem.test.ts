import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST as redeemRoute } from "@/app/api/internal/redeem/route";
import { prisma } from "@/lib/prisma";
import { processJob } from "@/lib/jobs/processor";
import { decryptAccessCode } from "@/lib/services/access-code-service";
import { redeemCode } from "@/lib/services/redeem-service";
import { processPaymentNotification } from "@/lib/services/payment-webhook-service";
import { buildMockNotification } from "@/lib/services/payment/gateway";
import {
  createTestOrder,
  resetDatabase,
  seedClasses,
} from "./helpers";

const USER_A = "111111111111111111";
const USER_B = "222222222222222222";

function mockDiscordSuccess() {
  const fetchMock = vi
    .fn()
    .mockResolvedValue(new Response(null, { status: 204 }));

  vi.stubGlobal("fetch", fetchMock);

  return fetchMock;
}

function mockDiscordFailure() {
  const fetchMock = vi
    .fn()
    .mockResolvedValue(new Response("boom", { status: 500 }));

  vi.stubGlobal("fetch", fetchMock);

  return fetchMock;
}

async function createPaidOrder(slug = "kelas-dasar") {
  const order = await createTestOrder(slug);
  const result = await processPaymentNotification(
    buildMockNotification({ orderCode: order.orderCode, amount: order.amount }),
  );

  expect(result.outcome).toBe("paid");

  const accessCode = await prisma.accessCode.findUniqueOrThrow({
    where: { orderId: order.id },
  });

  return {
    order,
    accessCode,
    code: decryptAccessCode(accessCode.codeEncrypted),
  };
}

beforeEach(async () => {
  await resetDatabase();
  await seedClasses();
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe("redeem", () => {
  it("memberi role Discord dan menandai kode terpakai", async () => {
    const fetchMock = mockDiscordSuccess();
    const { code, order } = await createPaidOrder();

    const result = await redeemCode({ code, discordUserId: USER_A });

    expect(result).toMatchObject({
      status: "ok",
      className: "Kelas Dasar",
      roleStatus: "granted",
    });

    const member = await prisma.member.findUniqueOrThrow({
      where: {
        discordUserId_classId: {
          discordUserId: USER_A,
          classId: order.classId,
        },
      },
    });

    expect(member.status).toBe("active");
    expect(member.roleStatus).toBe("granted");
    expect(member.accessUntil).not.toBeNull();

    const storedCode = await prisma.accessCode.findUniqueOrThrow({
      where: { orderId: order.id },
    });

    expect(storedCode.status).toBe("redeemed");
    expect(storedCode.redeemedByDiscordId).toBe(USER_A);
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining(
        `/members/${USER_A}/roles/role-dasar`,
      ),
      expect.objectContaining({ method: "PUT" }),
    );
    expect(
      await prisma.job.count({ where: { type: "grant_discord_role" } }),
    ).toBe(0);
  });

  it("menolak kode yang sudah dipakai", async () => {
    mockDiscordSuccess();
    const { code } = await createPaidOrder();

    const first = await redeemCode({ code, discordUserId: USER_A });
    const second = await redeemCode({ code, discordUserId: USER_B });

    expect(first.status).toBe("ok");
    expect(second.status).toBe("used");
    expect(await prisma.member.count()).toBe(1);
  });

  it("menolak kode kedaluwarsa dan menandainya expired", async () => {
    mockDiscordSuccess();
    const { code, accessCode } = await createPaidOrder();

    await prisma.accessCode.update({
      where: { id: accessCode.id },
      data: { expiresAt: new Date(Date.now() - 1000) },
    });

    const result = await redeemCode({ code, discordUserId: USER_A });

    expect(result.status).toBe("expired");

    const stored = await prisma.accessCode.findUniqueOrThrow({
      where: { id: accessCode.id },
    });

    expect(stored.status).toBe("expired");
    expect(await prisma.member.count()).toBe(0);
  });

  it("menolak kode yang dicabut", async () => {
    mockDiscordSuccess();
    const { code, accessCode } = await createPaidOrder();

    await prisma.accessCode.update({
      where: { id: accessCode.id },
      data: { status: "revoked" },
    });

    const result = await redeemCode({ code, discordUserId: USER_A });

    expect(result.status).toBe("revoked");
    expect(await prisma.member.count()).toBe(0);
  });

  it("membatasi lima percobaan gagal per jam", async () => {
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const result = await redeemCode({
        code: "KODE-SALAH-0000",
        discordUserId: USER_A,
      });

      expect(result.status).toBe("invalid");
    }

    const blocked = await redeemCode({
      code: "KODE-SALAH-0000",
      discordUserId: USER_A,
    });

    expect(blocked.status).toBe("rate_limited");
    expect(
      await prisma.redeemAttempt.count({ where: { discordUserId: USER_A } }),
    ).toBe(6);
  });

  it("hanya satu redeem paralel yang berhasil", async () => {
    mockDiscordSuccess();
    const { code } = await createPaidOrder();

    const [first, second] = await Promise.all([
      redeemCode({ code, discordUserId: USER_A }),
      redeemCode({ code, discordUserId: USER_B }),
    ]);

    const statuses = [first.status, second.status].sort();

    expect(statuses).toEqual(["ok", "used"]);
    expect(await prisma.member.count()).toBe(1);
  });

  it("menyimpan job retry saat Discord gagal", async () => {
    mockDiscordFailure();
    const { code, order } = await createPaidOrder();

    const result = await redeemCode({ code, discordUserId: USER_A });

    expect(result).toMatchObject({ status: "ok", roleStatus: "pending" });

    const member = await prisma.member.findUniqueOrThrow({
      where: {
        discordUserId_classId: {
          discordUserId: USER_A,
          classId: order.classId,
        },
      },
    });

    expect(member.roleStatus).toBe("pending");

    const storedCode = await prisma.accessCode.findUniqueOrThrow({
      where: { orderId: order.id },
    });

    expect(storedCode.status).toBe("redeemed");

    const jobs = await prisma.job.findMany({
      where: { type: "grant_discord_role" },
    });

    expect(jobs).toHaveLength(1);
    expect(jobs[0].payload).toMatchObject({ memberId: member.id.toString() });
  });

  it("job grant_discord_role memberi role saat retry", async () => {
    mockDiscordFailure();
    const { code } = await createPaidOrder();

    await redeemCode({ code, discordUserId: USER_A });

    const job = await prisma.job.findFirstOrThrow({
      where: { type: "grant_discord_role" },
    });

    mockDiscordSuccess();
    await processJob(job);

    const member = await prisma.member.findFirstOrThrow();

    expect(member.roleStatus).toBe("granted");
    expect(member.roleGrantedAt).not.toBeNull();
  });

  it("menolak request internal tanpa token yang benar", async () => {
    const request = new Request("http://localhost/api/internal/redeem", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: "Bearer token-salah",
      },
      body: JSON.stringify({
        code: "ABCD-EFGH-IJKL",
        discord_user_id: USER_A,
      }),
    });

    const response = await redeemRoute(request);

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ status: "unauthorized" });
  });
});
