import { prisma } from "@/lib/prisma";
import { FloatingCta } from "@/components/landing/floating-cta";
import { Hero } from "@/components/landing/hero";
import { ScrollProgress } from "@/components/landing/scroll-progress";
import { SectionDots } from "@/components/landing/section-dots";
import {
  CommunitySection,
  CurriculumSection,
  FaqSection,
  HowItWorksSection,
  MentorSection,
  PackagesSection,
  ProblemSection,
} from "@/components/landing/sections";
import { SiteFooter } from "@/components/landing/site-footer";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const classes = await prisma.courseClass.findMany({
    where: { isActive: true },
    orderBy: { price: "asc" },
    select: {
      name: true,
      slug: true,
      price: true,
      accessDays: true,
    },
  });

  return (
    <>
      <ScrollProgress />
      <FloatingCta label="Daftar Sekarang" />
      <SectionDots />
      <main id="main">
        <Hero lowestPrice={classes[0]?.price} />
        <ProblemSection />
        <CurriculumSection />
        <HowItWorksSection />
        <MentorSection />
        <CommunitySection />
        <PackagesSection items={classes} />
        <FaqSection />
      </main>
      <SiteFooter />
    </>
  );
}
