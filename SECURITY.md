# Security Policy

## Reporting vulnerabilities

Please report security issues **privately** — do not open public GitHub issues for exploitable vulnerabilities affecting live deployments, credentials, or real user data.

- **Preferred:** contact the maintainer via [https://www.chaitanyaprabuddha.com](https://www.chaitanyaprabuddha.com) with enough detail to reproduce the issue.
- **Repository:** [https://github.com/chayprabs/dataset-profile-tool](https://github.com/chayprabs/dataset-profile-tool)

Include affected URLs or versions, steps to reproduce, and impact (confidentiality, integrity, availability).

## Scope

In scope: the DataProfile worker API, file/URL ingestion, share links, temporary storage, and the public web UI when operated by the maintainer.

Out of scope: social engineering, denial-of-service against free-tier limits, issues in third-party infrastructure without a demonstrable flaw in our configuration, or vulnerabilities in datasets users upload.

## Safe harbor

Good-faith research that follows this policy and avoids privacy violations (no exfiltration of other users' data) will not be pursued as unauthorized access, at the maintainer's discretion.

## Response

We aim to acknowledge reports within a reasonable time and to coordinate disclosure. There is no bug-bounty program unless separately announced.

## Hardening expectations

The Service is a best-effort open-source tool. Run sensitive workloads self-hosted, keep deployments patched, and use TLS in production. See `scripts/verify_privacy_security.py` for automated checks on log redaction behavior.
