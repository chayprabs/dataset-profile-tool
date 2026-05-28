import type { PropsWithChildren } from "react";

export function Panel({
  children,
  title
}: PropsWithChildren<{ title: string }>) {
  return (
    <section className="relative overflow-hidden rounded-[2rem] border border-[var(--border)] bg-[var(--panel)] p-6 shadow-[var(--shadow)] backdrop-blur">
      <div className="absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-white/90 to-transparent" />
      <div className="mb-5 flex items-center justify-between border-b border-[var(--border)] pb-4">
        <div>
          <p className="ui-kicker">Workspace</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-[-0.02em]">{title}</h2>
        </div>
      </div>
      {children}
    </section>
  );
}
