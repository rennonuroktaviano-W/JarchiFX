import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { brand } from "@/content/landing";
import { formatDate, formatRupiah } from "@/lib/format";
import { getOrderByCode } from "@/lib/services/order-service";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Status Order",
  robots: { index: false, follow: false },
};

type OrderPageProps = {
  params: Promise<{ orderCode: string }>;
};

const statusLabels: Record<string, string> = {
  pending: "Menunggu pembayaran",
  paid: "Pembayaran terverifikasi",
  expired: "Kedaluwarsa",
  failed: "Pembayaran gagal",
  refunded: "Dana dikembalikan",
};

const paymentStatusLabels: Record<string, string> = {
  pending: "Menunggu",
  paid: "Berhasil",
  failed: "Gagal",
  expired: "Kedaluwarsa",
  refunded: "Refund",
};

export default async function OrderPage({ params }: OrderPageProps) {
  const { orderCode } = await params;
  const order = await getOrderByCode(orderCode);

  if (!order) {
    notFound();
  }

  const latestPayment = order.payments[0];
  const isPending = order.status === "pending";

  return (
    <main id="main" className="min-h-screen">
      <div className="container-page py-10 lg:py-16">
        <div className="flex items-center justify-between gap-6">
          <Link
            href="/"
            className="type-label transition-colors duration-150 ease-out hover:text-ink"
          >
            Kembali
          </Link>
          <p className="type-label">{brand.name}</p>
        </div>

        <div className="mx-auto mt-12 max-w-2xl">
          <p className="type-label">Kode order</p>
          <h1 className="mono mt-2 break-all text-2xl text-ink">
            {order.orderCode}
          </h1>

          <div className="card mt-8 p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="type-label">Status</p>
                <p className="mt-2 text-[17px] font-semibold text-ink">
                  {statusLabels[order.status] ?? order.status}
                </p>
              </div>
              <span
                className={`mono rounded-[6px] border px-3 py-1 text-[12px] ${
                  order.status === "paid"
                    ? "border-accent text-accent"
                    : "border-line text-muted"
                }`}
              >
                {order.status}
              </span>
            </div>

            <dl className="mt-8 space-y-4 border-t border-line pt-6 text-[15px]">
              <div className="flex justify-between gap-6">
                <dt className="text-muted">Paket</dt>
                <dd className="text-right text-ink">{order.class.name}</dd>
              </div>
              <div className="flex justify-between gap-6">
                <dt className="text-muted">Jumlah</dt>
                <dd className="mono text-right text-ink">
                  {formatRupiah(order.amount)}
                </dd>
              </div>
              <div className="flex justify-between gap-6">
                <dt className="text-muted">Dibuat</dt>
                <dd className="text-right text-ink-2">
                  {formatDate(order.createdAt)}
                </dd>
              </div>
              {latestPayment ? (
                <div className="flex justify-between gap-6">
                  <dt className="text-muted">Pembayaran</dt>
                  <dd className="text-right text-ink-2">
                    {paymentStatusLabels[latestPayment.status] ??
                      latestPayment.status}
                  </dd>
                </div>
              ) : null}
            </dl>
          </div>

          {isPending ? (
            <div className="card mt-6 p-6">
              <p className="type-h3 text-ink">Menunggu pembayaran</p>
              <p className="type-body mt-3 text-[15px]">
                Status diperbarui setelah pembayaran diverifikasi oleh payment
                gateway. Simpan kode order ini.
              </p>
            </div>
          ) : null}

          {order.status === "paid" ? (
            <div className="card mt-6 p-6">
              <p className="type-h3 text-ink">Pembayaran diterima</p>
              <p className="type-body mt-3 text-[15px]">
                Kode akses dan instruksi Discord tersedia di email yang kamu
                daftarkan.
              </p>
            </div>
          ) : null}

          {order.status === "expired" || order.status === "failed" ? (
            <div className="card mt-6 p-6">
              <p className="type-h3 text-ink">Order tidak aktif</p>
              <p className="type-body mt-3 text-[15px]">
                Silakan buat order baru dari halaman paket atau hubungi admin
                bila kamu sudah melakukan pembayaran.
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </main>
  );
}
