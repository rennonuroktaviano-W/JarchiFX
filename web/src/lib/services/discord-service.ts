import { env } from "@/lib/env";

const DISCORD_API = "https://discord.com/api/v10";

async function discordRequest(path: string, method: "PUT" | "DELETE") {
  if (!env.discord.botToken || !env.discord.guildId) {
    throw new Error("Konfigurasi Discord belum lengkap.");
  }

  const response = await fetch(`${DISCORD_API}${path}`, {
    method,
    headers: {
      Authorization: `Bot ${env.discord.botToken}`,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Discord menolak permintaan (${response.status}): ${body}`);
  }
}

export async function grantDiscordRole(
  discordUserId: string,
  roleId: string,
) {
  if (!roleId) {
    throw new Error("Role Discord untuk paket belum diatur.");
  }

  await discordRequest(
    `/guilds/${encodeURIComponent(env.discord.guildId)}/members/${encodeURIComponent(discordUserId)}/roles/${encodeURIComponent(roleId)}`,
    "PUT",
  );
}

export async function revokeDiscordRole(
  discordUserId: string,
  roleId: string,
) {
  if (!roleId) {
    return;
  }

  await discordRequest(
    `/guilds/${encodeURIComponent(env.discord.guildId)}/members/${encodeURIComponent(discordUserId)}/roles/${encodeURIComponent(roleId)}`,
    "DELETE",
  );
}
