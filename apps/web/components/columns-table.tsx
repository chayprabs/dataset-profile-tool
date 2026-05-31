"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState
} from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";

import type { ColumnProfile } from "@dataprofile/shared-types";

import { formatColumnValue } from "../lib/pii-columns";

import { ProfileHistogram } from "./profile-histogram";

export function ColumnsTable({
  columns,
  redactPii = true
}: {
  columns: ColumnProfile[];
  redactPii?: boolean;
}) {
  const [selectedColumnName, setSelectedColumnName] = useState<string | null>(columns[0]?.name ?? null);
  const [sorting, setSorting] = useState<SortingState>([{ id: "nullPct", desc: true }]);
  const parentRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!columns.length) {
      setSelectedColumnName(null);
      return;
    }
    if (!columns.some((column) => column.name === selectedColumnName)) {
      setSelectedColumnName(columns[0]?.name ?? null);
    }
  }, [columns, selectedColumnName]);

  const selectedColumn = columns.find((column) => column.name === selectedColumnName) ?? columns[0] ?? null;
  const columnDefs = useMemo<ColumnDef<ColumnProfile>[]>(
    () => [
      {
        accessorKey: "name",
        cell: (context) => (
          <div>
            <p className="font-semibold">{context.row.original.name}</p>
            <p className="mt-1 line-clamp-2 text-xs text-black/55">
              {context.row.original.topValues
                .slice(0, 3)
                .map(
                  (item) =>
                    `${formatColumnValue(item.value, context.row.original, redactPii)} (${item.count})`
                )
                .join(", ") || "No top values"}
            </p>
          </div>
        ),
        header: "Column"
      },
      {
        accessorKey: "inferredType",
        header: "Type"
      },
      {
        accessorKey: "nullPct",
        cell: (context) => `${context.row.original.nullPct.toFixed(1)}%`,
        header: "Null %"
      },
      {
        accessorKey: "uniquePct",
        cell: (context) => `${context.row.original.uniquePct.toFixed(1)}%`,
        header: "Unique %"
      },
      {
        id: "signals",
        cell: (context) => (
          <div className="flex flex-wrap gap-2">
            {context.row.original.piiFlags.map((flag) => (
              <Signal key={`${context.row.original.name}-${flag}`} tone="alert">
                {flag}
              </Signal>
            ))}
            {context.row.original.anomalies.map((anomaly) => (
              <Signal key={`${context.row.original.name}-${anomaly}`} tone="muted">
                {anomaly}
              </Signal>
            ))}
            {context.row.original.piiFlags.length === 0 && context.row.original.anomalies.length === 0 ? (
              <span className="text-xs text-black/45">-</span>
            ) : null}
          </div>
        ),
        header: "Signals",
        sortingFn: (left, right) =>
          left.original.piiFlags.length +
          left.original.anomalies.length -
          (right.original.piiFlags.length + right.original.anomalies.length)
      }
    ],
    [redactPii]
  );

  const table = useReactTable({
    columns: columnDefs,
    data: columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    state: { sorting }
  });

  const virtualizer = useVirtualizer({
    count: table.getRowModel().rows.length,
    estimateSize: () => 96,
    getScrollElement: () => parentRef.current,
    overscan: 8
  });

  return (
    <div className="space-y-4">
      <div className="overflow-hidden rounded-[1.5rem] border border-[var(--border)] bg-white/82 shadow-sm shadow-black/5">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border)] bg-[#faf4ea] px-4 py-3 text-sm">
          <div>
            <p className="ui-kicker">Column Lens</p>
            <p className="mt-1 text-xs text-black/55">
              Sort the full profile surface, then expand one column for deeper inspection.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="rounded-full border border-[var(--border)] bg-white px-3 py-1">
              {columns.length} columns
            </span>
            {selectedColumn ? (
              <span className="rounded-full border border-[var(--border)] bg-white px-3 py-1">
                Focus: {selectedColumn.name}
              </span>
            ) : null}
          </div>
        </div>
        <div className="grid grid-cols-[1.6fr_0.8fr_0.8fr_1fr_1fr] gap-3 border-b border-[var(--border)] px-4 py-3 text-xs uppercase tracking-[0.2em] text-black/45">
          {table.getFlatHeaders().map((header) => (
            <button
              key={header.id}
              className="text-left"
              onClick={header.column.getToggleSortingHandler()}
              type="button"
            >
              {flexRender(header.column.columnDef.header, header.getContext())}
            </button>
          ))}
        </div>
        <div className="max-h-[26rem] overflow-auto" ref={parentRef}>
          <div className="relative" style={{ height: `${virtualizer.getTotalSize()}px` }}>
            {virtualizer.getVirtualItems().map((virtualRow) => {
              const row = table.getRowModel().rows[virtualRow.index];
              return (
                <button
                  key={row.id}
                  className={`absolute left-0 grid w-full grid-cols-[1.6fr_0.8fr_0.8fr_1fr_1fr] gap-3 border-b border-[var(--border)] px-4 py-4 text-left text-sm transition hover:bg-[var(--accent-soft)] ${
                    row.original.name === selectedColumn?.name ? "bg-[var(--accent-soft)]/80" : "bg-white/72"
                  }`}
                  onClick={() =>
                    setSelectedColumnName((current) => (current === row.original.name ? null : row.original.name))
                  }
                  style={{ transform: `translateY(${virtualRow.start}px)` }}
                  type="button"
                >
                  {row.getVisibleCells().map((cell) => (
                    <div key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</div>
                  ))}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {selectedColumn ? (
        <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <section className="rounded-[1.5rem] border border-[var(--border)] bg-white/80 p-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-black/45">Expanded Column</p>
                <h3 className="mt-2 text-xl font-semibold">{selectedColumn.name}</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                <Signal tone="neutral">{selectedColumn.inferredType}</Signal>
                <Signal tone="neutral">confidence {selectedColumn.confidence.toFixed(2)}</Signal>
              </div>
            </div>

            {selectedColumn.numeric ? (
              <div className="mt-5 grid gap-4 md:grid-cols-[1fr_0.9fr]">
                <div className="rounded-[1.25rem] border border-[var(--border)] bg-[#fbf8f2] p-4">
                  <p className="text-sm font-medium">Histogram</p>
                  <div className="mt-4">
                    <ProfileHistogram values={selectedColumn.numeric.histogram} />
                  </div>
                </div>
                <dl className="grid gap-3 text-sm md:grid-cols-2">
                  <StatTile column={selectedColumn} label="Min" redactPii={redactPii} value={selectedColumn.numeric.min} />
                  <StatTile column={selectedColumn} label="Max" redactPii={redactPii} value={selectedColumn.numeric.max} />
                  <StatTile column={selectedColumn} label="Mean" redactPii={redactPii} value={selectedColumn.numeric.mean} />
                  <StatTile column={selectedColumn} label="P50" redactPii={redactPii} value={selectedColumn.numeric.p50} />
                  <StatTile column={selectedColumn} label="P95" redactPii={redactPii} value={selectedColumn.numeric.p95} />
                  <StatTile column={selectedColumn} label="Stddev" redactPii={redactPii} value={selectedColumn.numeric.stddev} />
                </dl>
              </div>
            ) : null}

            {selectedColumn.string ? (
              <div className="mt-5 grid gap-3 md:grid-cols-4">
                <StatTile column={selectedColumn} label="Min length" redactPii={false} value={selectedColumn.string.minLen} />
                <StatTile column={selectedColumn} label="Max length" redactPii={false} value={selectedColumn.string.maxLen} />
                <StatTile column={selectedColumn} label="Lower chars" redactPii={false} value={selectedColumn.string.charClasses.lower ?? 0} />
                <StatTile column={selectedColumn} label="Digits" redactPii={false} value={selectedColumn.string.charClasses.digit ?? 0} />
              </div>
            ) : null}

            {selectedColumn.date ? (
              <div className="mt-5 grid gap-3 md:grid-cols-3">
                <StatTile
                  column={selectedColumn}
                  label="Earliest"
                  redactPii={redactPii}
                  value={selectedColumn.date.min}
                />
                <StatTile
                  column={selectedColumn}
                  label="Latest"
                  redactPii={redactPii}
                  value={selectedColumn.date.max}
                />
                <StatTile
                  column={selectedColumn}
                  label="Pattern"
                  redactPii={redactPii}
                  value={selectedColumn.date.pattern}
                />
              </div>
            ) : null}

            {selectedColumn.boolean ? (
              <div className="mt-5 grid gap-3 md:grid-cols-2">
                <StatTile column={selectedColumn} label="True count" redactPii={false} value={selectedColumn.boolean.trueCount} />
                <StatTile column={selectedColumn} label="False count" redactPii={false} value={selectedColumn.boolean.falseCount} />
              </div>
            ) : null}
          </section>

          <section className="rounded-[1.5rem] border border-[var(--border)] bg-white/80 p-5">
            <p className="text-sm font-medium">Top values</p>
            <div className="mt-4 space-y-3">
              {selectedColumn.topValues.length > 0 ? (
                selectedColumn.topValues.map((value) => (
                  <div
                    key={`${selectedColumn.name}-${String(value.value)}`}
                    className="rounded-[1.25rem] border border-[var(--border)] bg-[#fbf8f2] p-3"
                  >
                    <p className="truncate text-sm font-medium">
                      {formatColumnValue(value.value, selectedColumn, redactPii)}
                    </p>
                    <p className="mt-1 text-xs text-black/55">{value.count} rows</p>
                  </div>
                ))
              ) : (
                <div className="rounded-[1.25rem] border border-dashed border-[var(--border)] bg-[#fbf8f2] p-4 text-sm text-black/55">
                  No top-value sample was collected for this column in the current mode.
                </div>
              )}
            </div>
          </section>
        </div>
      ) : null}
    </div>
  );
}

function Signal({
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
            ? "border border-[var(--border)] bg-white text-black/65"
            : "bg-[var(--accent-soft)] text-[var(--accent)]"
      }`}
    >
      {children}
    </span>
  );
}

function StatTile({
  column,
  label,
  redactPii,
  value
}: {
  column: ColumnProfile;
  label: string;
  redactPii: boolean;
  value: number | string | null | undefined;
}) {
  return (
    <div className="rounded-[1.25rem] border border-[var(--border)] bg-[#fbf8f2] p-4">
      <dt className="text-xs uppercase tracking-[0.2em] text-black/45">{label}</dt>
      <dd className="mt-2 text-sm text-black/75">{formatColumnValue(value, column, redactPii)}</dd>
    </div>
  );
}
