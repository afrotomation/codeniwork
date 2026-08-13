# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

CodeniWork is a job application tracker built with Next.js 16 (App Router) and React 19, using NeonDB (serverless PostgreSQL) via Drizzle ORM, and NextAuth.js v5 (beta) for authentication. It features credential-based login, passkey/WebAuthn support, and a "Console" UI — warm charcoal / warm paper, IBM Plex Mono + Sora, moss accent — with light and dark themes.

## Commands

```bash
pnpm dev              # Start dev server (localhost:3000)
pnpm build            # Production build
pnpm lint             # ESLint (flat config)
pnpm db:generate      # Generate Drizzle migrations from schema
pnpm db:push          # Push schema directly to NeonDB
pnpm db:studio        # Open Drizzle Studio (DB browser)
pnpm db:seed          # Seed database with sample data
pnpm db:clear         # Clear all database tables
pnpm db:reset         # Clear + reseed database
pnpm auto-reject      # Run auto-rejection script (CLI)
pnpm semantic-release # Run semantic-release (CI only, use --dry-run locally)
```

There is no test suite configured.

## Architecture

### Authentication Flow
- **NextAuth.js v5** configured in `lib/auth.ts` — exports `handlers`, `auth`, `signIn`, `signOut`
- Uses **JWT strategy** with credentials provider (email/password via bcrypt)
- Passkey/WebAuthn support implemented manually in `lib/passkey-auth.ts` (simplified verification, not using @simplewebauthn/server)
- Auth route handler at `app/api/auth/[...nextauth]/route.ts` re-exports handlers from `lib/auth.ts`
- `proxy.ts` (Next.js 16 proxy) checks for session cookies and protects all routes except `/`, `/auth/signin`, `/auth/signup`; redirects authenticated users away from auth pages to `/dashboard`
- Client-side auth via `<AuthProvider>` (SessionProvider wrapper) in root layout

### Database
- **NeonDB** (serverless PostgreSQL) connected via `@neondatabase/serverless` HTTP driver
- **Drizzle ORM** with schema in `lib/db/schema.ts`, connection in `lib/db/index.ts`
- `drizzle.config.ts` points to `lib/db/schema.ts` with output to `./drizzle/`
- Key tables: `users`, `companies`, `job_applications` (with status enum: applied/screening/interview/offer/rejected/withdrawn), `application_events`, `documents`, `passkey_credentials`, plus NextAuth tables (`sessions`, `accounts`, `verification_tokens`)
- Query functions centralized in `lib/db/queries.ts` (dashboard stats, applications list, activity feed, auto-rejection logic)

### API Routes (all under `app/api/`)
- `dashboard/applications/` — CRUD for job applications; `auto-reject/` endpoint runs as a Vercel cron (daily at 9 AM, configured in `vercel.json`)
- `dashboard/companies/`, `dashboard/documents/`, `dashboard/stats/`, `dashboard/analytics/`, `dashboard/activity/` — domain-specific endpoints
- `auth/signin/`, `auth/signup/` — credential auth endpoints
- `auth/passkey/` — WebAuthn registration and authentication flows
- `auth/master-password/` — master password setup/verify for encryption features
- `upload/` — Cloudinary-based file uploads (images, documents, company logos)
- All protected endpoints use `const session = await auth()` and check `session?.user?.id`

### Analytics / Telemetry
- **@codenificient/analytics-sdk** integrated via `lib/analytics.ts` (AppAnalytics wrapper class)
- Types in `types/analytics.ts`; API proxy at `app/api/analytics/track/route.ts`
- `<AnalyticsProvider>` in root layout auto-tracks page views on route changes
- Track auth events via `getAnalytics()?.authAction(...)` and custom events via `getAnalytics()?.custom(...)`
- Enabled in production by default; set `NEXT_PUBLIC_ANALYTICS_ENABLED=true` for dev

### Releases
- **semantic-release** automates versioning and changelog via conventional commits
- Config in `.releaserc.json`; commit lint rules in `.commitlintrc.json`
- GitHub Actions workflow in `.github/workflows/release.yml` triggers on push to `master` or `beta`
- Commit types: `feat` (minor), `fix`/`perf`/`refactor` (patch), `BREAKING CHANGE` (major), `docs`/`chore`/`style`/`test` (no release)

### Frontend Structure
- **Root layout** (`app/layout.tsx`): IBM Plex Mono + Sora, pre-paint theme script, AuthProvider, AnalyticsProvider, Toaster
- **Dashboard layout** (`app/dashboard/layout.tsx`): 196px console rail + scrolling main column
- Dashboard pages: main dashboard, applications, companies, calendar, contacts, documents, analytics, quick-actions
- Auth pages: `app/auth/signin/`, `app/auth/signup/`
- Profile page: `app/profile/`
- UI components in `components/ui/` are shadcn/ui based (use `cn()` from `lib/utils.ts` for class merging)
- Design tokens live in `app/globals.css`: `--bg --pn --br --fg --dim --ft --ac --af --wn`, exposed as Tailwind colours (`bg-bg`, `text-dim`, `border-br`, `text-ac`…). Theme is `data-theme` on `<html>`, defaulting to `prefers-color-scheme`
- Pipeline derivations (next step, action queue, stats, calendar events) are centralised in `lib/applications.ts`; screens read one applications array via `hooks/use-applications.ts` and project it
- `globals.css` also remaps the legacy violet/status Tailwind scales onto console tokens. Every page route is on the tokens directly now; the remap covers what the design docs never specified — the dialogs in `components/dashboard/`, the primitives they use (select, textarea, checkbox, label, toast, loading-spinner), and the error/loading/not-found boundaries. Delete a remap block once its surfaces are rebuilt
- Dashboard components in `components/dashboard/` (dialogs, lists, stats, header)

### Path Aliases
`@/*` maps to project root (configured in `tsconfig.json`). All imports use this alias.

### Environment Variables
Required: `DATABASE_URL`, `NEXTAUTH_URL`, `NEXTAUTH_SECRET`, `GITHUB_ID`, `GITHUB_SECRET`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`. Optional: `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`, `NEXT_PUBLIC_ANALYTICS_ENABLED`, `NEXT_PUBLIC_ANALYTICS_API_KEY`, `NEXT_PUBLIC_ANALYTICS_ENDPOINT`. See `env.example`.

### Code Style
- Spaces inside parentheses and around operators (e.g., `fn( arg )`, `a=b`)
- No semicolons in some files, inconsistent across codebase
- Package manager is **pnpm**
