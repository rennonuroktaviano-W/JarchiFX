import { Client, Events, GatewayIntentBits, MessageFlags } from "discord.js";
import { config } from "./config.js";
import * as redeemCommand from "./commands/redeem.js";
import * as statusCommand from "./commands/status.js";

const commands = new Map([
  [redeemCommand.data.name, redeemCommand],
  [statusCommand.data.name, statusCommand],
]);

if (!config.token) {
  console.error("DISCORD_BOT_TOKEN belum diisi.");
  process.exit(1);
}

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.once(Events.ClientReady, (readyClient) => {
  console.log(`Bot online sebagai ${readyClient.user.tag}`);
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) {
    return;
  }

  const command = commands.get(interaction.commandName);

  if (!command) {
    return;
  }

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error("Command error", error);

    const payload = {
      content: "Terjadi gangguan. Coba lagi sebentar atau hubungi admin.",
      flags: MessageFlags.Ephemeral,
    };

    if (interaction.deferred || interaction.replied) {
      await interaction.editReply(payload.content).catch(() => {});
    } else {
      await interaction.reply(payload).catch(() => {});
    }
  }
});

client.login(config.token);
