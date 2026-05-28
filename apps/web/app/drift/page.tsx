import Link from "next/link";

import { DriftPlayground } from "../../components/drift-playground";

export default function DriftPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-8 px-6 py-8">
      <header className="flex flex-col gap-4 rounded-[2rem] border border-[var(--border)] bg-[var(--panel)] p-8 shadow-lg shadow-black/5 backdrop-blur">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.35em] text-[var(--accent)]">DataProfile</p>
            <h1 className="mt-2 text-4xl font-semibold">Drift reports for week-over-week datasets.</h1>
          </div>
          <Link
            className="rounded-full border border-[var(--border)] px-4 py-2 text-sm"
            href="/"
          >
            Back to Profile
          </Link>
        </div>
        <p className="max-w-3xl text-base leading-7 text-black/70">
          Compare two snapshots, classify additive, compatible, and breaking changes, then export
          a report or create a read-only share link for async review.
        </p>
      </header>

      <DriftPlayground />
    </main>
  );
}
