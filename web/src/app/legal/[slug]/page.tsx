import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { brand } from "@/content/landing";
import { legalDocuments } from "@/content/legal";

type LegalPageProps = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return Object.keys(legalDocuments).map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: LegalPageProps): Promise<Metadata> {
  const { slug } = await params;
  const document = legalDocuments[slug];

  if (!document) {
    return {};
  }

  return {
    title: document.title,
    description: document.description,
  };
}

export default async function LegalPage({ params }: LegalPageProps) {
  const { slug } = await params;
  const document = legalDocuments[slug];

  if (!document) {
    notFound();
  }

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
        <article className="mx-auto mt-16 max-w-3xl">
          <h1 className="type-h2 text-ink">{document.title}</h1>
          <p className="type-label mt-3">
            Diperbarui {document.updatedAt}
          </p>
          <div className="mt-12 space-y-10">
            {document.sections.map((section) => (
              <section key={section.heading}>
                <h2 className="type-h3 text-ink">{section.heading}</h2>
                <div className="mt-4 space-y-4">
                  {section.paragraphs.map((paragraph) => (
                    <p key={paragraph} className="type-body text-[16px]">
                      {paragraph}
                    </p>
                  ))}
                </div>
              </section>
            ))}
          </div>
        </article>
      </div>
    </main>
  );
}
