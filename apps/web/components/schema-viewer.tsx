"use client";

import dynamic from "next/dynamic";
import { useState } from "react";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  loading: () => (
    <div className="rounded-[1.5rem] border border-[var(--border)] bg-[#111111] p-4 text-sm text-[#d7f7ec]">
      Loading schema editor...
    </div>
  ),
  ssr: false
});

export function SchemaViewer({ schema }: { schema: Record<string, unknown> }) {
  const [copyLabel, setCopyLabel] = useState("Copy");
  const schemaText = JSON.stringify(schema, null, 2);

  return (
    <div className="overflow-hidden rounded-[1.5rem] border border-[var(--border)] bg-[#111111]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 bg-[#161616] px-4 py-3 text-sm text-white/78">
        <div>
          <p className="ui-kicker text-[#8bd0bf]">Draft 2020-12</p>
          <p className="mt-1 text-xs text-white/45">
            Read-only Monaco view with direct copy and download actions.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            className="rounded-full border border-white/12 bg-white/6 px-4 py-2 text-xs uppercase tracking-[0.18em] text-white/82"
            onClick={async () => {
              await navigator.clipboard.writeText(schemaText);
              setCopyLabel("Copied");
              window.setTimeout(() => setCopyLabel("Copy"), 1200);
            }}
            type="button"
          >
            {copyLabel}
          </button>
          <button
            className="rounded-full border border-white/12 bg-[#8bd0bf]/12 px-4 py-2 text-xs uppercase tracking-[0.18em] text-[#d7f7ec]"
            onClick={() => downloadSchema(schemaText)}
            type="button"
          >
            Download
          </button>
        </div>
      </div>
      <MonacoEditor
        defaultLanguage="json"
        height="28rem"
        options={{
          automaticLayout: true,
          fontSize: 13,
          lineNumbers: "on",
          minimap: { enabled: false },
          readOnly: true,
          scrollBeyondLastLine: false
        }}
        theme="vs-dark"
        value={schemaText}
      />
    </div>
  );
}

function downloadSchema(content: string) {
  const blob = new Blob([content], { type: "application/schema+json" });
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = objectUrl;
  anchor.download = "dataprofile.schema.json";
  anchor.click();
  URL.revokeObjectURL(objectUrl);
}
