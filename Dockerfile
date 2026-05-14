# syntax=docker/dockerfile:1.24
ARG BUN_VERSION=1-alpine

FROM mirror.gcr.io/library/node:22-alpine AS builder
# bun replaces oven/bun:* builder image. Pulling node from public.ecr.aws
# (no rate limit) and installing bun keeps build reproducible without
# touching docker.io.
RUN npm install -g bun@1.2.17
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1

RUN bun install --frozen-lockfile

RUN bun run build
RUN mkdir -p /app/public

FROM mirror.gcr.io/library/node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0

RUN apk add --no-cache libc6-compat openssl wget
# bun is required by the ArgoCD PreSync migrate Job to run scripts/migrate.ts.
RUN npm install -g bun@1.2.17
RUN addgroup -g 1001 -S nodejs && adduser -u 1001 -S nextjs -G nodejs

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Migration support — used by the ArgoCD PreSync migrate Job.
COPY --from=builder --chown=nextjs:nodejs /app/drizzle ./drizzle
COPY --from=builder --chown=nextjs:nodejs /app/scripts/migrate.ts ./scripts/migrate.ts
# Next.js standalone tracing prunes modules not imported from app runtime code.
# scripts/migrate.ts uses drizzle-orm/node-postgres/migrator which is NOT imported
# from any app code, so standalone removes it. Explicit copy keeps the migrator
# (and its pg dependency tree) available to the PreSync migrate Job.
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/drizzle-orm ./node_modules/drizzle-orm
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/pg ./node_modules/pg
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/pg-types ./node_modules/pg-types
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/pg-protocol ./node_modules/pg-protocol
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/pg-connection-string ./node_modules/pg-connection-string
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/postgres-array ./node_modules/postgres-array
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/postgres-bytea ./node_modules/postgres-bytea
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/postgres-date ./node_modules/postgres-date
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/postgres-interval ./node_modules/postgres-interval

USER nextjs
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=45s --retries=5 \
  CMD wget -O- http://localhost:3000/api/health 2>&1 || exit 1

CMD ["node", "server.js"]
