import Link from "next/link";

import { StatPill } from "@dataprofile/shared-ui";

import { DriftPlayground } from "../../components/drift-playground";

export default function DriftPage() {
  return (
    <main className="ui-shell flex min-h-screen flex-col gap-8">
      <div className="ui-topbar">
        <div className="ui-brand">
          <span className="ui-brand-mark">DP</span>
          <div className="ui-brand-copy">
            <span className="ui-brand-title">DataProfile</span>
            <span className="ui-brand-subtitle">Change review workspace</span>
          </div>
        </div>
        <nav aria-label="Primary" className="ui-nav">
          <Link className="ui-navlink" href="/">
            Profile
          </Link>
          <Link className="ui-navlink" href="/drift">
            Drift
          </Link>
          <a className="ui-navlink" href="https://github.com/chayprabs/dataset-profile-tool">
            GitHub
          </a>
        </nav>
      </div>
      <header className="ui-hero grid gap-8 p-8 lg:grid-cols-[1.15fr_0.85fr] lg:p-10">
        <div className="space-y-5">
          <div>
            <p className="ui-kicker">DataProfile / Drift</p>
            <h1 className="mt-3 max-w-3xl text-4xl font-semibold tracking-[-0.035em] lg:text-6xl">
              Week-over-week change review without spreadsheet gymnastics.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-black/68 lg:text-lg">
              Compare two snapshots, classify additive and breaking changes, and hand
              off a read-only report link instead of a loose diff screenshot.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              className="rounded-full bg-[var(--accent)] px-5 py-2.5 text-sm text-white shadow-sm shadow-[var(--accent)]/20"
              href="/"
            >
              Back to Profile
            </Link>
          </div>
          <div className="flex flex-wrap gap-3">
            <StatPill label="Pairwise compare" value="2 snapshots" />
            <StatPill label="Outputs" value="HTML / JSON / Share" />
          </div>
        </div>
        <div className="ui-soft-card space-y-4 p-6 lg:p-7">
          <p className="ui-kicker">Golden Path</p>
          <div className="space-y-3 text-sm leading-6 text-black/68">
            <p>Start with the bundled week-one and week-two fixtures to verify the expected change set.</p>
            <p>Then switch to file or URL mode for live extracts once the structure looks stable.</p>
            <p>Exports and share links live alongside the result so review stays fast and asynchronous.</p>
          </div>
        </div>
      </header>

      <div className="ui-note-strip">
        <span className="ui-note-label">Review loop</span>
        <p className="ui-note-copy">
          Start with the golden fixtures to verify classification, then switch to uploaded
          files or URLs once the structure is stable enough to share.
        </p>
      </div>

      <DriftPlayground />
    </main>
  );
}
