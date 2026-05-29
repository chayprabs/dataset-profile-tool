# Deployment Runbook

This repo now includes concrete deployment artifacts for the planned production split:

- `apps/web/wrangler.jsonc` and `apps/web/open-next.config.ts` for Cloudflare Workers via OpenNext.
- `fly.toml` for the FastAPI worker on Fly.io.
- `deploy/r2-lifecycle-rules.example.json` for ephemeral object retention.

These files are release scaffolding, not proof of a live deployment. The project is still `NOT QUALIFIED YET` until the hosted environment exists and passes the full Section 3 sweep.

## Cloudflare Workers

1. Install workspace dependencies:

   ```bash
   pnpm install
   ```

2. Authenticate:

   ```bash
   pnpm dlx wrangler whoami
   ```

3. Replace the placeholder values in `apps/web/wrangler.jsonc`:

   - `NEXT_PUBLIC_API_BASE_URL`
   - `NEXT_PUBLIC_SITE_URL`

4. Preview the worker build locally in the Cloudflare runtime:

   ```bash
   pnpm --dir apps/web preview
   ```

5. Deploy:

   ```bash
   pnpm --dir apps/web deploy
   ```

6. Record the hosted URL and verify:

   ```bash
   curl -I https://<hosted-web-url>
   ```

## Fly.io

1. Authenticate:

   ```bash
   fly auth whoami
   ```

2. Create the app if needed, then deploy with the checked-in config:

   ```bash
   fly launch --no-deploy --copy-config --config fly.toml
   fly deploy --config fly.toml
   ```

3. Confirm health and machine placement:

   ```bash
   fly status -a dataprofile-worker
   fly machine list -a dataprofile-worker
   curl -sf https://<worker-host>/v1/health
   ```

4. Record both healthy regions for the final Section 3.15 evidence.

## R2

1. Create the bucket used for retained ephemeral artifacts or cache data.
2. Apply the example lifecycle policy from `deploy/r2-lifecycle-rules.example.json`.
3. Record the effective lifecycle rules from the provider API or dashboard.

## Hosted verification

Once the web and worker are live, capture:

- hosted web URL returning `200`
- hosted worker `/v1/health` returning `200`
- TLS certificates valid on both public endpoints
- latest GHCR image tags produced by `.github/workflows/release.yml`
- Fly.io machine health in both regions
- final Appendix B update with exact timestamps and outputs
