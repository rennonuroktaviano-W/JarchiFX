import type { ReactNode } from "react";

export function Notice({
  tone = "info",
  children,
}: {
  tone?: "info" | "success" | "error";
  children: ReactNode;
}) {
  const styles = {
    info: "border-line bg-surface text-ink-2",
    success: "border-accent/50 bg-accent/10 text-accent",
    error: "border-down/50 bg-down/10 text-down",
  };

  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={`rounded-[6px] border px-4 py-3 text-[14px] ${styles[tone]}`}
    >
      {children}
    </div>
  );
}
