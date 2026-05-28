import Link from "next/link";

type FeatureLandingProps = {
  ctaHref: string;
  ctaLabel: string;
  eyebrow: string;
  heading: string;
  summary: string;
  bullets: string[];
};

export function FeatureLanding({
  ctaHref,
  ctaLabel,
  eyebrow,
  heading,
  summary,
  bullets
}: FeatureLandingProps) {
  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-8 px-6 py-8">
      <header className="rounded-[2rem] border border-[var(--border)] bg-[var(--panel)] p-8 shadow-lg shadow-black/5 backdrop-blur">
        <p className="text-sm uppercase tracking-[0.35em] text-[var(--accent)]">{eyebrow}</p>
        <h1 className="mt-3 text-4xl font-semibold">{heading}</h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-black/70">{summary}</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            className="rounded-full border border-[var(--accent)] bg-[var(--accent)] px-4 py-2 text-sm text-white"
            href={ctaHref}
          >
            {ctaLabel}
          </Link>
          <Link className="rounded-full border border-[var(--border)] px-4 py-2 text-sm" href="/">
            Back to Home
          </Link>
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-3">
        {bullets.map((bullet) => (
          <article
            key={bullet}
            className="rounded-[1.5rem] border border-[var(--border)] bg-white/80 p-5 shadow-lg shadow-black/5"
          >
            <p className="text-sm leading-6 text-black/70">{bullet}</p>
          </article>
        ))}
      </section>
    </main>
  );
}
