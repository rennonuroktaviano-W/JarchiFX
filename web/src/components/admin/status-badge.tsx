const positive = new Set(["paid", "active", "granted", "success", "ok"]);
const negative = new Set(["failed", "expired", "revoked", "refunded", "used"]);

export function StatusBadge({
  value,
  label,
}: {
  value: string;
  label?: string;
}) {
  const tone = positive.has(value)
    ? "border-accent/60 text-accent"
    : negative.has(value)
      ? "border-down/60 text-down"
      : "border-line text-ink-2";

  return (
    <span
      className={`mono inline-flex rounded-[5px] border px-2 py-0.5 text-[11px] uppercase tracking-wide ${tone}`}
    >
      {label ?? value}
    </span>
  );
}
