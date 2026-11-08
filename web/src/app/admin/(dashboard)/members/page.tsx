import type { Metadata } from "next";
import Link from "next/link";
import type { Prisma } from "@/generated/prisma/client";
import { ConfirmSubmit } from "@/components/admin/confirm-submit";
import { Notice } from "@/components/admin/notice";
import { StatusBadge } from "@/components/admin/status-badge";
import { formatDate } from "@/lib/format";
import { requireAdmin } from "@/lib/auth/admin-session";
import { prisma } from "@/lib/prisma";
import { revokeMemberAction } from "../../actions";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Member",
  robots: { index: false, follow: false },
};

const statuses = ["active", "expired", "revoked"] as const;

type MemberStatus = (typeof statuses)[number];

const statusLabels: Record<MemberStatus, string> = {
  active: "Aktif",
  expired: "Kedaluwarsa",
  revoked: "Dicabut",
};

type MembersPageProps = {
  searchParams: Promise<{ status?: string; revoked?: string }>;
};

function isMemberStatus(value: string | undefined): value is MemberStatus {
  return Boolean(value && statuses.includes(value as MemberStatus));
}

export default async function AdminMembersPage({
  searchParams,
}: MembersPageProps) {
  await requireAdmin();
  const params = await searchParams;
  const activeStatus = isMemberStatus(params.status) ? params.status : undefined;

  const where: Prisma.MemberWhereInput = {};

  if (activeStatus) {
    where.status = activeStatus;
  }

  const members = await prisma.member.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { class: true, accessCode: true },
  });

  function filterHref(nextStatus?: MemberStatus) {
    return nextStatus
      ? `/admin/members?status=${nextStatus}`
      : "/admin/members";
  }

  return (
    <div className="space-y-8">
      <header>
        <p className="type-label">Admin</p>
        <h1 className="type-h2 mt-2 text-ink">Member</h1>
        <p className="mt-2 text-[14px] text-muted">
          {members.length} member ditampilkan, maksimal 100 terbaru.
        </p>
      </header>

      {params.revoked === "1" ? (
        <Notice tone="success">
          Member dicabut. Kode akses ditandai revoked dan role Discord akan
          dicabut lewat antrean.
        </Notice>
      ) : null}

      {params.revoked === "0" ? (
        <Notice tone="error">Member tidak ditemukan.</Notice>
      ) : null}

      <nav aria-label="Filter status" className="flex flex-wrap gap-2">
        <Link
          href={filterHref()}
          aria-current={!activeStatus ? "page" : undefined}
          className={`rounded-[6px] border px-3 py-1.5 text-[13px] font-medium transition-colors duration-150 ease-out ${
            !activeStatus
              ? "border-accent/60 bg-accent/10 text-accent"
              : "border-line text-ink-2 hover:text-ink"
          }`}
        >
          Semua
        </Link>
        {statuses.map((value) => (
          <Link
            key={value}
            href={filterHref(value)}
            aria-current={activeStatus === value ? "page" : undefined}
            className={`rounded-[6px] border px-3 py-1.5 text-[13px] font-medium transition-colors duration-150 ease-out ${
              activeStatus === value
                ? "border-accent/60 bg-accent/10 text-accent"
                : "border-line text-ink-2 hover:text-ink"
            }`}
          >
            {statusLabels[value]}
          </Link>
        ))}
      </nav>

      <div className="card overflow-x-auto">
        {members.length === 0 ? (
          <p className="px-5 py-10 text-[14px] text-muted">
            Belum ada member yang cocok.
          </p>
        ) : (
          <table className="w-full min-w-[900px] border-collapse text-left text-[14px]">
            <thead>
              <tr className="type-label">
                <th className="border-b border-line px-5 py-3 font-medium">
                  Discord ID
                </th>
                <th className="border-b border-line px-3 py-3 font-medium">
                  Kelas
                </th>
                <th className="border-b border-line px-3 py-3 font-medium">
                  Status
                </th>
                <th className="border-b border-line px-3 py-3 font-medium">
                  Role
                </th>
                <th className="border-b border-line px-3 py-3 font-medium">
                  Akses sampai
                </th>
                <th className="border-b border-line px-3 py-3 font-medium">
                  Kode
                </th>
                <th className="border-b border-line px-5 py-3 font-medium">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody>
              {members.map((member) => (
                <tr
                  key={member.id.toString()}
                  className="transition-colors duration-150 ease-out hover:bg-raised/60"
                >
                  <td className="mono border-b border-line/60 px-5 py-3 align-top text-[12px] text-ink-2">
                    {member.discordUserId}
                    <p className="mt-1 text-muted">
                      Sejak {formatDate(member.createdAt)}
                    </p>
                  </td>
                  <td className="border-b border-line/60 px-3 py-3 align-top text-ink-2">
                    {member.class.name}
                  </td>
                  <td className="border-b border-line/60 px-3 py-3 align-top">
                    <StatusBadge value={member.status} />
                  </td>
                  <td className="border-b border-line/60 px-3 py-3 align-top">
                    <StatusBadge value={member.roleStatus} />
                    <p className="mt-1 text-[11px] text-muted">
                      {formatDate(member.roleGrantedAt)}
                    </p>
                  </td>
                  <td className="border-b border-line/60 px-3 py-3 align-top text-[12px] text-ink-2">
                    {formatDate(member.accessUntil)}
                  </td>
                  <td className="border-b border-line/60 px-3 py-3 align-top">
                    <StatusBadge value={member.accessCode.status} />
                  </td>
                  <td className="border-b border-line/60 px-5 py-3 align-top">
                    {member.status !== "revoked" ? (
                      <form action={revokeMemberAction}>
                        <input
                          type="hidden"
                          name="memberId"
                          value={member.id.toString()}
                        />
                        <ConfirmSubmit message="Cabut akses member ini? Kode akses juga akan dicabut.">
                          Cabut akses
                        </ConfirmSubmit>
                      </form>
                    ) : (
                      <span className="text-[12px] text-muted">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
