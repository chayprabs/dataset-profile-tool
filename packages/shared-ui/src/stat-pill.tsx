export function StatPill({ label, value }: { label: string; value: string }) {
  return (
    <span className="inline-flex items-center gap-3 rounded-full border border-[var(--border)] bg-white/88 px-4 py-2 text-sm shadow-sm shadow-black/5">
      <strong className="text-[var(--accent-strong)]">{value}</strong>
      <span className="text-black/60">{label}</span>
    </span>
  );
}
