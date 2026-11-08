import "dotenv/config";

process.env.DATABASE_NAME = "jarchifx_test";
process.env.PAYMENT_MOCK = "true";
process.env.APP_KEY ??= "test-app-key";
process.env.CODE_PEPPER ??= "test-code-pepper";
process.env.INTERNAL_API_TOKEN = "test-internal-token";
process.env.DISCORD_BOT_TOKEN = "test-bot-token";
process.env.DISCORD_GUILD_ID = "123456789012345678";
