import { REST, Routes } from "discord.js";
import { config } from "./config.js";
import { data as redeemData } from "./commands/redeem.js";
import { data as statusData } from "./commands/status.js";

if (!config.token || !config.clientId || !config.guildId) {
  console.error(
    "DISCORD_BOT_TOKEN, DISCORD_CLIENT_ID, dan DISCORD_GUILD_ID wajib diisi.",
  );
  process.exit(1);
}

const rest = new REST({ version: "10" }).setToken(config.token);

try {
  await rest.put(
    Routes.applicationGuildCommands(config.clientId, config.guildId),
    { body: [redeemData.toJSON(), statusData.toJSON()] },
  );
  console.log("Slash command berhasil didaftarkan untuk guild.");
} catch (error) {
  console.error("Gagal mendaftarkan slash command", error);
  process.exit(1);
}
