"use server";

import { redirect } from "next/navigation";
import { checkoutSchema } from "@/lib/validation/checkout";
import { createOrder, OrderError } from "@/lib/services/order-service";

export type CheckoutState = {
  error?: string;
  fieldErrors?: Record<string, string>;
};

export async function checkoutAction(
  _previousState: CheckoutState,
  formData: FormData,
): Promise<CheckoutState> {
  const parsed = checkoutSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    whatsapp: formData.get("whatsapp"),
    classSlug: formData.get("classSlug"),
  });

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};

    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "form");

      if (!fieldErrors[key]) {
        fieldErrors[key] = issue.message;
      }
    }

    return {
      error: "Periksa kembali data yang diisi.",
      fieldErrors,
    };
  }

  let redirectUrl = "/";

  try {
    const result = await createOrder(parsed.data);
    redirectUrl = result.redirectUrl;
  } catch (error) {
    if (error instanceof OrderError) {
      return { error: error.message };
    }

    console.error("Checkout gagal", error);

    return {
      error: "Terjadi gangguan saat membuat order. Coba lagi sebentar.",
    };
  }

  redirect(redirectUrl);
}
