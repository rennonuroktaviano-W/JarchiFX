import { z } from "zod";

export const checkoutSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Nama minimal 2 karakter.")
    .max(120, "Nama terlalu panjang."),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Format email tidak valid.")
    .max(190, "Email terlalu panjang."),
  whatsapp: z
    .string()
    .trim()
    .min(8, "Nomor WhatsApp minimal 8 karakter.")
    .max(30, "Nomor WhatsApp terlalu panjang.")
    .regex(/^[0-9+\-\s()]+$/, "Nomor WhatsApp tidak valid."),
  classSlug: z.string().trim().min(1, "Pilih paket terlebih dahulu."),
});

export type CheckoutInput = z.infer<typeof checkoutSchema>;
