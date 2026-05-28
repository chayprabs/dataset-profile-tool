type SharedPayload = {
  kind: "profile" | "drift";
  payload: {
    source?: { format: string; rowCount: number; sha256: string };
    columns?: Array<{
      name: string;
      inferredType: string;
      nullPct: number;
      uniquePct: number;
      piiFlags: string[];
      anomalies: string[];
    }>;
    schema?: Record<string, unknown>;
    warnings?: string[];
    sampleRows?: Array<Record<string, unknown>>;
    added?: string[];
    removed?: string[];
    typeChanges?: Array<{
      kind: "type";
      column: string;
      severity: "additive" | "compatible" | "breaking";
      message: string;
      before?: unknown;
      after?: unknown;
      patchHint?: Record<string, unknown>;
    }>;
    rangeChanges?: Array<{
      kind: "range";
      column: string;
      severity: "additive" | "compatible" | "breaking";
      message: string;
      before?: unknown;
      after?: unknown;
      patchHint?: Record<string, unknown>;
    }>;
    cardinalityChanges?: Array<{
      kind: "cardinality";
      column: string;
      severity: "additive" | "compatible" | "breaking";
      message: string;
      before?: unknown;
      after?: unknown;
      patchHint?: Record<string, unknown>;
    }>;
    changes?: Array<{
      kind: "added" | "removed" | "type" | "range" | "cardinality";
      column: string;
      severity: "additive" | "compatible" | "breaking";
      message: string;
      before?: unknown;
      after?: unknown;
      patchHint?: Record<string, unknown>;
    }>;
  };
  expiresAt: string;
};

const apiBaseUrl =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ?? "http://localhost:8080";

export const dynamic = "force-dynamic";

export default async function SharedProfilePage({
  params
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const response = await fetch(`${apiBaseUrl}/v1/share/${token}`, { cache: "no-store" });

  if (!response.ok) {
    return (
      <main className="mx-auto flex min-h-screen max-w-3xl items-center justify-center px-6 py-16">
        <div className="rounded-[2rem] border border-[#d8d0c4] bg-white/85 p-8 text-center shadow-lg shadow-black/5">
          <p className="text-sm uppercase tracking-[0.3em] text-[#0e5f4f]">Shared Report</p>
          <h1 className="mt-3 text-3xl font-semibold">Link unavailable</h1>
          <p className="mt-3 text-sm text-black/65">
            This shared report may have expired or never existed.
          </p>
        </div>
      </main>
    );
  }

  const shared = (await response.json()) as SharedPayload;
  const profile = shared.payload;

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-6 px-6 py-8">
      <header className="rounded-[2rem] border border-[#d8d0c4] bg-white/85 p-8 shadow-lg shadow-black/5">
        <p className="text-sm uppercase tracking-[0.3em] text-[#0e5f4f]">Shared Report</p>
        <h1 className="mt-3 text-3xl font-semibold">Read-only DataProfile snapshot</h1>
        <p className="mt-3 text-sm text-black/65">
          Expires at {new Date(shared.expiresAt).toLocaleString()}.
        </p>
      </header>

      {shared.kind === "profile" ? (
        <>
          <section className="grid gap-4 md:grid-cols-3">
            <StatCard label="Format" value={profile.source?.format ?? "-"} />
            <StatCard label="Rows" value={String(profile.source?.rowCount ?? "-")} />
            <StatCard label="Columns" value={String(profile.columns?.length ?? "-")} />
          </section>

          <section className="rounded-[1.75rem] border border-[#d8d0c4] bg-white/85 p-5 shadow-lg shadow-black/5">
            <h2 className="text-xl font-semibold">Columns</h2>
            <div className="mt-4 space-y-3">
              {(profile.columns ?? []).map((column) => (
                <div
                  key={column.name}
                  className="grid gap-3 rounded-[1.25rem] border border-[#e6dfd4] bg-[#fbf8f2] p-4 md:grid-cols-[1.6fr_0.7fr_0.7fr_1fr]"
                >
                  <div>
                    <p className="font-semibold">{column.name}</p>
                    <p className="mt-1 text-xs text-black/55">{column.inferredType}</p>
                  </div>
                  <div className="text-sm text-black/75">Null {column.nullPct.toFixed(1)}%</div>
                  <div className="text-sm text-black/75">Unique {column.uniquePct.toFixed(1)}%</div>
                  <div className="flex flex-wrap gap-2">
                    {column.piiFlags.map((flag) => (
                      <Tag key={`${column.name}-${flag}`} tone="alert">
                        {flag}
                      </Tag>
                    ))}
                    {column.anomalies.map((anomaly) => (
                      <Tag key={`${column.name}-${anomaly}`} tone="muted">
                        {anomaly}
                      </Tag>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <section className="rounded-[1.75rem] border border-[#d8d0c4] bg-white/85 p-5 shadow-lg shadow-black/5">
              <h2 className="text-xl font-semibold">Schema</h2>
              <pre className="mt-4 overflow-auto rounded-[1.25rem] bg-[#111111] p-4 text-xs text-[#d7f7ec]">
                {JSON.stringify(profile.schema ?? {}, null, 2)}
              </pre>
            </section>

            <section className="rounded-[1.75rem] border border-[#d8d0c4] bg-white/85 p-5 shadow-lg shadow-black/5">
              <h2 className="text-xl font-semibold">Sample</h2>
              <div className="mt-4 overflow-auto rounded-[1.25rem] border border-[#e6dfd4]">
                <table className="min-w-full border-collapse text-sm">
                  <thead className="bg-[#f1eadf] text-left text-xs uppercase tracking-[0.2em] text-black/55">
                    <tr>
                      {Object.keys(profile.sampleRows?.[0] ?? {}).map((columnName) => (
                        <th key={columnName} className="px-4 py-3 font-medium">
                          {columnName}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(profile.sampleRows ?? []).map((row, index) => (
                      <tr key={`shared-row-${index}`} className="border-t border-[#e6dfd4]">
                        {Object.entries(row).map(([columnName, value]) => (
                          <td key={`${index}-${columnName}`} className="px-4 py-3 align-top text-black/75">
                            {String(value)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </section>
        </>
      ) : (
        <>
          <section className="grid gap-4 md:grid-cols-3">
            <StatCard label="Total changes" value={String(profile.changes?.length ?? 0)} />
            <StatCard label="Added" value={String(profile.added?.length ?? 0)} />
            <StatCard label="Removed" value={String(profile.removed?.length ?? 0)} />
          </section>

          <section className="grid gap-4">
            {(profile.changes ?? []).map((change, index) => (
              <article
                key={`${change.column}-${change.kind}-${index}`}
                className="rounded-[1.75rem] border border-[#d8d0c4] bg-white/85 p-5 shadow-lg shadow-black/5"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-xl font-semibold">{change.column}</h2>
                  <Tag tone={change.severity === "breaking" ? "alert" : "muted"}>
                    {change.severity}
                  </Tag>
                  <Tag tone="neutral">{change.kind}</Tag>
                </div>
                <p className="mt-3 text-sm text-black/65">{change.message}</p>
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <div className="rounded-[1.25rem] bg-[#fbf8f2] p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-black/45">Before</p>
                    <p className="mt-2 text-sm text-black/75">{renderValue(change.before)}</p>
                  </div>
                  <div className="rounded-[1.25rem] bg-[#fbf8f2] p-4">
                    <p className="text-xs uppercase tracking-[0.2em] text-black/45">After</p>
                    <p className="mt-2 text-sm text-black/75">{renderValue(change.after)}</p>
                  </div>
                </div>
                {change.patchHint ? (
                  <pre className="mt-4 overflow-auto rounded-[1.25rem] bg-[#111111] p-4 text-xs text-[#d7f7ec]">
                    {JSON.stringify(change.patchHint, null, 2)}
                  </pre>
                ) : null}
              </article>
            ))}

            {(profile.changes?.length ?? 0) === 0 ? (
              <section className="rounded-[1.75rem] border border-[#d8d0c4] bg-white/85 p-5 text-sm text-black/65 shadow-lg shadow-black/5">
                No drift changes are stored in this shared snapshot.
              </section>
            ) : null}
          </section>
        </>
      )}
    </main>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.5rem] border border-[#d8d0c4] bg-white/85 p-4 shadow-lg shadow-black/5">
      <p className="text-xs uppercase tracking-[0.2em] text-black/45">{label}</p>
      <p className="mt-3 text-3xl font-semibold">{value}</p>
    </div>
  );
}

function Tag({
  children,
  tone
}: {
  children: React.ReactNode;
  tone: "alert" | "muted" | "neutral";
}) {
  return (
    <span
      className={`rounded-full px-3 py-1 text-xs ${
        tone === "alert"
          ? "bg-[#fde9dd] text-[#8f3b0e]"
          : tone === "neutral"
            ? "bg-[#f1eadf] text-black/65"
            : "bg-[#e3f3ee] text-[#0e5f4f]"
      }`}
    >
      {children}
    </span>
  );
}

function renderValue(value: unknown) {
  if (value === undefined) {
    return "-";
  }
  if (value === null) {
    return "null";
  }
  if (typeof value === "string") {
    return value;
  }
  return JSON.stringify(value);
}
