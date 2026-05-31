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
    <main className="site-main">
      <article className="workspace-card" style={{ marginBottom: "1rem" }}>
        <p style={{ color: "var(--accent)", fontSize: "0.75rem", letterSpacing: "0.12em", textTransform: "uppercase" }}>
          {eyebrow}
        </p>
        <h1 style={{ fontSize: "1.75rem", fontWeight: 600, letterSpacing: "-0.02em", marginTop: "0.5rem" }}>
          {heading}
        </h1>
        <p style={{ color: "var(--muted)", lineHeight: 1.6, marginTop: "0.75rem", maxWidth: "40rem" }}>
          {summary}
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginTop: "1.25rem" }}>
          <Link className="btn-primary" href={ctaHref} style={{ display: "inline-block", textDecoration: "none" }}>
            {ctaLabel}
          </Link>
          <Link className="btn-secondary" href="/" style={{ display: "inline-block", textDecoration: "none" }}>
            Open profiler
          </Link>
        </div>
      </article>

      <section style={{ display: "grid", gap: "0.75rem", gridTemplateColumns: "repeat(auto-fit, minmax(14rem, 1fr))" }}>
        {bullets.map((bullet) => (
          <article key={bullet} className="workspace-card">
            <p style={{ color: "#404040", fontSize: "0.875rem", lineHeight: 1.55, margin: 0 }}>{bullet}</p>
          </article>
        ))}
      </section>
    </main>
  );
}
