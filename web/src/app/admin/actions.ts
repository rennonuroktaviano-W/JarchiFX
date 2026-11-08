"use server";

import { redirect } from "next/navigation";
import {
  createAdminSession,
  destroyAdminSession,
  requireAdmin,
  verifyAdminCredentials,
} from "@/lib/auth/admin-session";
import {
  enqueueAccessCodeEmail,
  generateManualAccessCode,
  revokeAccessCode,
  revokeMember,
  updateCourseClass,
} from "@/lib/services/admin-service";

function stringValue(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim() : "";
}

function parsePositiveInt(value: FormDataEntryValue | null) {
  const text = stringValue(value);

  if (!/^\d+$/.test(text)) {
    return null;
  }

  const parsed = Number.parseInt(text, 10);

  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
}

function parseBigIntId(value: FormDataEntryValue | null) {
  const text = stringValue(value);

  if (!/^\d+$/.test(text)) {
    return null;
  }

  const parsed = BigInt(text);

  return parsed > BigInt(0) ? parsed : null;
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export async function loginAction(formData: FormData) {
  const email = stringValue(formData.get("email"));
  const password = stringValue(formData.get("password"));

  if (!email || !password) {
    redirect("/admin/login?error=missing");
  }

  const admin = await verifyAdminCredentials(email, password);

  if (!admin) {
    redirect("/admin/login?error=invalid");
  }

  await createAdminSession(admin);
  redirect("/admin");
}

export async function logoutAction() {
  await destroyAdminSession();
  redirect("/admin/login");
}

export async function resendAccessCodeAction(formData: FormData) {
  await requireAdmin();

  const orderId = parseBigIntId(formData.get("orderId"));

  if (!orderId) {
    redirect("/admin/orders?error=invalid");
  }

  const sent = await enqueueAccessCodeEmail(orderId).catch(() => false);

  redirect(`/admin/orders/${orderId}?sent=${sent ? "1" : "0"}`);
}

export async function revokeCodeAction(formData: FormData) {
  await requireAdmin();

  const accessCodeId = parseBigIntId(formData.get("accessCodeId"));

  if (!accessCodeId) {
    redirect("/admin/codes?error=invalid");
  }

  const result = await revokeAccessCode(accessCodeId).catch(() => null);

  if (!result) {
    redirect("/admin/codes?error=not_found");
  }

  redirect(`/admin/codes?revoked=${result.changed ? "1" : "0"}`);
}

export async function revokeMemberAction(formData: FormData) {
  await requireAdmin();

  const memberId = parseBigIntId(formData.get("memberId"));

  if (!memberId) {
    redirect("/admin/members?error=invalid");
  }

  const member = await revokeMember(memberId).catch(() => null);

  redirect(`/admin/members?revoked=${member ? "1" : "0"}`);
}

export async function generateManualCodeAction(formData: FormData) {
  await requireAdmin();

  const classId = parsePositiveInt(formData.get("classId"));
  const buyerName = stringValue(formData.get("buyerName")).slice(0, 120);
  const buyerEmail = stringValue(formData.get("buyerEmail"))
    .toLowerCase()
    .slice(0, 190);

  if (!classId || (buyerEmail && !isValidEmail(buyerEmail))) {
    redirect("/admin/codes?error=invalid");
  }

  const result = await generateManualAccessCode({
    classId,
    buyerName,
    buyerEmail,
  }).catch(() => null);

  if (!result) {
    redirect("/admin/codes?error=create_failed");
  }

  redirect(`/admin/codes?created=${result.accessCodeId}`);
}

export async function updateClassAction(formData: FormData) {
  await requireAdmin();

  const classId = parsePositiveInt(formData.get("classId"));
  const name = stringValue(formData.get("name")).slice(0, 120);
  const price = parsePositiveInt(formData.get("price"));
  const accessDaysRaw = stringValue(formData.get("accessDays"));
  const accessDays =
    accessDaysRaw === "" ? null : parsePositiveInt(accessDaysRaw);
  const discordRoleId = stringValue(formData.get("discordRoleId")).slice(0, 30);
  const isActive = formData.get("isActive") === "on";

  if (
    !classId ||
    !name ||
    price === null ||
    (accessDaysRaw !== "" && accessDays === null)
  ) {
    redirect("/admin/classes?error=invalid");
  }

  const updated = await updateCourseClass(classId, {
    name,
    price,
    accessDays,
    discordRoleId,
    isActive,
  }).catch(() => null);

  if (!updated) {
    redirect("/admin/classes?error=not_found");
  }

  redirect(`/admin/classes?saved=${updated.id}`);
}
