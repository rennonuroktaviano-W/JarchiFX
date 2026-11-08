import "dotenv/config";
import { schedule } from "node-cron";
import { prisma } from "../src/lib/prisma";
import { processJob } from "../src/lib/jobs/processor";
import { revokeDiscordRole } from "../src/lib/services/discord-service";

const JOB_INTERVAL_MS = 5000;
const BACKOFF_MINUTES = [1, 5, 15];

async function runOneJob() {
  const job = await prisma.job.findFirst({
    where: { status: "pending", runAt: { lte: new Date() } },
    orderBy: { runAt: "asc" },
  });

  if (!job) {
    return false;
  }

  const claimed = await prisma.job.updateMany({
    where: { id: job.id, status: "pending" },
    data: { status: "processing", attempts: { increment: 1 } },
  });

  if (claimed.count === 0) {
    return true;
  }

  const attempts = job.attempts + 1;

  try {
    await processJob(job);
    await prisma.job.update({
      where: { id: job.id },
      data: { status: "done", lastError: null },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Kesalahan tidak diketahui";

    if (attempts >= job.maxAttempts) {
      await prisma.job.update({
        where: { id: job.id },
        data: { status: "failed", lastError: message },
      });
    } else {
      const delayMinutes =
        BACKOFF_MINUTES[Math.min(attempts - 1, BACKOFF_MINUTES.length - 1)];

      await prisma.job.update({
        where: { id: job.id },
        data: {
          status: "pending",
          lastError: message,
          runAt: new Date(Date.now() + delayMinutes * 60_000),
        },
      });
    }
  }

  return true;
}

async function drainJobs() {
  for (let index = 0; index < 5; index += 1) {
    const processed = await runOneJob();

    if (!processed) {
      return;
    }
  }
}

async function expireStaleRecords() {
  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  await prisma.order.updateMany({
    where: { status: "pending", createdAt: { lt: dayAgo } },
    data: { status: "expired" },
  });

  await prisma.accessCode.updateMany({
    where: { status: "active", expiresAt: { lt: new Date() } },
    data: { status: "expired" },
  });
}

async function expireMembers() {
  const members = await prisma.member.findMany({
    where: { status: "active", accessUntil: { lt: new Date() } },
    include: { class: true },
  });

  for (const member of members) {
    if (member.roleStatus === "granted" && member.class.discordRoleId) {
      try {
        await revokeDiscordRole(
          member.discordUserId,
          member.class.discordRoleId,
        );
      } catch (error) {
        console.error("Gagal mencabut role Discord", error);
      }
    }

    await prisma.member.update({
      where: { id: member.id },
      data: { status: "expired" },
    });
  }
}

async function main() {
  console.log("Worker JarchiFX berjalan.");

  setInterval(() => {
    drainJobs().catch((error) => console.error("Job gagal", error));
  }, JOB_INTERVAL_MS);

  schedule("*/10 * * * *", () => {
    expireStaleRecords().catch((error) =>
      console.error("Gagal membersihkan data kedaluwarsa", error),
    );
  });

  schedule("0 2 * * *", () => {
    expireMembers().catch((error) =>
      console.error("Gagal mencabut akses kedaluwarsa", error),
    );
  });

  const shutdown = async () => {
    await prisma.$disconnect();
    process.exit(0);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

main().catch(async (error) => {
  console.error(error);
  await prisma.$disconnect();
  process.exit(1);
});
