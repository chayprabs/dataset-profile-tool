FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json pnpm-workspace.yaml tsconfig.base.json ./
COPY apps/web/package.json apps/web/package.json
COPY packages/shared-types/package.json packages/shared-types/package.json
COPY packages/shared-ui/package.json packages/shared-ui/package.json
COPY packages/shared-worker-runtime/package.json packages/shared-worker-runtime/package.json
RUN corepack enable && pnpm install --filter @dataprofile/web... --frozen-lockfile=false

FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN corepack enable && pnpm --filter @dataprofile/web build

FROM node:22-alpine
WORKDIR /app
ENV PORT=3000
COPY --from=builder /app/apps/web/.next ./apps/web/.next
COPY --from=builder /app/apps/web/public ./apps/web/public
COPY --from=builder /app/apps/web/package.json ./apps/web/package.json
COPY --from=builder /app/node_modules ./node_modules
CMD ["node_modules/.bin/next", "start", "apps/web", "-p", "3000"]
