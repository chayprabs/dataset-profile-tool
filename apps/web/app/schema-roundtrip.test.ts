import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

import Ajv2020 from "ajv/dist/2020";
import addFormats from "ajv-formats";
import { describe, expect, it } from "vitest";

const webRoot = path.dirname(fileURLToPath(import.meta.url));
const appRoot = path.resolve(webRoot, "..");

function loadProfileFixture(sampleName: string) {
  const pythonSnippet = `
from pathlib import Path
import json
import sys

repo_root = Path.cwd().resolve().parents[1]
sys.path.insert(0, str((repo_root / "apps" / "worker" / "src").resolve()))

from core.stats import profile_dataset

profile = profile_dataset((repo_root / "apps" / "web" / "public" / "samples" / "${sampleName}").resolve())
print(profile.model_dump_json(by_alias=True))
`;

  const output = execFileSync("python", ["-c", pythonSnippet], {
    cwd: appRoot,
    encoding: "utf-8"
  });
  const jsonStart = output.indexOf("{");
  const jsonPayload = jsonStart >= 0 ? output.slice(jsonStart) : output;
  return JSON.parse(jsonPayload) as {
    schema: Record<string, unknown>;
    sampleRows: Array<Record<string, unknown>>;
  };
}

describe("schema inference round-trip", () => {
  it("validates ecommerce sample rows with ajv draft 2020", () => {
    const profile = loadProfileFixture("ecommerce-events.csv");
    const ajv = new Ajv2020({ allErrors: true, strict: false });
    addFormats(ajv);

    const validate = ajv.compile(profile.schema);
    const failures = profile.sampleRows.filter((row) => !validate(row));

    expect(failures).toHaveLength(0);
  }, 15000);

  it("validates pii-laden sample rows with ajv draft 2020", () => {
    const profile = loadProfileFixture("pii-laden.csv");
    const ajv = new Ajv2020({ allErrors: true, strict: false });
    addFormats(ajv);

    const validate = ajv.compile(profile.schema);
    const failures = profile.sampleRows.filter((row) => !validate(row));

    expect(failures).toHaveLength(0);
  }, 15000);
});
