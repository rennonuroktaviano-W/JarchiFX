import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import nodemailer from "nodemailer";
import { brand } from "@/content/landing";
import { env } from "@/lib/env";

type AccessCodeEmail = {
  to: string;
  buyerName: string;
  className: string;
  code: string;
  orderCode: string;
};

function buildMessage(input: AccessCodeEmail) {
  const inviteUrl = env.discord.inviteUrl || "Link Discord belum diisi.";
  const subject = `Kode akses kelas kamu - ${brand.name}`;
  const text = [
    `Halo ${input.buyerName},`,
    "",
    `Pembayaran untuk ${input.className} sudah diterima.`,
    `Kode akses: ${input.code}`,
    "",
    "Langkah aktivasi:",
    `1. Masuk ke server Discord: ${inviteUrl}`,
    "2. Buka channel verifikasi.",
    `3. Jalankan /redeem kode:${input.code}`,
    "",
    `Kode order: ${input.orderCode}`,
    `Bantuan: ${brand.contactEmail}`,
  ].join("\n");
  const html = [
    `<p>Halo ${input.buyerName},</p>`,
    `<p>Pembayaran untuk ${input.className} sudah diterima.</p>`,
    `<p>Kode akses: <strong style="font-family:monospace">${input.code}</strong></p>`,
    "<p>Langkah aktivasi:</p>",
    "<ol>",
    `<li>Masuk ke server Discord: ${inviteUrl}</li>`,
    "<li>Buka channel verifikasi.</li>",
    `<li>Jalankan <code>/redeem kode:${input.code}</code></li>`,
    "</ol>",
    `<p>Kode order: <code>${input.orderCode}</code></p>`,
    `<p>Bantuan: ${brand.contactEmail}</p>`,
  ].join("");

  return { subject, text, html };
}

export async function sendAccessCodeEmail(input: AccessCodeEmail) {
  const message = buildMessage(input);

  if (process.env.MAIL_MAILER === "log") {
    const directory = join(process.cwd(), "storage", "mail");
    await mkdir(directory, { recursive: true });
    const filename = `${Date.now()}-${input.orderCode}.json`;
    await writeFile(
      join(directory, filename),
      JSON.stringify(
        {
          to: input.to,
          from: env.mailFrom,
          ...message,
        },
        null,
        2,
      ),
      "utf8",
    );

    return { messageId: filename };
  }

  const transport = nodemailer.createTransport({
    host: process.env.MAIL_HOST,
    port: Number(process.env.MAIL_PORT ?? 587),
    secure: Number(process.env.MAIL_PORT ?? 587) === 465,
    auth: process.env.MAIL_USERNAME
      ? {
          user: process.env.MAIL_USERNAME,
          pass: process.env.MAIL_PASSWORD,
        }
      : undefined,
  });

  return transport.sendMail({
    from: env.mailFrom,
    to: input.to,
    subject: message.subject,
    text: message.text,
    html: message.html,
  });
}
