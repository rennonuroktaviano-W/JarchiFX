import Link from "next/link";
import { brand, footer } from "@/content/landing";

export function SiteFooter() {
  return (
    <footer className="border-t border-line bg-base">
      <div className="container-page py-12 pb-28 lg:py-16">
        <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-[15px] font-semibold text-ink">{brand.name}</p>
            <p className="type-label mt-2">{brand.tagline}</p>
          </div>
          <nav
            aria-label="Tautan footer"
            className="flex flex-col gap-3 text-[14px] md:flex-row md:flex-wrap md:gap-x-8"
          >
            {footer.links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-ink-2 transition-colors duration-150 ease-out hover:text-ink"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
        <p className="type-label mt-10 max-w-3xl text-[13px] leading-relaxed">
          {footer.disclaimer}
        </p>
        <p className="type-label mt-6 text-[13px]">
          {new Date().getFullYear()} {brand.name}
        </p>
      </div>
    </footer>
  );
}
