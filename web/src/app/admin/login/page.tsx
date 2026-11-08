import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { brand } from "@/content/landing";
import { getAdminSession } from "@/lib/auth/admin-session";
import { loginAction } from "../actions";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Login Admin",
  robots: { index: false, follow: false },
};

type LoginPageProps = {
  searchParams: Promise<{ error?: string }>;
};

const errorMessages: Record<string, string> = {
  missing: "Email dan password wajib diisi.",
  invalid: "Email atau password salah.",
};

export default async function AdminLoginPage({
  searchParams,
}: LoginPageProps) {
  const session = await getAdminSession();

  if (session) {
    redirect("/admin");
  }

  const { error } = await searchParams;
  const message = error ? errorMessages[error] : null;

  return (
    <main id="main" className="grid min-h-screen place-items-center px-6 py-16">
      <div className="w-full max-w-sm">
        <Link
          href="/"
          className="text-[17px] font-semibold tracking-tight text-ink"
        >
          {brand.name}
        </Link>
        <p className="mono mt-1 text-[11px] uppercase tracking-[0.16em] text-muted">
          Admin Panel
        </p>

        <h1 className="type-h2 mt-10 text-ink">Masuk</h1>
        <p className="type-body mt-3 text-[15px]">
          Halaman internal untuk mengelola order, kode akses, dan member.
        </p>

        <form action={loginAction} className="card mt-8 space-y-5 p-6">
          {message ? (
            <p
              role="alert"
              className="rounded-[6px] border border-down/50 bg-down/10 px-4 py-3 text-[14px] text-down"
            >
              {message}
            </p>
          ) : null}

          <div>
            <label htmlFor="email" className="field-label">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="username"
              required
              className="field-input"
            />
          </div>

          <div>
            <label htmlFor="password" className="field-label">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className="field-input"
            />
          </div>

          <Button type="submit" className="w-full">
            Masuk
          </Button>
        </form>

        <p className="type-label mt-6 text-[12px]">
          Akses hanya untuk admin. Sesi berlaku 8 jam.
        </p>
      </div>
    </main>
  );
}
