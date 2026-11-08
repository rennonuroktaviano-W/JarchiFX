import { NextResponse } from "next/server";
import { z } from "zod";
import { isValidInternalToken } from "@/lib/auth/internal-token";
import { redeemCode } from "@/lib/services/redeem-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const requestSchema = z.object({
  code: z.string().min(1).max(64),
  discord_user_id: z.string().regex(/^\d{17,20}$/),
});

export async function POST(request: Request) {
  const authorization = request.headers.get("authorization");
  const token = authorization?.startsWith("Bearer ")
    ? authorization.slice(7)
    : null;

  if (!isValidInternalToken(token)) {
    return NextResponse.json({ status: "unauthorized" }, { status: 401 });
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ status: "invalid" }, { status: 400 });
  }

  const parsed = requestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ status: "invalid" }, { status: 422 });
  }

  const result = await redeemCode({
    code: parsed.data.code,
    discordUserId: parsed.data.discord_user_id,
  });

  if (result.status !== "ok") {
    return NextResponse.json({ status: result.status }, { status: 422 });
  }

  return NextResponse.json({
    status: "ok",
    class_name: result.className,
    access_until: result.accessUntil,
    role_status: result.roleStatus,
  });
}
