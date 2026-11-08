import type { Metadata } from "next";
import { Notice } from "@/components/admin/notice";
import { Button } from "@/components/ui/button";
import { formatRupiah } from "@/lib/format";
import { requireAdmin } from "@/lib/auth/admin-session";
import { prisma } from "@/lib/prisma";
import { updateClassAction } from "../../actions";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Kelas",
  robots: { index: false, follow: false },
};

type ClassesPageProps = {
  searchParams: Promise<{ saved?: string; error?: string }>;
};

export default async function AdminClassesPage({
  searchParams,
}: ClassesPageProps) {
  await requireAdmin();
  const params = await searchParams;
  const savedId = params.saved ? Number.parseInt(params.saved, 10) : null;

  const classes = await prisma.courseClass.findMany({
    orderBy: { price: "asc" },
  });

  return (
    <div className="space-y-8">
      <header>
        <p className="type-label">Admin</p>
        <h1 className="type-h2 mt-2 text-ink">Paket kelas</h1>
        <p className="mt-2 max-w-2xl text-[14px] text-muted">
          Atur nama, harga, durasi akses, dan role Discord. Perubahan langsung
          dipakai untuk checkout dan redeem berikutnya.
        </p>
      </header>

      {params.error ? (
        <Notice tone="error">
          Perubahan gagal disimpan. Pastikan nama, harga, dan durasi valid.
        </Notice>
      ) : null}

      {savedId && Number.isInteger(savedId) ? (
        <Notice tone="success">Paket berhasil diperbarui.</Notice>
      ) : null}

      <div className="grid gap-5 xl:grid-cols-2">
        {classes.map((courseClass) => (
          <form
            key={courseClass.id}
            action={updateClassAction}
            className="card p-5"
          >
            <input
              type="hidden"
              name="classId"
              value={courseClass.id.toString()}
            />

            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-[17px] font-semibold text-ink">
                  {courseClass.name}
                </h2>
                <p className="mono mt-1 text-[12px] text-muted">
                  {courseClass.slug}
                </p>
              </div>
              <span className="mono text-[13px] text-ink-2">
                {formatRupiah(courseClass.price)}
              </span>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor={`class-${courseClass.id}-name`}
                  className="field-label"
                >
                  Nama
                </label>
                <input
                  id={`class-${courseClass.id}-name`}
                  name="name"
                  type="text"
                  required
                  maxLength={120}
                  defaultValue={courseClass.name}
                  className="field-input"
                />
              </div>

              <div>
                <label
                  htmlFor={`class-${courseClass.id}-price`}
                  className="field-label"
                >
                  Harga (Rupiah)
                </label>
                <input
                  id={`class-${courseClass.id}-price`}
                  name="price"
                  type="number"
                  required
                  min={1}
                  step={1000}
                  defaultValue={courseClass.price}
                  className="field-input"
                />
              </div>

              <div>
                <label
                  htmlFor={`class-${courseClass.id}-days`}
                  className="field-label"
                >
                  Durasi akses (hari)
                </label>
                <input
                  id={`class-${courseClass.id}-days`}
                  name="accessDays"
                  type="number"
                  min={1}
                  step={1}
                  defaultValue={courseClass.accessDays ?? ""}
                  placeholder="Kosongkan untuk seumur hidup"
                  className="field-input"
                />
              </div>

              <div>
                <label
                  htmlFor={`class-${courseClass.id}-role`}
                  className="field-label"
                >
                  Discord role ID
                </label>
                <input
                  id={`class-${courseClass.id}-role`}
                  name="discordRoleId"
                  type="text"
                  maxLength={30}
                  defaultValue={courseClass.discordRoleId}
                  placeholder="Contoh: 123456789012345678"
                  className="field-input"
                />
              </div>
            </div>

            {!courseClass.discordRoleId ? (
              <p className="mt-3 text-[12px] text-down">
                Role Discord belum diisi. Redeem akan tetap berhasil tanpa
                memberi role.
              </p>
            ) : null}

            <div className="mt-5 flex flex-wrap items-center justify-between gap-4 border-t border-line pt-4">
              <label className="flex items-center gap-2 text-[14px] text-ink-2">
                <input
                  type="checkbox"
                  name="isActive"
                  defaultChecked={courseClass.isActive}
                  className="h-4 w-4 accent-[var(--accent)]"
                />
                Tampil di landing dan checkout
              </label>

              <Button type="submit" variant="secondary">
                Simpan
              </Button>
            </div>
          </form>
        ))}
      </div>
    </div>
  );
}
