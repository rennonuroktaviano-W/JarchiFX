import type { Metadata } from "next";
import Link from "next/link";
import type { Prisma } from "@/generated/prisma/client";
import { StatusBadge } from "@/components/admin/status-badge";
import { formatDate, formatRupiah } from "@/lib/format";
import { requireAdmin } from "@/lib/auth/admin-session";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Order",
  robots: { index: false, follow: false },
};

const statuses = [
  "pending",
  "paid",
  "expired",
  "failed",
  "refunded",
] as const;

type OrderStatus = (typeof statuses)[number];

const statusLabels: Record<OrderStatus, string> = {
  pending: "Menunggu",
  paid: "Lunas",
  expired: "Kedaluwarsa",
  failed: "Gagal",
  refunded: "Refund",
};

type OrdersPageProps = {
  searchParams: Promise<{ status?: string; q?: string }>;
};

function isOrderStatus(value: string | undefined): value is OrderStatus {
  return Boolean(value && statuses.includes(value as OrderStatus));
}

export default async function AdminOrdersPage({
  searchParams,
}: OrdersPageProps) {
  await requireAdmin();
  const { status, q } = await searchParams;
  const activeStatus = isOrderStatus(status) ? status : undefined;
  const query = (q ?? "").trim();

  const where: Prisma.OrderWhereInput = {};

  if (activeStatus) {
    where.status = activeStatus;
  }

  if (query) {
    where.OR = [
      { orderCode: { contains: query } },
      { buyerName: { contains: query } },
      { buyerEmail: { contains: query } },
    ];
  }

  const orders = await prisma.order.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 100,
    include: { class: true, accessCode: true },
  });

  function filterHref(nextStatus?: OrderStatus) {
    const params = new URLSearchParams();

    if (nextStatus) {
      params.set("status", nextStatus);
    }

    if (query) {
      params.set("q", query);
    }

    const suffix = params.toString();

    return `/admin/orders${suffix ? `?${suffix}` : ""}`;
  }

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="type-label">Admin</p>
          <h1 className="type-h2 mt-2 text-ink">Order</h1>
          <p className="mt-2 text-[14px] text-muted">
            {orders.length} order ditampilkan, maksimal 100 terbaru.
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
            placeholder="Cari kode, nama, email"
            className="field-input"
            aria-label="Cari order"
          />
          <button
            type="submit"
            className="min-h-11 shrink-0 rounded-[6px] border border-line bg-surface px-4 text-[14px] font-semibold text-ink transition-colors duration-150 ease-out hover:border-ink-2/60"
          >
            Cari
          </button>
        </form>
      </header>

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
        {orders.length === 0 ? (
          <p className="px-5 py-10 text-[14px] text-muted">
            Tidak ada order yang cocok.
          </p>
        ) : (
          <table className="w-full min-w-[860px] border-collapse text-left text-[14px]">
            <thead>
              <tr className="type-label">
                <th className="border-b border-line px-5 py-3 font-medium">
                  Order
                </th>
                <th className="border-b border-line px-3 py-3 font-medium">
                  Pembeli
                </th>
                <th className="border-b border-line px-3 py-3 font-medium">
                  Paket
                </th>
                <th className="border-b border-line px-3 py-3 text-right font-medium">
                  Jumlah
                </th>
                <th className="border-b border-line px-3 py-3 font-medium">
                  Status
                </th>
                <th className="border-b border-line px-3 py-3 font-medium">
                  Kode
                </th>
                <th className="border-b border-line px-5 py-3 font-medium">
                  Dibuat
                </th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr
                  key={order.id.toString()}
                  className="transition-colors duration-150 ease-out hover:bg-raised/60"
                >
                  <td className="border-b border-line/60 px-5 py-3 align-top">
                    <Link
                      href={`/admin/orders/${order.id}`}
                      className="mono break-all text-[12px] text-ink-2 hover:text-ink"
                    >
                      {order.orderCode}
                    </Link>
                  </td>
                  <td className="border-b border-line/60 px-3 py-3 align-top">
                    <p className="text-ink">{order.buyerName}</p>
                    <p className="mt-0.5 break-all text-[12px] text-muted">
                      {order.buyerEmail}
                    </p>
                  </td>
                  <td className="border-b border-line/60 px-3 py-3 align-top text-ink-2">
                    {order.class.name}
                  </td>
                  <td className="mono border-b border-line/60 px-3 py-3 text-right align-top text-ink">
                    {formatRupiah(order.amount)}
                  </td>
                  <td className="border-b border-line/60 px-3 py-3 align-top">
                    <StatusBadge value={order.status} />
                  </td>
                  <td className="border-b border-line/60 px-3 py-3 align-top">
                    {order.accessCode ? (
                      <StatusBadge value={order.accessCode.status} />
                    ) : (
                      <span className="text-[12px] text-muted">-</span>
                    )}
                  </td>
                  <td className="border-b border-line/60 px-5 py-3 align-top text-[12px] text-muted">
                    {formatDate(order.createdAt)}
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
