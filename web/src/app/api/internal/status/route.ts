import { NextResponse } from "next/server";
import { z } from "zod";
import { isValidInternalToken } from "@/lib/auth/internal-token";
import { getMemberships } from "@/lib/services/redeem-service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const requestSchema = z.object({
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

  const memberships = await getMemberships(parsed.data.discord_user_id);

  return NextResponse.json({
    status: "ok",
    memberships: memberships.map((member) => ({
      class_name: member.class.name,
      access_until: member.accessUntil ? member.accessUntil.toISOString() : null,
      status: member.status,
    })),
  });
}
