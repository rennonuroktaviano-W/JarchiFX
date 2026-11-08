import {
  createCipheriv,
  createDecipheriv,
  createHash,
  createHmac,
  randomBytes,
  randomInt,
} from "node:crypto";
import { env } from "@/lib/env";

const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const CODE_LENGTH = 12;

function getPepper() {
  if (!env.codePepper) {
    throw new Error("CODE_PEPPER belum diisi.");
  }

  return env.codePepper;
}

function getEncryptionKey() {
  if (!env.appKey) {
    throw new Error("APP_KEY belum diisi.");
  }

  return createHash("sha256").update(env.appKey).digest();
}

export function generateCodeString() {
  let value = "";

  for (let index = 0; index < CODE_LENGTH; index += 1) {
    value += ALPHABET[randomInt(0, ALPHABET.length)];
  }

  return value;
}

export function formatAccessCode(code: string) {
  return code.match(/.{1,4}/g)?.join("-") ?? code;
}

export function normalizeAccessCode(code: string) {
  return code.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

export function hashAccessCode(code: string) {
  return createHmac("sha256", getPepper())
    .update(normalizeAccessCode(code))
    .digest("hex");
}

export function encryptAccessCode(code: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", getEncryptionKey(), iv);
  const encrypted = Buffer.concat([
    cipher.update(normalizeAccessCode(code), "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  return [
    iv.toString("base64url"),
    authTag.toString("base64url"),
    encrypted.toString("base64url"),
  ].join(".");
}

export function decryptAccessCode(value: string) {
  const [iv, authTag, encrypted] = value.split(".");

  if (!iv || !authTag || !encrypted) {
    throw new Error("Format kode terenkripsi tidak valid.");
  }

  const decipher = createDecipheriv(
    "aes-256-gcm",
    getEncryptionKey(),
    Buffer.from(iv, "base64url"),
  );
  decipher.setAuthTag(Buffer.from(authTag, "base64url"));

  return Buffer.concat([
    decipher.update(Buffer.from(encrypted, "base64url")),
    decipher.final(),
  ]).toString("utf8");
}

export function generateAccessCode() {
  const raw = generateCodeString();

  return {
    raw,
    formatted: formatAccessCode(raw),
    hash: hashAccessCode(raw),
    encrypted: encryptAccessCode(raw),
  };
}
