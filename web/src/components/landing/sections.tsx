import {
  community,
  curriculum,
  faq,
  howItWorks,
  mentor,
  packages,
  problem,
} from "@/content/landing";
import { formatRupiah } from "@/lib/format";
import { ButtonLink } from "@/components/ui/button";
import { Section, SectionHeader } from "@/components/ui/section";
import { Reveal } from "./reveal";

export type PackageCard = {
  name: string;
  slug: string;
  price: number;
  accessDays: number | null;
};

export function ProblemSection() {
  return (
    <Section id="masalah" labelledBy="masalah-title" raised>
      <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
        <Reveal>
          <h2 id="masalah-title" className="type-h2 max-w-md text-ink">
            {problem.title}
          </h2>
        </Reveal>
        <div className="space-y-5">
          {problem.paragraphs.map((paragraph) => (
            <p key={paragraph} className="type-body max-w-2xl">
              {paragraph}
            </p>
          ))}
        </div>
      </div>
    </Section>
  );
}

export function CurriculumSection() {
  return (
    <Section id="kurikulum" labelledBy="kurikulum-title">
      <Reveal>
        <SectionHeader
          id="kurikulum-title"
          title={curriculum.title}
          description={curriculum.description}
        />
      </Reveal>
      <div className="mt-12 border-t border-line">
        {curriculum.modules.map((module, index) => (
          <details
            key={module.number}
            open={index === 0}
            className="group border-b border-line"
          >
            <summary className="flex items-center gap-5 py-6">
              <span className="mono text-sm text-accent">{module.number}</span>
              <span className="type-h3 flex-1 text-ink">{module.title}</span>
              <span
                className="accordion-mark mono text-xl text-muted"
                aria-hidden="true"
              >
                +
              </span>
            </summary>
            <p className="type-body max-w-3xl pb-6 pl-11">{module.body}</p>
          </details>
        ))}
      </div>
    </Section>
  );
}

export function HowItWorksSection() {
  return (
    <Section id="cara-kerja" labelledBy="cara-kerja-title" raised>
      <Reveal>
        <SectionHeader
          id="cara-kerja-title"
          title={howItWorks.title}
          description={howItWorks.description}
        />
      </Reveal>
      <div className="mt-12 grid gap-10 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="grid gap-8 sm:grid-cols-3">
          {howItWorks.steps.map((step) => (
            <div key={step.number} className="border-t border-line pt-6">
              <p className="mono text-sm text-accent">{step.number}</p>
              <h3 className="type-h3 mt-3 text-ink">{step.title}</h3>
              <p className="type-body mt-3 text-[15px] leading-relaxed">
                {step.body}
              </p>
            </div>
          ))}
        </div>
        <div className="space-y-4">
          <div className="card p-6">
            <p className="type-label">Contoh kode akses</p>
            <p className="mono mt-3 text-xl text-ink">
              {howItWorks.codeSample}
            </p>
            <p className="type-body mt-3 text-[14px]">
              Kode tampil sekali di halaman order dan dikirim ke email.
            </p>
          </div>
          <div className="card p-6">
            <p className="type-label">Di Discord</p>
            <div className="mono mt-4 space-y-3 text-[13px] leading-relaxed">
              <p className="text-ink">
                <span className="text-muted">you </span>
                {howItWorks.discord.command}
              </p>
              <p className="text-ink-2">
                <span className="text-accent">bot </span>
                {howItWorks.discord.reply}
              </p>
            </div>
          </div>
        </div>
      </div>
    </Section>
  );
}

export function MentorSection() {
  return (
    <Section id="mentor" labelledBy="mentor-title">
      <Reveal>
        <SectionHeader id="mentor-title" title={mentor.title} />
      </Reveal>
      <div className="mt-12 grid gap-10 md:grid-cols-[280px_1fr] md:gap-14">
        <div className="card mono flex aspect-[4/5] max-w-[280px] items-center justify-center text-sm text-muted">
          [ISI]
        </div>
        <div>
          <h3 className="type-h3 text-ink">{mentor.name}</h3>
          <p className="type-label mt-2">{mentor.role}</p>
          <p className="type-body mt-6 max-w-2xl">{mentor.bio}</p>
          <ul className="mt-6 space-y-2">
            {mentor.experience.map((item) => (
              <li
                key={item}
                className="type-body flex gap-3 text-[15px] leading-relaxed"
              >
                <span className="mt-2 block h-px w-4 shrink-0 bg-muted" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Section>
  );
}

export function CommunitySection() {
  return (
    <Section id="komunitas" labelledBy="komunitas-title" raised>
      <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
        <Reveal>
          <SectionHeader
            id="komunitas-title"
            title={community.title}
            description={community.description}
          />
        </Reveal>
        <div className="card p-6 lg:p-8">
          <ul className="mono grid gap-x-8 gap-y-4 text-[15px] text-ink-2 sm:grid-cols-2">
            {community.channels.map((channel) => (
              <li key={channel}>{channel}</li>
            ))}
          </ul>
        </div>
      </div>
    </Section>
  );
}

export function PackagesSection({ items }: { items: PackageCard[] }) {
  return (
    <Section id="paket" labelledBy="paket-title">
      <Reveal>
        <SectionHeader
          id="paket-title"
          title={packages.title}
          description={packages.description}
        />
      </Reveal>
      <div className="mt-12 grid gap-6 md:grid-cols-2">
        {items.map((item) => {
          const copy =
            packages.copy[item.slug as keyof typeof packages.copy] ?? {
              description: "Akses kelas sesuai paket yang dipilih.",
              features: ["Akses channel kelas", "Sesi tanya jawab"],
            };
          const featured = item.slug === packages.featuredSlug;

          return (
            <article
              key={item.slug}
              className={`card flex flex-col p-6 lg:p-8 ${
                featured ? "border-accent" : ""
              }`}
            >
              <h3 className="type-h3 text-ink">{item.name}</h3>
              <p className="type-body mt-3 text-[15px]">{copy.description}</p>
              <p className="mono mt-8 text-3xl text-ink">
                {formatRupiah(item.price)}
              </p>
              <p className="type-label mt-2">
                {item.accessDays
                  ? `Akses ${item.accessDays} hari`
                  : "Akses seumur hidup"}
              </p>
              <ul className="mt-6 flex-1 space-y-3">
                {copy.features.map((feature) => (
                  <li
                    key={feature}
                    className="type-body flex gap-3 text-[15px] leading-relaxed"
                  >
                    <span className="mt-2 block h-px w-4 shrink-0 bg-muted" />
                    {feature}
                  </li>
                ))}
              </ul>
              <ButtonLink
                href={`/checkout?class=${item.slug}`}
                variant={featured ? "primary" : "secondary"}
                className="mt-8 w-full"
              >
                {packages.cta}
              </ButtonLink>
            </article>
          );
        })}
      </div>
    </Section>
  );
}

export function FaqSection() {
  return (
    <Section id="faq" labelledBy="faq-title" raised>
      <Reveal>
        <SectionHeader id="faq-title" title={faq.title} />
      </Reveal>
      <div className="mt-12 border-t border-line">
        {faq.items.map((item) => (
          <details key={item.question} className="border-b border-line">
            <summary className="flex items-center gap-5 py-6">
              <h3 className="type-h3 flex-1 text-ink">{item.question}</h3>
              <span
                className="accordion-mark mono text-xl text-muted"
                aria-hidden="true"
              >
                +
              </span>
            </summary>
            <p className="type-body max-w-3xl pb-6">{item.answer}</p>
          </details>
        ))}
      </div>
    </Section>
  );
}
