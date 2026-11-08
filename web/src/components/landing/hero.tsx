import { hero } from "@/content/landing";
import { formatRupiah } from "@/lib/format";
import { ButtonLink } from "@/components/ui/button";
import { HeroBackdrop } from "./hero-backdrop";

export function Hero({ lowestPrice }: { lowestPrice?: number }) {
  const ctaLabel = lowestPrice
    ? `${hero.cta} · ${formatRupiah(lowestPrice)}`
    : hero.cta;

  return (
    <section id="hero" aria-labelledby="hero-title" className="hero">
      <HeroBackdrop />
      <div className="hero-content">
        <div className="hero-copy">
          <p className="type-label">{hero.label}</p>
          <h1 id="hero-title" className="type-h1 mt-6 text-ink">
            {hero.headline}
          </h1>
          <p className="type-body mt-6 max-w-xl">{hero.description}</p>
          <div className="mt-8">
            <ButtonLink href="#paket">{ctaLabel}</ButtonLink>
          </div>
        </div>
        <div className="hero-steps" aria-label="Tiga langkah akses kelas">
          {hero.steps.map((step) => (
            <p key={step.number} className="type-label flex items-center gap-2">
              <span className="mono text-accent">{step.number}</span>
              <span>{step.label}</span>
            </p>
          ))}
        </div>
      </div>
    </section>
  );
}
