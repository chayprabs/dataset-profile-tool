import { mkdir, rm, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = new globalThis.URL("../", import.meta.url);
const files = [
  ".next/types/app/csv-profiler/page.ts",
  ".next/types/app/dataset-drift/page.ts",
  ".next/types/app/drift/page.ts",
  ".next/types/app/json-schema-infer/page.ts",
  ".next/types/app/jsonl-profiler/page.ts",
  ".next/types/app/layout.ts",
  ".next/types/app/parquet-profiler/page.ts",
  ".next/types/app/page.ts",
  ".next/types/app/s/[token]/page.ts",
  ".next/types/cache-life.d.ts",
  ".next/types/link.d.ts"
];

for (const relativePath of files) {
  const fileUrl = new globalThis.URL(relativePath, root);
  const filePath = fileURLToPath(fileUrl);
  await mkdir(dirname(filePath), { recursive: true });
  await writeFile(filePath, "export {};\n");
}

const tsbuildInfoPath = fileURLToPath(new globalThis.URL("../tsconfig.tsbuildinfo", import.meta.url));
await rm(tsbuildInfoPath, { force: true });
