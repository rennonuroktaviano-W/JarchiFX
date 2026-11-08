"use client";

import { useActionState, useState } from "react";
import { checkoutAction, type CheckoutState } from "./actions";
import { Button } from "@/components/ui/button";
import { formatRupiah } from "@/lib/format";

type PackageOption = {
  slug: string;
  name: string;
  price: number;
  accessDays: number | null;
};

const initialState: CheckoutState = {};

export function CheckoutForm({
  packages,
  defaultSlug,
}: {
  packages: PackageOption[];
  defaultSlug?: string;
}) {
  const [state, formAction, pending] = useActionState(
    checkoutAction,
    initialState,
  );
  const [selected, setSelected] = useState(
    defaultSlug && packages.some((item) => item.slug === defaultSlug)
      ? defaultSlug
      : packages[0]?.slug ?? "",
  );

  const selectedPackage = packages.find((item) => item.slug === selected);

  return (
    <form action={formAction} className="space-y-8">
      <fieldset>
        <legend className="type-h3 text-ink">Pilih paket</legend>
        <div className="mt-4 space-y-3">
          {packages.map((item) => (
            <label
              key={item.slug}
              className={`card flex cursor-pointer items-start gap-4 p-4 transition-colors duration-150 ease-out ${
                selected === item.slug ? "border-accent" : ""
              }`}
            >
              <input
                type="radio"
                name="classSlug"
                value={item.slug}
                checked={selected === item.slug}
                onChange={() => setSelected(item.slug)}
                className="mt-1 h-4 w-4 accent-[var(--accent)]"
              />
              <span className="flex-1">
                <span className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="text-[16px] font-semibold text-ink">
                    {item.name}
                  </span>
                  <span className="mono text-[15px] text-ink">
                    {formatRupiah(item.price)}
                  </span>
                </span>
                <span className="type-label mt-1 block">
                  {item.accessDays
                    ? `Akses ${item.accessDays} hari`
                    : "Akses seumur hidup"}
                </span>
              </span>
            </label>
          ))}
        </div>
        {state.fieldErrors?.classSlug ? (
          <p className="field-error mt-2">{state.fieldErrors.classSlug}</p>
        ) : null}
      </fieldset>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label htmlFor="name" className="field-label">
            Nama lengkap
          </label>
          <input
            id="name"
            name="name"
            type="text"
            autoComplete="name"
            required
            className="field-input"
            placeholder="Nama sesuai data pembayaran"
          />
          {state.fieldErrors?.name ? (
            <p className="field-error mt-2">{state.fieldErrors.name}</p>
          ) : null}
        </div>
        <div>
          <label htmlFor="email" className="field-label">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            className="field-input"
            placeholder="nama@email.com"
          />
          {state.fieldErrors?.email ? (
            <p className="field-error mt-2">{state.fieldErrors.email}</p>
          ) : null}
        </div>
        <div>
          <label htmlFor="whatsapp" className="field-label">
            Nomor WhatsApp
          </label>
          <input
            id="whatsapp"
            name="whatsapp"
            type="tel"
            autoComplete="tel"
            required
            className="field-input"
            placeholder="08xxxxxxxxxx"
          />
          {state.fieldErrors?.whatsapp ? (
            <p className="field-error mt-2">{state.fieldErrors.whatsapp}</p>
          ) : null}
        </div>
      </div>

      <div className="border-t border-line pt-6">
        <div className="flex items-baseline justify-between gap-4">
          <p className="type-label">Total pembayaran</p>
          <p className="mono text-2xl text-ink">
            {selectedPackage
              ? formatRupiah(selectedPackage.price)
              : "Pilih paket"}
          </p>
        </div>
        <p className="type-label mt-2 text-[13px]">
          Jumlah akhir dihitung ulang di server saat order dibuat.
        </p>
      </div>

      {state.error ? (
        <p className="field-error" role="alert">
          {state.error}
        </p>
      ) : null}

      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Memproses..." : "Lanjut ke pembayaran"}
      </Button>
    </form>
  );
}
