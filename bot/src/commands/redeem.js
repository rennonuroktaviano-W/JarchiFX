import { MessageFlags, SlashCommandBuilder } from "discord.js";
import { redeem } from "../api.js";

export const data = new SlashCommandBuilder()
  .setName("redeem")
  .setDescription("Aktifkan akses kelas dengan kode akses")
  .addStringOption((option) =>
    option
      .setName("kode")
      .setDescription("Kode akses dari halaman order atau email")
      .setRequired(true),
  );

const messages = {
  invalid: "Kode tidak ditemukan. Periksa kembali penulisannya.",
  used: "Kode ini sudah pernah dipakai.",
  expired: "Kode ini sudah kedaluwarsa. Hubungi admin.",
  revoked: "Kode ini sudah tidak berlaku. Hubungi admin.",
  rate_limited: "Terlalu banyak percobaan. Coba lagi nanti.",
};

export async function execute(interaction) {
  const code = interaction.options.getString("kode", true);
  const suffix = code.slice(-4);

  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  try {
    const { httpStatus, data } = await redeem(code, interaction.user.id);

    if (httpStatus === 200 && data.status === "ok") {
      await interaction.editReply(
        data.role_status === "granted"
          ? "Berhasil. Role kelas sudah aktif, silakan buka channel kelas."
          : "Kode diterima. Role sedang diproses dan akan aktif dalam beberapa menit.",
      );
      console.log(`Redeem berhasil untuk user ${interaction.user.id}, kode ...${suffix}`);
      return;
    }

    if (httpStatus === 401) {
      await interaction.editReply(
        "Terjadi gangguan. Coba lagi sebentar atau hubungi admin.",
      );
      console.error("Redeem gagal: token API internal ditolak.");
      return;
    }

    const status = data.status;
    await interaction.editReply(
      messages[status] ??
        "Terjadi gangguan. Coba lagi sebentar atau hubungi admin.",
    );
    console.log(
      `Redeem gagal (${status ?? httpStatus}) untuk user ${interaction.user.id}, kode ...${suffix}`,
    );
  } catch (error) {
    console.error("Redeem error", error);
    await interaction.editReply(
      "Terjadi gangguan. Coba lagi sebentar atau hubungi admin.",
    );
  }
}
