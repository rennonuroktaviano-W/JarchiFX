import "server-only";
import { createHash } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { env } from "@/lib/env";
import { prisma } from "@/lib/prisma";

const COOKIE_NAME = "jarchifx_admin";
const SESSION_TTL_SECONDS = 8 * 60 * 60;
const DUMMY_PASSWORD_HASH =
  "$2b$12$2.p.ugETENqgt9tSPlSgG.9vzuRhVcuiLDC5fgxjPBQotoHRoH8Wy";

type AdminIdentity = {
  id: number;
  name: string;
  email: string;
};

export type AdminSession = {
  adminId: number;
  name: string;
  email: string;
};

function getSessionSecret() {
  if (!env.appKey) {
    throw new Error("APP_KEY belum diisi.");
  }

  return createHash("sha256")
    .update(`jarchifx-admin-session:${env.appKey}`)
    .digest();
}

function cookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/admin",
  };
}

export async function verifyAdminCredentials(email: string, password: string) {
  const normalizedEmail = email.trim().toLowerCase();
  const admin = await prisma.admin.findUnique({
    where: { email: normalizedEmail },
  });

  const passwordHash = admin?.passwordHash ?? DUMMY_PASSWORD_HASH;
  const valid = await bcrypt.compare(password, passwordHash);

  if (!admin || !valid) {
    return null;
  }

  return admin;
}

export async function createAdminSession(admin: AdminIdentity) {
  const token = await new SignJWT({ name: admin.name, email: admin.email })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(admin.id.toString())
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .sign(getSessionSecret());

  const store = await cookies();

  store.set(COOKIE_NAME, token, {
    ...cookieOptions(),
    maxAge: SESSION_TTL_SECONDS,
  });
}

export async function destroyAdminSession() {
  const store = await cookies();

  store.set(COOKIE_NAME, "", {
    ...cookieOptions(),
    maxAge: 0,
  });
}

export async function getAdminSession(): Promise<AdminSession | null> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  try {
    const { payload } = await jwtVerify(token, getSessionSecret(), {
      algorithms: ["HS256"],
    });

    if (
      typeof payload.sub !== "string" ||
      typeof payload.email !== "string" ||
      typeof payload.name !== "string"
    ) {
      return null;
    }

    const adminId = Number.parseInt(payload.sub, 10);

    if (!Number.isInteger(adminId)) {
      return null;
    }

    return {
      adminId,
      name: payload.name,
      email: payload.email,
    };
  } catch {
    return null;
  }
}

export const requireAdmin = cache(async () => {
  const session = await getAdminSession();

  if (!session) {
    redirect("/admin/login");
  }

  const admin = await prisma.admin.findUnique({
    where: { id: session.adminId },
  });

  if (!admin) {
    redirect("/admin/login");
  }

  return admin;
});
