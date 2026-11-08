import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ConfirmSubmit } from "@/components/admin/confirm-submit";
import { Notice } from "@/components/admin/notice";
import { StatusBadge } from "@/components/admin/status-badge";
import { Button } from "@/components/ui/button";
import { displayAccessCode } from "@/lib/services/admin-service";
import { formatDate, formatRupiah } from "@/lib/format";
import { requireAdmin } from "@/lib/auth/admin-session";
import { prisma } from "@/lib/prisma";
import { resendAccessCodeAction, revokeCodeAction } from "../../../actions";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Detail Order",
  robots: { index: false, follow: false },
};

type OrderDetailPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ sent?: string }>;
};

function parseId(value: string) {
  if (!/^\d+$/.test(value)) {
    return null;
  }

  const parsed = BigInt(value);

  return parsed > BigInt(0) ? parsed : null;
}

export default async function AdminOrderDetailPage({
  params,
  searchParams,
}: OrderDetailPageProps) {
  await requireAdmin();
  const { id } = await params;
  const orderId = parseId(id);

  if (!orderId) {
    notFound();
  }

  const [{ sent }, order] = await Promise.all([
    searchParams,
    prisma.order.findUnique({
      where: { id: orderId },
      include: {
        class: true,
        accessCode: { include: { member: true } },
        payments: { orderBy: { createdAt: "desc" } },
      },
    }),
  ]);

  if (!order) {
    notFound();
  }

  const accessCode = order.accessCode
    ? displayAccessCode(order.accessCode.codeEncrypted)
    : null;

  return (
    <div className="space-y-8">
      <div>
        <Link
          href="/admin/orders"
          className="text-[13px] font-medium text-ink-2 transition-colors duration-150 ease-out hover:text-ink"
        >
          Kembali ke order
        </Link>

        <div className="mt-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="type-label">Order</p>
            <h1 className="mono mt-2 break-all text-[22px] text-ink">
              {order.orderCode}
            </h1>
            <p className="mt-2 text-[13px] text-muted">
              ID {order.id.toString()} · {formatDate(order.createdAt)}
            </p>
          </div>
          <StatusBadge value={order.status} />
        </div>
      </div>

      {sent === "1" ? (
        <Notice tone="success">
          Job kirim ulang email kode sudah dimasukkan ke antrean.
        </Notice>
      ) : null}

      {sent === "0" ? (
        <Notice tone="error">
          Email tidak dapat dikirim ulang. Pastikan order lunas dan kode akses
          sudah dibuat.
        </Notice>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="card p-6">
          <h2 className="text-[16px] font-semibold text-ink">Pembeli</h2>
          <dl className="mt-5 space-y-4 text-[14px]">
            <div>
              <dt className="text-muted">Nama</dt>
              <dd className="mt-1 text-ink">{order.buyerName}</dd>
            </div>
            <div>
              <dt className="text-muted">Email</dt>
              <dd className="mt-1 break-all text-ink">{order.buyerEmail}</dd>
            </div>
            <div>
              <dt className="text-muted">WhatsApp</dt>
              <dd className="mono mt-1 text-ink">{order.buyerWhatsapp}</dd>
            </div>
            <div>
              <dt className="text-muted">Paket</dt>
              <dd className="mt-1 text-ink">{order.class.name}</dd>
            </div>
            <div>
              <dt className="text-muted">Jumlah</dt>
              <dd className="mono mt-1 text-ink">
                {formatRupiah(order.amount)}
              </dd>
            </div>
            <div>
              <dt className="text-muted">Dibayar</dt>
              <dd className="mt-1 text-ink-2">{formatDate(order.paidAt)}</dd>
            </div>
          </dl>
        </section>

        <section className="card p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <h2 className="text-[16px] font-semibold text-ink">Kode akses</h2>
            {order.accessCode ? (
              <StatusBadge value={order.accessCode.status} />
            ) : null}
          </div>

          {order.accessCode && accessCode ? (
            <>
              <p className="mono mt-5 break-all text-[20px] text-ink">
                {accessCode}
              </p>
              <dl className="mt-5 space-y-3 border-t border-line pt-4 text-[13px]">
                <div className="flex justify-between gap-4">
                  <dt className="text-muted">Dibuat</dt>
                  <dd className="text-ink-2">
                    {formatDate(order.accessCode.createdAt)}
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted">Kedaluwarsa</dt>
                  <dd className="text-ink-2">
                    {formatDate(order.accessCode.expiresAt)}
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted">Diredeem</dt>
                  <dd className="text-ink-2">
                    {formatDate(order.accessCode.redeemedAt)}
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-muted">Discord ID</dt>
                  <dd className="mono break-all text-right text-ink-2">
                    {order.accessCode.redeemedByDiscordId ?? "-"}
                  </dd>
                </div>
              </dl>

              <div className="mt-6 flex flex-wrap gap-3">
                {order.status === "paid" ? (
                  <form action={resendAccessCodeAction}>
                    <input
                      type="hidden"
                      name="orderId"
                      value={order.id.toString()}
                    />
                    <Button type="submit" variant="secondary">
                      Kirim ulang email
                    </Button>
                  </form>
                ) : null}

                {order.accessCode.status !== "revoked" ? (
                  <form action={revokeCodeAction}>
                    <input
                      type="hidden"
                      name="accessCodeId"
                      value={order.accessCode.id.toString()}
                    />
                    <ConfirmSubmit message="Cabut kode ini? Member yang sudah redeem akan kehilangan akses dan role Discord-nya.">
                      Cabut kode
                    </ConfirmSubmit>
                  </form>
                ) : null}
              </div>
            </>
          ) : (
            <p className="mt-5 text-[14px] text-muted">
              Kode akses belum dibuat. Kode otomatis dibuat setelah pembayaran
              lunas.
            </p>
          )}
        </section>
      </div>

      <section className="card p-6">
        <h2 className="text-[16px] font-semibold text-ink">Member</h2>
        {order.accessCode?.member ? (
          <dl className="mt-5 grid gap-4 text-[14px] sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <dt className="text-muted">Discord ID</dt>
              <dd className="mono mt-1 break-all text-ink">
                {order.accessCode.member.discordUserId}
              </dd>
            </div>
            <div>
              <dt className="text-muted">Status</dt>
              <dd className="mt-1">
                <StatusBadge value={order.accessCode.member.status} />
              </dd>
            </div>
            <div>
              <dt className="text-muted">Role</dt>
              <dd className="mt-1">
                <StatusBadge value={order.accessCode.member.roleStatus} />
              </dd>
            </div>
            <div>
              <dt className="text-muted">Akses sampai</dt>
              <dd className="mt-1 text-ink-2">
                {formatDate(order.accessCode.member.accessUntil)}
              </dd>
            </div>
          </dl>
        ) : (
          <p className="mt-4 text-[14px] text-muted">
            Belum ada member yang redeem kode ini.
          </p>
        )}
      </section>

      <section className="card overflow-x-auto">
        <h2 className="border-b border-line px-6 py-4 text-[16px] font-semibold text-ink">
          Pembayaran
        </h2>
        {order.payments.length === 0 ? (
          <p className="px-6 py-6 text-[14px] text-muted">
            Belum ada catatan pembayaran.
          </p>
        ) : (
          <table className="w-full min-w-[640px] border-collapse text-left text-[13px]">
            <thead>
              <tr className="type-label">
                <th className="border-b border-line px-6 py-3 font-medium">
                  Provider ref
                </th>
                <th className="border-b border-line px-3 py-3 font-medium">
                  Metode
                </th>
                <th className="border-b border-line px-3 py-3 font-medium">
                  Status
                </th>
                <th className="border-b border-line px-6 py-3 font-medium">
                  Waktu
                </th>
              </tr>
            </thead>
            <tbody>
              {order.payments.map((payment) => (
                <tr key={payment.id.toString()}>
                  <td className="mono border-b border-line/60 px-6 py-3 align-top break-all text-ink-2">
                    {payment.providerRef}
                  </td>
                  <td className="border-b border-line/60 px-3 py-3 align-top text-ink-2">
                    {payment.method}
                  </td>
                  <td className="border-b border-line/60 px-3 py-3 align-top">
                    <StatusBadge value={payment.status} />
                  </td>
                  <td className="border-b border-line/60 px-6 py-3 align-top text-muted">
                    {formatDate(payment.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
