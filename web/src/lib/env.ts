export const env = {
  appUrl: process.env.APP_URL ?? "http://localhost:3000",
  paymentMock: process.env.PAYMENT_MOCK === "true",
  midtrans: {
    serverKey: process.env.MIDTRANS_SERVER_KEY ?? "",
    clientKey: process.env.MIDTRANS_CLIENT_KEY ?? "",
    production: process.env.MIDTRANS_IS_PRODUCTION === "true",
  },
  discord: {
    botToken: process.env.DISCORD_BOT_TOKEN ?? "",
    guildId: process.env.DISCORD_GUILD_ID ?? "",
    inviteUrl: process.env.DISCORD_INVITE_URL ?? "",
  },
  internalApiToken: process.env.INTERNAL_API_TOKEN ?? "",
  codePepper: process.env.CODE_PEPPER ?? "",
  appKey: process.env.APP_KEY ?? "",
  mailFrom: process.env.MAIL_FROM ?? "JarchiFX <no-reply@jarchifx.local>",
};

export function getMidtransServerKey() {
  if (env.midtrans.serverKey) {
    return env.midtrans.serverKey;
  }

  return env.paymentMock ? "mock-server-key" : "";
}
