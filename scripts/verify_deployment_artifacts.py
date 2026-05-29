from __future__ import annotations

import json
from pathlib import Path
import sys

REPO_ROOT = Path(__file__).resolve().parents[1]


def read_text(path: Path) -> str:
    return path.read_text(encoding="utf-8")


def main() -> int:
    worker_fly = REPO_ROOT / "fly.toml"
    web_wrangler = REPO_ROOT / "apps" / "web" / "wrangler.jsonc"
    open_next = REPO_ROOT / "apps" / "web" / "open-next.config.ts"
    static_headers = REPO_ROOT / "apps" / "web" / "public" / "_headers"
    r2_rules = REPO_ROOT / "deploy" / "r2-lifecycle-rules.example.json"
    deploy_readme = REPO_ROOT / "deploy" / "README.md"

    fly_text = read_text(worker_fly)
    wrangler_text = read_text(web_wrangler)
    headers_text = read_text(static_headers)
    lifecycle = json.loads(read_text(r2_rules))
    deploy_text = read_text(deploy_readme)

    payload = {
      "flyWorker": {
        "status": "pass" if 'dockerfile = "apps/worker/Dockerfile"' in fly_text and 'path = "/v1/health"' in fly_text else "fail",
        "hasHealthCheck": 'path = "/v1/health"' in fly_text,
        "has4GbVm": 'memory = "4gb"' in fly_text,
        "hasPerformancePreset": 'size = "performance-2x"' in fly_text
      },
      "cloudflareWeb": {
        "status": "pass" if all([
            '".open-next/worker.js"' in wrangler_text,
            '"nodejs_compat"' in wrangler_text,
            '"global_fetch_strictly_public"' in wrangler_text,
            '"WORKER_SELF_REFERENCE"' in wrangler_text,
            open_next.exists(),
            static_headers.exists(),
        ]) else "fail",
        "hasOpenNextWorker": '".open-next/worker.js"' in wrangler_text,
        "hasNodeCompat": '"nodejs_compat"' in wrangler_text,
        "hasGlobalFetchPublic": '"global_fetch_strictly_public"' in wrangler_text,
        "hasSelfReferenceBinding": '"WORKER_SELF_REFERENCE"' in wrangler_text,
        "hasOpenNextConfig": open_next.exists(),
        "hasStaticAssetHeaders": static_headers.exists() and "Cache-Control: public,max-age=31536000,immutable" in headers_text
      },
      "r2Lifecycle": {
        "status": "pass" if len(lifecycle.get("rules", [])) >= 2 else "fail",
        "rules": lifecycle.get("rules", [])
      },
      "deploymentDocs": {
        "status": "pass" if all([
            "Cloudflare Workers" in deploy_text,
            "Fly.io" in deploy_text,
            "R2" in deploy_text,
            "Hosted verification" in deploy_text,
        ]) else "fail",
        "hasCloudflareGuide": "Cloudflare Workers" in deploy_text,
        "hasFlyGuide": "Fly.io" in deploy_text,
        "hasR2Guide": "R2" in deploy_text,
        "hasHostedVerificationSteps": "Hosted verification" in deploy_text
      }
    }
    print(json.dumps(payload, indent=2))
    return 0 if all(section["status"] == "pass" for section in payload.values()) else 1


if __name__ == "__main__":
    raise SystemExit(main())
