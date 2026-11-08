import Link from "next/link";
import type { ReactNode } from "react";
import { AdminNav } from "@/components/admin/admin-nav";
import { Button } from "@/components/ui/button";
import { brand } from "@/content/landing";
import { requireAdmin } from "@/lib/auth/admin-session";
import { logoutAction } from "../actions";

export const dynamic = "force-dynamic";

export const metadata = {
  robots: { index: false, follow: false },
};

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const admin = await requireAdmin();

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[232px_1fr]">
      <aside className="border-b border-line bg-raised lg:border-r lg:border-b-0">
        <div className="flex h-full flex-col gap-6 p-5 lg:sticky lg:top-0 lg:max-h-screen">
          <div>
            <Link
              href="/admin"
              className="text-[17px] font-semibold tracking-tight text-ink"
            >
              {brand.name}
            </Link>
            <p className="mono mt-1 text-[11px] uppercase tracking-[0.16em] text-muted">
              Admin Panel
            </p>
          </div>

          <AdminNav />

          <div className="mt-auto border-t border-line pt-4">
            <p className="text-[14px] font-medium text-ink">{admin.name}</p>
            <p className="mt-0.5 break-all text-[12px] text-muted">
              {admin.email}
            </p>
            <form action={logoutAction} className="mt-3">
              <Button type="submit" variant="ghost" className="px-0">
                Keluar
              </Button>
            </form>
          </div>
        </div>
      </aside>

      <main id="main" className="min-w-0 px-5 py-8 lg:px-10 lg:py-10">
        {children}
      </main>
    </div>
  );
}
