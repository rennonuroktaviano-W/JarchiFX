import type { Metadata } from "next";
import Link from "next/link";
import { brand } from "@/content/landing";
import { prisma } from "@/lib/prisma";
import { CheckoutForm } from "./checkout-form";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Checkout",
  description: "Isi data pendaftaran dan pilih paket kelas.",
};

type CheckoutPageProps = {
  searchParams: Promise<{ class?: string }>;
};

export default async function CheckoutPage({
  searchParams,
}: CheckoutPageProps) {
  const { class: classSlug } = await searchParams;
  const packages = await prisma.courseClass.findMany({
    where: { isActive: true },
    orderBy: { price: "asc" },
    select: {
      slug: true,
      name: true,
      price: true,
      accessDays: true,
    },
  });

  return (
    <main id="main" className="min-h-screen">
      <div className="container-page py-10 lg:py-16">
        <div className="flex items-center justify-between gap-6">
          <Link
            href="/#paket"
            className="type-label transition-colors duration-150 ease-out hover:text-ink"
          >
            Kembali
          </Link>
          <p className="type-label">{brand.name}</p>
        </div>

        <div className="mx-auto mt-12 max-w-4xl">
          <h1 className="type-h2 text-ink">Pendaftaran</h1>
          <p className="type-body mt-4 max-w-2xl">
            Isi data pembeli. Setelah order dibuat, kamu akan diarahkan ke
            halaman pembayaran.
          </p>

          <div className="mt-10">
            {packages.length > 0 ? (
              <CheckoutForm packages={packages} defaultSlug={classSlug} />
            ) : (
              <p className="type-body">
                Belum ada paket aktif. Hubungi admin untuk informasi.
              </p>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
