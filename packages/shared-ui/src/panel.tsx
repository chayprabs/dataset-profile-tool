import type { PropsWithChildren } from "react";

export function Panel({
  children,
  title
}: PropsWithChildren<{ title: string }>) {
  return (
    <section className="rounded-[2rem] border border-[var(--border)] bg-[var(--panel)] p-6 shadow-lg shadow-black/5 backdrop-blur">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold">{title}</h2>
      </div>
      {children}
    </section>
  );
}
