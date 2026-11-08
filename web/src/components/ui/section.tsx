import type { ReactNode } from "react";

type SectionProps = {
  id: string;
  labelledBy: string;
  raised?: boolean;
  className?: string;
  children: ReactNode;
};

export function Section({
  id,
  labelledBy,
  raised = false,
  className = "",
  children,
}: SectionProps) {
  return (
    <section
      id={id}
      aria-labelledby={labelledBy}
      className={`section-pad ${raised ? "bg-raised" : ""} ${className}`}
    >
      <div className="container-page">{children}</div>
    </section>
  );
}

type SectionHeaderProps = {
  id: string;
  title: string;
  description?: string;
  align?: "left" | "center";
};

export function SectionHeader({
  id,
  title,
  description,
  align = "left",
}: SectionHeaderProps) {
  return (
    <div
      className={`max-w-3xl ${align === "center" ? "mx-auto text-center" : ""}`}
    >
      <h2 id={id} className="type-h2 text-ink">
        {title}
      </h2>
      {description ? (
        <p className="type-body mt-4 max-w-2xl">{description}</p>
      ) : null}
    </div>
  );
}
