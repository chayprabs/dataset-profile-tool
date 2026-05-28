export function StatPill({ label, value }: { label: string; value: string }) {
  return (
    <span className="rounded-full border border-[var(--border)] bg-white/80 px-4 py-2 text-sm">
      <strong>{value}</strong> {label}
    </span>
  );
}
