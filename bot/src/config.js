import "dotenv/config";

export const config = {
  token: process.env.DISCORD_BOT_TOKEN ?? "",
  clientId: process.env.DISCORD_CLIENT_ID ?? "",
  guildId: process.env.DISCORD_GUILD_ID ?? "",
  apiUrl: process.env.INTERNAL_API_URL ?? "http://localhost:3000",
  apiToken: process.env.INTERNAL_API_TOKEN ?? "",
};
