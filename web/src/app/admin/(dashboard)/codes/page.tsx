import type { Metadata } from "next";
import Link from "next/link";
import type { Prisma } from "@/generated/prisma/client";
import { ConfirmSubmit } from "@/components/admin/confirm-submit";
import { Notice } from "@/components/admin/notice";
import { StatusBadge } from "@/components/admin/status-badge";
import { Button } from "@/components/ui/button";
import { hashAccessCode } from "@/lib/services/access-code-service";
import { displayAccessCode } from "@/lib/services/admin-service";
import { formatDate } from "@/lib/format";
import { requireAdmin } from "@/lib/auth/admin-session";
import { prisma } from "@/lib/prisma";
import { generateManualCodeAction, revokeCodeAction } from "../../actions";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Kode Akses",
  robots: { index: false, follow: false },
};

const statuses = ["active", "redeemed", "expired", "revoked"] as const;

type AccessCodeStatus = (typeof statuses)[number];

const statusLabels: Record<AccessCodeStatus, string> = {
  active: "Aktif",
  redeemed: "Terpakai",
  expired: "Kedaluwarsa",
  revoked: "Dicabut",
};

type CodesPageProps = {
  searchParams: Promise<{
    status?: string;
    q?: string;
    created?: string;
    revoked?: string;
    error?: string;
  }>;
};

function isAccessCodeStatus(
  value: string | undefined,
): value is AccessCodeStatus {
  return Boolean(value && statuses.includes(value as AccessCodeStatus));
}

function parseCreated(value: string | undefined) {
  if (!value || !/^\d+$/.test(value)) {
    return null;
  }

  return BigInt(value);
}

export default async function AdminCodesPage({
  searchParams,
}: CodesPageProps) {
  await requireAdmin();
  const params = await searchParams;
  const activeStatus = isAccessCodeStatus(params.status)
    ? params.status
    : undefined;
  const query = (params.q ?? "").trim();
  const createdId = parseCreated(params.created);

  const where: Prisma.AccessCodeWhereInput = {};

  if (activeStatus) {
    where.status = activeStatus;
  }

  if (query) {
    where.codeHash = hashAccessCode(query);
  }

  const [codes, classes] = await Promise.all([
    prisma.accessCode.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        order: { include: { class: true } },
        member: true,
      },
    }),
    prisma.courseClass.findMany({ orderBy: { name: "asc" } }),
  ]);

  const createdCode = createdId
    ? codes.find((code) => code.id === createdId)
    : null;

  function filterHref(nextStatus?: AccessCodeStatus) {
    const search = new URLSearchParams();

    if (nextStatus) {
      search.set("status", nextStatus);
    }

    if (query) {
      search.set("q", query);
    }

    const suffix = search.toString();

    return `/admin/codes${suffix ? `?${suffix}` : ""}`;
  }

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="type-label">Admin</p>
          <h1 className="type-h2 mt-2 text-ink">Kode akses</h1>
          <p className="mt-2 text-[14px] text-muted">
            {codes.length} kode ditampilkan, maksimal 100 terbaru.
          </p>
        </div>

        <form method="get" className="flex w-full max-w-sm gap-2">
          {activeStatus ? (
            <input type="hidden" name="status" value={activeStatus} />
          ) : null}
          <input
            type="search"
            name="q"
            defaultValue={query}
            placeholder="Cari kode lengkap"
            className="field-input"
            aria-label="Cari kode akses"
          />
          <button
            type="submit"
            className="min-h-11 shrink-0 rounded-[6px] border border-line bg-surface px-4 text-[14px] font-semibold text-ink transition-colors duration-150 ease-out hover:border-ink-2/60"
          >
            Cari
          </button>
        </form>
      </header>

      {createdCode ? (
        <Notice tone="success">
          Kode manual berhasil dibuat:{" "}
          <span className="mono">
            {displayAccessCode(createdCode.codeEncrypted)}
          </span>
        </Notice>
      ) : null}

      {params.revoked === "1" ? (
        <Notice tone="success">
          Kode dicabut. Member terkait ditandai revoked dan role Discord akan
          dicabut lewat antrean.
        </Notice>
      ) : null}

      {params.revoked === "0" ? (
        <Notice tone="info">Kode ini memang sudah dicabut sebelumnya.</Notice>
      ) : null}

      {params.error ? (
        <Notice tone="error">
          Aksi gagal. Periksa kembali data yang diisi.
        </Notice>
      ) : null}

      <section className="card p-5">
        <h2 className="text-[16px] font-semibold text-ink">
          Generate kode manual
        </h2>
        <p className="mt-1 text-[13px] text-muted">
          Untuk beasiswa atau komplimen. Order dibuat dengan status lunas dan
          nominal Rp0.
        </p>

        <form
          action={generateManualCodeAction}
          className="mt-5 grid gap-4 md:grid-cols-[1fr_1fr_1fr_auto] md:items-end"
        >
          <div>
            <label htmlFor="manual-class" className="field-label">
              Kelas
            </label>
            <select
              id="manual-class"
              name="classId"
              required
              className="field-input"
              defaultValue=""
            >
              <option value="" disabled>
                Pilih kelas
              </option>
              {classes.map((courseClass) => (
                <option key={courseClass.id} value={courseClass.id}>
                  {courseClass.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="manual-name" className="field-label">
              Penerima
            </label>
            <input
              id="manual-name"
              name="buyerName"
              type="text"
              maxLength={120}
              placeholder="Nama penerima"
              className="field-input"
            />
          </div>

          <div>
            <label htmlFor="manual-email" className="field-label">
              Email
            </label>
            <input
              id="manual-email"
              name="buyerEmail"
              type="email"
              maxLength={190}
              placeholder="opsional"
              className="field-input"
            />
          </div>

          <Button type="submit">Buat kode</Button>
        </form>
      </section>

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
        {codes.length === 0 ? (
          <p className="px-5 py-10 text-[14px] text-muted">
            Tidak ada kode yang cocok.
          </p>
        ) : (
          <table className="w-full min-w-[980px] border-collapse text-left text-[14px]">
            <thead>
              <tr className="type-label">
                <th className="border-b border-line px-5 py-3 font-medium">
                  Kode
                </th>
                <th className="border-b border-line px-3 py-3 font-medium">
                  Kelas / pembeli
                </th>
                <th className="border-b border-line px-3 py-3 font-medium">
                  Status
                </th>
                <th className="border-b border-line px-3 py-3 font-medium">
                  Redeem
                </th>
                <th className="border-b border-line px-3 py-3 font-medium">
                  Akses sampai
                </th>
                <th className="border-b border-line px-5 py-3 font-medium">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody>
              {codes.map((code) => (
                <tr
                  key={code.id.toString()}
                  className={
                    createdCode?.id === code.id
                      ? "bg-accent/5"
                      : "transition-colors duration-150 ease-out hover:bg-raised/60"
                  }
                >
                  <td className="border-b border-line/60 px-5 py-3 align-top">
                    <p className="mono text-[13px] text-ink">
                      {displayAccessCode(code.codeEncrypted)}
                    </p>
                    <p className="mt-1 text-[11px] text-muted">
                      {formatDate(code.createdAt)}
                    </p>
                  </td>
                  <td className="border-b border-line/60 px-3 py-3 align-top">
                    <p className="text-ink-2">{code.order.class.name}</p>
                    <p className="mt-0.5 break-all text-[12px] text-muted">
                      {code.order.buyerName} · {code.order.buyerEmail}
                    </p>
                  </td>
                  <td className="border-b border-line/60 px-3 py-3 align-top">
                    <StatusBadge value={code.status} />
                  </td>
                  <td className="border-b border-line/60 px-3 py-3 align-top text-[12px] text-ink-2">
                    <p>{formatDate(code.redeemedAt)}</p>
                    {code.redeemedByDiscordId ? (
                      <p className="mono mt-1 break-all text-muted">
                        {code.redeemedByDiscordId}
                      </p>
                    ) : null}
                  </td>
                  <td className="border-b border-line/60 px-3 py-3 align-top text-[12px] text-ink-2">
                    {formatDate(code.member?.accessUntil)}
                  </td>
                  <td className="border-b border-line/60 px-5 py-3 align-top">
                    {code.status !== "revoked" ? (
                      <form action={revokeCodeAction}>
                        <input
                          type="hidden"
                          name="accessCodeId"
                          value={code.id.toString()}
                        />
                        <ConfirmSubmit message="Cabut kode ini? Tindakan ini tidak bisa dibatalkan.">
                          Cabut
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
