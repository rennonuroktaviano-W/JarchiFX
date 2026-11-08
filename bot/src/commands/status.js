import { MessageFlags, SlashCommandBuilder } from "discord.js";
import { fetchStatus } from "../api.js";

export const data = new SlashCommandBuilder()
  .setName("status")
  .setDescription("Lihat status akses kelas kamu");

function formatDate(value) {
  if (!value) {
    return "seumur hidup";
  }

  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeZone: "Asia/Jakarta",
  }).format(new Date(value));
}

export async function execute(interaction) {
  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  try {
    const { httpStatus, data } = await fetchStatus(interaction.user.id);

    if (httpStatus !== 200 || data.status !== "ok") {
      await interaction.editReply(
        "Terjadi gangguan. Coba lagi sebentar atau hubungi admin.",
      );
      return;
    }

    if (!data.memberships?.length) {
      await interaction.editReply("Belum ada akses kelas untuk akun ini.");
      return;
    }

    const lines = data.memberships.map((membership) => {
      const active = membership.status === "active" ? "aktif" : membership.status;
      return `${membership.class_name} - ${active} - sampai ${formatDate(membership.access_until)}`;
    });

    await interaction.editReply(lines.join("\n"));
  } catch (error) {
    console.error("Status error", error);
    await interaction.editReply(
      "Terjadi gangguan. Coba lagi sebentar atau hubungi admin.",
    );
  }
}
