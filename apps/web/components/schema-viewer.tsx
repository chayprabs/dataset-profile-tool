"use client";

import dynamic from "next/dynamic";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  loading: () => (
    <div className="rounded-[1.5rem] border border-[var(--border)] bg-[#111111] p-4 text-sm text-[#d7f7ec]">
      Loading schema editor...
    </div>
  ),
  ssr: false
});

export function SchemaViewer({ schema }: { schema: Record<string, unknown> }) {
  return (
    <div className="overflow-hidden rounded-[1.5rem] border border-[var(--border)] bg-[#111111]">
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
        value={JSON.stringify(schema, null, 2)}
      />
    </div>
  );
}
