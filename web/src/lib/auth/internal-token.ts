import { timingSafeEqual } from "node:crypto";
import { env } from "@/lib/env";

export function isValidInternalToken(value: string | null) {
  if (!env.internalApiToken || !value) {
    return false;
  }

  const provided = Buffer.from(value, "utf8");
  const expected = Buffer.from(env.internalApiToken, "utf8");

  if (provided.length !== expected.length) {
    return false;
  }

  return timingSafeEqual(provided, expected);
}
