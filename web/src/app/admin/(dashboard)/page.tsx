import type { Metadata } from "next";
import Link from "next/link";
import { StatusBadge } from "@/components/admin/status-badge";
import { formatDate, formatRupiah } from "@/lib/format";
import { requireAdmin } from "@/lib/auth/admin-session";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Ringkasan Admin",
  robots: { index: false, follow: false },
};

function dayKey(date: Date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function getDayWindow() {
  const now = Date.now();
  const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(now - (6 - index) * 24 * 60 * 60 * 1000);

    return {
      key: dayKey(date),
      label: new Intl.DateTimeFormat("id-ID", {
        weekday: "short",
        day: "numeric",
        month: "short",
        timeZone: "Asia/Jakarta",
      }).format(date),
      count: 0,
    };
  });

  return { sevenDaysAgo, days };
}

export default async function AdminDashboardPage() {
  await requireAdmin();
  const { sevenDaysAgo, days } = getDayWindow();

  const [
    sales,
    paidOrders,
    pendingOrders,
    unredeemedCodes,
    activeMembers,
    pendingRoles,
    recentOrders,
    redemptions,
  ] = await Promise.all([
    prisma.order.aggregate({
      where: { status: "paid" },
      _sum: { amount: true },
    }),
    prisma.order.count({ where: { status: "paid" } }),
    prisma.order.count({ where: { status: "pending" } }),
    prisma.accessCode.count({
      where: { status: "active", order: { status: "paid" } },
    }),
    prisma.member.count({ where: { status: "active" } }),
    prisma.member.count({ where: { roleStatus: "pending" } }),
    prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      take: 6,
      include: { class: true, accessCode: true },
    }),
    prisma.accessCode.findMany({
      where: { redeemedAt: { gte: sevenDaysAgo } },
      select: { redeemedAt: true },
    }),
  ]);

  for (const redemption of redemptions) {
    if (!redemption.redeemedAt) {
      continue;
    }

    const target = days.find((day) => day.key === dayKey(redemption.redeemedAt!));

    if (target) {
      target.count += 1;
    }
  }

  const maxDaily = Math.max(1, ...days.map((day) => day.count));

  const stats = [
    {
      label: "Total penjualan",
      value: formatRupiah(sales._sum.amount ?? 0),
      detail: `${paidOrders} order lunas`,
    },
    {
      label: "Kode belum diredeem",
      value: unredeemedCodes.toString(),
      detail: `${pendingOrders} order menunggu bayar`,
    },
    {
      label: "Member aktif",
      value: activeMembers.toString(),
      detail: `${pendingRoles} role pending`,
    },
    {
      label: "Redeem 7 hari",
      value: redemptions.length.toString(),
      detail: "total percobaan sukses",
    },
  ];

  return (
    <div className="space-y-10">
      <header>
        <p className="type-label">Admin</p>
        <h1 className="type-h2 mt-2 text-ink">Ringkasan</h1>
        <p className="type-body mt-3 max-w-2xl text-[15px]">
          Pantau penjualan, kode akses, dan status redeem terbaru.
        </p>
      </header>

      <section
        aria-label="Statistik"
        className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        {stats.map((stat) => (
          <div key={stat.label} className="card p-5">
            <p className="type-label">{stat.label}</p>
            <p className="mono mt-3 text-[24px] leading-tight text-ink">
              {stat.value}
            </p>
            <p className="mt-2 text-[13px] text-muted">{stat.detail}</p>
          </div>
        ))}
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <section className="card overflow-hidden">
          <div className="flex items-center justify-between gap-4 border-b border-line px-5 py-4">
            <h2 className="text-[16px] font-semibold text-ink">Order terbaru</h2>
            <Link
              href="/admin/orders"
              className="text-[13px] font-medium text-ink-2 transition-colors duration-150 ease-out hover:text-ink"
            >
              Lihat semua
            </Link>
          </div>

          {recentOrders.length === 0 ? (
            <p className="px-5 py-8 text-[14px] text-muted">Belum ada order.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-[14px]">
                <thead>
                  <tr className="type-label">
                    <th className="border-b border-line px-5 py-3 font-medium">
                      Order
                    </th>
                    <th className="border-b border-line px-3 py-3 font-medium">
                      Paket
                    </th>
                    <th className="border-b border-line px-3 py-3 font-medium">
                      Status
                    </th>
                    <th className="border-b border-line px-5 py-3 text-right font-medium">
                      Jumlah
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((order) => (
                    <tr key={order.id.toString()}>
                      <td className="border-b border-line/60 px-5 py-3 align-top">
                        <Link
                          href={`/admin/orders/${order.id}`}
                          className="mono break-all text-[12px] text-ink-2 hover:text-ink"
                        >
                          {order.orderCode}
                        </Link>
                        <p className="mt-1 text-[12px] text-muted">
                          {formatDate(order.createdAt)}
                        </p>
                      </td>
                      <td className="border-b border-line/60 px-3 py-3 align-top text-ink-2">
                        {order.class.name}
                      </td>
                      <td className="border-b border-line/60 px-3 py-3 align-top">
                        <StatusBadge value={order.status} />
                      </td>
                      <td className="mono border-b border-line/60 px-5 py-3 text-right align-top text-ink">
                        {formatRupiah(order.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="card p-5">
          <h2 className="text-[16px] font-semibold text-ink">
            Redeem 7 hari terakhir
          </h2>
          <p className="mt-1 text-[13px] text-muted">
            Kode yang berhasil diaktifkan per hari.
          </p>

          <div className="mt-6 space-y-3">
            {days.map((day) => (
              <div key={day.key} className="flex items-center gap-3">
                <span className="w-16 shrink-0 text-[12px] text-muted">
                  {day.label}
                </span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-raised">
                  <div
                    className="h-full rounded-full bg-accent"
                    style={{
                      width: `${Math.max(
                        day.count > 0 ? 8 : 0,
                        (day.count / maxDaily) * 100,
                      )}%`,
                    }}
                  />
                </div>
                <span className="mono w-5 text-right text-[12px] text-ink-2">
                  {day.count}
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
