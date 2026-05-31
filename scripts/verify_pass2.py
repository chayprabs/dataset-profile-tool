#!/usr/bin/env python3
"""Second verification pass against live worker at 127.0.0.1:8080."""
from __future__ import annotations

import json
import sys
import tempfile
from functools import partial
from http.server import SimpleHTTPRequestHandler
from pathlib import Path
import socketserver
from threading import Thread

import httpx

API = "http://127.0.0.1:8080"
SAMPLES = Path(__file__).resolve().parents[1] / "apps" / "web" / "public" / "samples"
BUGS: list[str] = []
FAILURES: list[str] = []
PASSED: list[str] = []


def ok(name: str) -> None:
    PASSED.append(name)


def fail(name: str, detail: str) -> None:
    FAILURES.append(f"{name}: {detail}")


def bug(title: str, repro: str) -> None:
    BUGS.append(f"### {title}\n\n{repro}")


def post_drift_files(client: httpx.Client, before: Path, after: Path) -> dict:
    with before.open("rb") as b, after.open("rb") as a:
        r = client.post(
            f"{API}/v1/drift",
            files={
                "before_file": (before.name, b, "application/octet-stream"),
                "after_file": (after.name, a, "application/octet-stream"),
            },
        )
    if r.status_code != 200:
        raise RuntimeError(f"drift {before.name} vs {after.name}: {r.status_code} {r.text[:500]}")
    return r.json()


def post_drift_urls(client: httpx.Client, before_url: str, after_url: str) -> dict:
    r = client.post(
        f"{API}/v1/drift",
        data={"before_url": before_url, "after_url": after_url},
    )
    if r.status_code != 200:
        raise RuntimeError(f"drift url: {r.status_code} {r.text[:500]}")
    return r.json()


def check_golden(drift: dict) -> None:
    name = "golden drift-week-1 vs drift-week-2"
    try:
        assert drift["added"] == ["loyalty_points"], f"added={drift['added']}"
        assert drift["removed"] == [], f"removed={drift['removed']}"
        rc = drift["rangeChanges"]
        assert [c["column"] for c in rc] == ["spend"], f"rangeChanges columns={[c['column'] for c in rc]}"
        assert rc[0]["severity"] == "additive"
        assert rc[0]["after"] == 220.0, f"spend max after={rc[0]['after']}"
        cc = drift["cardinalityChanges"]
        assert [c["column"] for c in cc] == ["tier"], f"cardinality columns"
        assert cc[0]["before"] == 3 and cc[0]["after"] == 5
        assert cc[0]["severity"] == "additive"
        added_change = next(c for c in drift["changes"] if c["column"] == "loyalty_points")
        assert added_change.get("patchHint") is None or isinstance(added_change.get("patchHint"), dict)
        removed_with_hint = [c for c in drift["changes"] if c["kind"] == "removed"]
        for c in removed_with_hint:
            assert c.get("patchHint") is not None, f"removed {c['column']} missing patchHint"
        type_with_hint = [c for c in drift.get("typeChanges", []) if c.get("patchHint")]
        # golden has no type changes
        after_snap = added_change["after"]
        assert after_snap is not None
        up = after_snap.get("uniquePct")
        if up is None or up > 100:
            bug(
                "uniquePct > 100 on added loyalty_points",
                f"POST /v1/drift with drift-week-1.csv + drift-week-2.csv\n"
                f"changes loyalty_points after.uniquePct = {up}",
            )
        else:
            ok(f"{name} uniquePct={up}")
        ok(name)
    except AssertionError as e:
        bug(name, f"POST /v1/drift files drift-week-1.csv + drift-week-2.csv\nAssertion: {e}")
    except Exception as e:
        fail(name, str(e))


def main() -> int:
    with httpx.Client(timeout=120.0) as client:
        # health
        try:
            h = client.get(f"{API}/v1/health")
            if h.status_code != 200:
                fail("health", str(h.status_code))
            else:
                ok("GET /v1/health")
        except Exception as e:
            fail("health", str(e))
            print("Worker unreachable", file=sys.stderr)
            return 1

        # golden file upload
        try:
            drift = post_drift_files(
                client, SAMPLES / "drift-week-1.csv", SAMPLES / "drift-week-2.csv"
            )
            check_golden(drift)
        except Exception as e:
            bug("golden drift file upload", f"curl -F before_file=@drift-week-1.csv -F after_file=@drift-week-2.csv {API}/v1/drift\n{e}")

        # identity pair
        try:
            d = post_drift_files(client, SAMPLES / "drift-week-1.csv", SAMPLES / "drift-week-1.csv")
            if d["added"] or d["removed"] or d["rangeChanges"] or d["cardinalityChanges"]:
                bug(
                    "identity drift-week-1 vs self has changes",
                    f"POST same file both sides; got added={d['added']} removed={d['removed']}",
                )
            else:
                ok("identity drift-week-1 vs drift-week-1")
        except Exception as e:
            fail("identity drift", str(e))

        # sensible sample pairs (same format csv samples)
        sensible_pairs = [
            ("ecommerce-events.csv", "ecommerce-events.csv"),
            ("mixed-types.csv", "mixed-types.csv"),
            ("pii-laden.csv", "pii-laden.csv"),
            ("anomaly-lab.csv", "anomaly-lab.csv"),
            ("drift-week-1.csv", "drift-week-2.csv"),
        ]
        for b, a in sensible_pairs:
            try:
                post_drift_files(client, SAMPLES / b, SAMPLES / a)
                ok(f"drift files {b} vs {a}")
            except Exception as e:
                fail(f"drift {b} vs {a}", str(e))

        # cross-format pair (should still return 200)
        try:
            post_drift_files(client, SAMPLES / "users.json", SAMPLES / "weather.jsonl")
            ok("drift cross-format users.json vs weather.jsonl")
        except Exception as e:
            fail("drift cross-format", str(e))

        # URL mode with local static server
        handler = partial(SimpleHTTPRequestHandler, directory=str(SAMPLES))

        class QuietHandler(SimpleHTTPRequestHandler):
            def log_message(self, format: str, *args) -> None:
                pass

        handler = partial(QuietHandler, directory=str(SAMPLES))
        with socketserver.TCPServer(("127.0.0.1", 0), handler) as httpd:
            port = httpd.server_address[1]
            thread = Thread(target=httpd.serve_forever, daemon=True)
            thread.start()
            base = f"http://127.0.0.1:{port}"
            try:
                drift_url = post_drift_urls(
                    client,
                    f"{base}/drift-week-1.csv",
                    f"{base}/drift-week-2.csv",
                )
                if drift_url.get("added") != ["loyalty_points"]:
                    bug(
                        "URL drift golden mismatch",
                        f'POST /v1/drift before_url={base}/drift-week-1.csv after_url=.../drift-week-2.csv\n'
                        f"added={drift_url.get('added')}",
                    )
                else:
                    ok("drift URL mode golden")
            except Exception as e:
                fail("drift URL mode", str(e))
            httpd.shutdown()

        # share profile + drift
        try:
            prof = client.post(
                f"{API}/v1/profile",
                files={"file": ("drift-week-2.csv", (SAMPLES / "drift-week-2.csv").read_bytes(), "text/csv")},
                data={"sampleSize": "5", "sampleMode": "head"},
            )
            if prof.status_code != 200:
                raise RuntimeError(prof.status_code, prof.text[:300])
            profile_payload = prof.json()
            cr = client.post(
                f"{API}/v1/share",
                json={"kind": "profile", "payload": profile_payload},
            )
            if cr.status_code != 200:
                raise RuntimeError("share create profile", cr.status_code, cr.text)
            token = cr.json()["token"]
            gr = client.get(f"{API}/v1/share/{token}")
            if gr.status_code != 200:
                raise RuntimeError("share get profile", gr.status_code)
            got = gr.json()
            if got["kind"] != "profile" or got["payload"].get("jobId") != profile_payload.get("jobId"):
                bug(
                    "share profile round-trip mismatch",
                    f"POST /v1/share kind=profile then GET /v1/share/{{token}}\n"
                    f"jobId before={profile_payload.get('jobId')} after={got['payload'].get('jobId')}",
                )
            else:
                ok("share profile POST/GET")

            drift_payload = post_drift_files(
                client, SAMPLES / "drift-week-1.csv", SAMPLES / "drift-week-2.csv"
            )
            cr2 = client.post(
                f"{API}/v1/share",
                json={"kind": "drift", "payload": drift_payload},
            )
            if cr2.status_code != 200:
                raise RuntimeError("share create drift", cr2.status_code)
            token2 = cr2.json()["token"]
            gr2 = client.get(f"{API}/v1/share/{token2}")
            if gr2.status_code != 200 or gr2.json()["payload"].get("added") != ["loyalty_points"]:
                bug(
                    "share drift round-trip",
                    f"POST /v1/share kind=drift; GET token; added={gr2.json().get('payload', {}).get('added')}",
                )
            else:
                ok("share drift POST/GET")
        except Exception as e:
            fail("share", str(e))

        # schema-infer 3 formats
        for fname, fmt in [
            ("ecommerce-events.csv", "csv"),
            ("users.json", "json"),
            ("weather.jsonl", "jsonl"),
        ]:
            try:
                with (SAMPLES / fname).open("rb") as f:
                    r = client.post(
                        f"{API}/v1/schema-infer",
                        files={"file": (fname, f, "application/octet-stream")},
                    )
                if r.status_code != 200:
                    fail(f"schema-infer {fmt}", f"{r.status_code} {r.text[:300]}")
                    continue
                schema = r.json()
                if schema.get("$schema") != "https://json-schema.org/draft/2020-12/schema":
                    bug(
                        f"schema-infer {fmt} wrong $schema",
                        f"POST /v1/schema-infer file={fname}\n$schema={schema.get('$schema')}",
                    )
                elif "properties" not in schema:
                    bug(f"schema-infer {fmt} no properties", f"POST file={fname}")
                else:
                    ok(f"schema-infer {fmt} ({fname})")
            except Exception as e:
                fail(f"schema-infer {fmt}", str(e))

        # invalid inputs
        r = client.post(f"{API}/v1/drift", data={})
        if r.status_code != 400:
            bug("drift missing sources should 400", f"POST /v1/drift empty -> {r.status_code}")
        else:
            ok("drift 400 missing sources")

        r = client.post(
            f"{API}/v1/schema-infer",
            files={"file": ("x.csv", b"a\n1\n", "text/csv")},
            data={"sampleMode": "middle"},
        )
        if r.status_code != 400:
            bug("schema-infer bad sampleMode", f"sampleMode=middle -> {r.status_code}")
        else:
            ok("schema-infer 400 bad sampleMode")

        # 413 via curl streaming to avoid loading 51MB into Python client memory
        import subprocess

        huge_path = Path(tempfile.gettempdir()) / "verify_too_big.csv"
        try:
            with huge_path.open("wb") as out:
                out.write(b"x\n")
                chunk = b"1\n" * (512 * 1024)
                for _ in range(101):  # ~52MB
                    out.write(chunk)
            proc = subprocess.run(
                [
                    "curl",
                    "-s",
                    "-o",
                    "/tmp/verify_413_body.json",
                    "-w",
                    "%{http_code}",
                    "-F",
                    f"file=@{huge_path};type=text/csv",
                    f"{API}/v1/profile",
                ],
                capture_output=True,
                text=True,
                timeout=120,
            )
            code = proc.stdout.strip()
            if code != "413":
                bug(
                    "oversized upload should 413",
                    f"curl -F file=@~52MB.csv {API}/v1/profile -> HTTP {code}",
                )
            else:
                body = Path("/tmp/verify_413_body.json").read_text()
                if "413_FILE_TOO_LARGE" not in body:
                    bug("413 wrong detail", f"body={body[:200]}")
                else:
                    ok("profile 413 oversized")
        finally:
            huge_path.unlink(missing_ok=True)

    print(f"\n=== PASSED ({len(PASSED)}) ===")
    for p in PASSED:
        print(f"  OK {p}")
    if FAILURES:
        print(f"\n=== FAILURES ({len(FAILURES)}) ===")
        for f in FAILURES:
            print(f"  FAIL {f}")
    if BUGS:
        print(f"\n=== BUGS ({len(BUGS)}) ===")
        for b in BUGS:
            print(b)
            print()
    return 1 if (BUGS or FAILURES) else 0


if __name__ == "__main__":
    sys.exit(main())
