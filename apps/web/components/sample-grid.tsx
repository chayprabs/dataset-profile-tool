"use client";

import { useMemo, useRef, useState } from "react";

import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState
} from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";

import { redactSampleValue, shouldRedactSampleKey } from "../lib/pii-columns";

type SampleRow = Record<string, unknown>;

export function SampleGrid({
  piiColumns,
  redactSamples,
  rows
}: {
  piiColumns: Set<string>;
  redactSamples: boolean;
  rows: SampleRow[];
}) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const parentRef = useRef<HTMLDivElement | null>(null);
  const keys = Object.keys(rows[0] ?? {});
  const templateColumns = `repeat(${Math.max(keys.length, 1)}, minmax(180px, 1fr))`;

  const columnDefs = useMemo<ColumnDef<SampleRow>[]>(
    () =>
      keys.map((key) => ({
        accessorFn: (row) => row[key],
        cell: (context) =>
          renderSampleValue(
            context.getValue(),
            redactSamples && shouldRedactSampleKey(key, piiColumns)
          ),
        header: key,
        id: key
      })),
    [keys, piiColumns, redactSamples]
  );

  const table = useReactTable({
    columns: columnDefs,
    data: rows,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    state: { sorting }
  });

  const virtualizer = useVirtualizer({
    count: table.getRowModel().rows.length,
    estimateSize: () => 72,
    getScrollElement: () => parentRef.current,
    overscan: 6
  });

  return (
    <div className="overflow-hidden rounded-[1.5rem] border border-[var(--border)] bg-white/82 shadow-sm shadow-black/5">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--border)] bg-[#faf4ea] px-4 py-3 text-sm">
        <div>
          <p className="ui-kicker">Sample Grid</p>
          <p className="mt-1 text-xs text-black/55">
            Virtualized rows with sortable columns and default-safe redaction.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-xs">
          <span className="rounded-full border border-[var(--border)] bg-white px-3 py-1">
            {rows.length} rows
          </span>
          <span className="rounded-full border border-[var(--border)] bg-white px-3 py-1">
            {keys.length} columns
          </span>
          <span className="rounded-full border border-[var(--border)] bg-white px-3 py-1">
            {redactSamples ? "Redaction on" : "Redaction off"}
          </span>
        </div>
      </div>
      <div
        className="grid border-b border-[var(--border)] bg-[var(--accent-soft)] text-left text-xs uppercase tracking-[0.2em] text-black/55"
        style={{ gridTemplateColumns: templateColumns }}
      >
        {table.getFlatHeaders().map((header) => (
          <button
            key={header.id}
            className="px-4 py-3 text-left font-medium"
            onClick={header.column.getToggleSortingHandler()}
            type="button"
          >
            {flexRender(header.column.columnDef.header, header.getContext())}
          </button>
        ))}
      </div>
      <div className="max-h-[28rem] overflow-auto" ref={parentRef}>
        <div
          className="relative"
          style={{ height: `${virtualizer.getTotalSize()}px` }}
        >
          {virtualizer.getVirtualItems().map((virtualRow) => {
            const row = table.getRowModel().rows[virtualRow.index];
            return (
              <div
                key={row.id}
                className={`absolute left-0 grid w-full border-b border-[var(--border)] text-sm text-black/75 ${
                  virtualRow.index % 2 === 0 ? "bg-white/72" : "bg-[#f8f1e6]"
                }`}
                style={{
                  gridTemplateColumns: templateColumns,
                  transform: `translateY(${virtualRow.start}px)`
                }}
              >
                {row.getVisibleCells().map((cell) => (
                  <div key={cell.id} className="px-4 py-3 align-top">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function renderSampleValue(value: unknown, shouldRedact: boolean) {
  if (value === null || value === undefined) {
    return "null";
  }
  if (!shouldRedact) {
    return String(value);
  }
  return redactSampleValue(value);
}
