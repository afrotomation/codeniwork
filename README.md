# CodeniWork — Job Application Tracker

A job search console. Every application in one place with its next step, a queue of what is actually waiting on you, and deadlines surfaced before they go late.

[![Preview](https://api.microlink.io/?url=https%3A%2F%2Fcodeniwork.afrotomation.com&screenshot=true&meta=false&embed=screenshot.url&colorScheme=dark&screenshot.delay=4000)](https://codeniwork.afrotomation.com)

🌍 **Live:** [codeniwork.afrotomation.com](https://codeniwork.afrotomation.com)
&nbsp;·&nbsp; [![release](https://img.shields.io/github/v/release/afrotomation/codeniwork?label=release&color=4a7c37)](https://github.com/afrotomation/codeniwork/releases)

## Design

The interface is a console: warm charcoal or warm paper, IBM Plex Mono for the body with Sora for display type, and a single moss accent that only marks things that need a decision. Square, flat, hairline rules — no cards, no shadows, no gradients.

Both palettes ship. The theme follows `prefers-color-scheme` until you pick a side from the sidebar, after which the choice persists and is applied before first paint.

It is keyboard-first:

| Key | Does |
| --- | --- |
| `1`–`0` | Jump between sections |
| `N` | New application |
| `J` / `K` / `↵` | Move down / up / open a pipeline row |
| `/` | Focus the filter on any screen that has one |
| `E` | Edit the selected row |
| `T` / `←` / `→` | Today / previous / next month on the calendar |
| `⌘K` | Command line on quick actions |
| `⌘↵` | Run the open AI tool |

## Screens

| Route | What it is |
| --- | --- |
| `/dashboard` | The pipeline: stats strip, action queue, and the table ordered by what needs answering soonest |
| `/dashboard/discover` | Jobs from three boards, scored against your parsed resume |
| `/dashboard/applications` | Every application, filtered from a command line (`stage:open sort:next-step`), rows expand in place |
| `/dashboard/companies` | A register with reply rate per company |
| `/dashboard/calendar` | Month grid, the next seven days, and anything overdue |
| `/dashboard/analytics` | Response / interview / offer rates with month-over-month deltas, six months of progress, the stage funnel |
| `/dashboard/documents` | Resumes and cover letters by version |
| `/dashboard/contacts` | People, ordered by who you have not spoken to |
| `/dashboard/ai-tools` | Parse resume, score match, cover letter, interview prep |
| `/dashboard/quick-actions` | Everything by keystroke |
| `/profile` | Account, passkeys, encryption, data export |

Filters are a query language rather than a form — `stage:`, `remote:`, `sort:` and `match:>70` narrow, anything else is free text.

## Stack

- **Next.js 16** (App Router) and **React 19**
- **TypeScript**, **Tailwind CSS v4** (CSS-first config, no `tailwind.config.js`)
- **PostgreSQL** via **Drizzle ORM** on the `node-postgres` driver
- **NextAuth.js v5** — email/password credentials plus WebAuthn passkeys
- **Bun** for install and scripts; Docker `standalone` output for deployment

## Quick start

Requires [Bun](https://bun.sh) and a PostgreSQL database.

```bash
git clone git@github.com:afrotomation/codeniwork.git
cd codeniwork
bun install
cp env.example .env.local   # fill in DATABASE_URL and NEXTAUTH_SECRET
bun run db:push
bun run dev
```

Then open [localhost:3000](http://localhost:3000).

### Environment

Only two variables are needed to boot:

| Variable | Notes |
| --- | --- |
| `DATABASE_URL` | PostgreSQL connection string |
| `NEXTAUTH_SECRET` | `openssl rand -base64 32` |
| `NEXTAUTH_URL` | Defaults to the request origin; set it behind a proxy |

Optional: `CLOUDINARY_*` for document and image uploads, `AI_ENDPOINT` / `AI_API_KEY` / `AI_MODEL` for the AI tools, `NEXT_PUBLIC_ANALYTICS_*` for telemetry, `CRON_SECRET` to authenticate the auto-reject cron.

`env.example` still lists `GITHUB_*` and `GOOGLE_*` under OAuth. No OAuth provider is registered in `lib/auth.ts` today — sign-in is credentials and passkeys — so those are reserved, not required.

## Scripts

```bash
bun run dev          # Development server
bun run build        # Production build
bun run lint         # ESLint
bun run db:generate  # Generate migrations from the schema
bun run db:push      # Push the schema to the database
bun run db:studio    # Drizzle Studio
bun run db:seed      # Seed sample data
bun run auto-reject  # Close applications silent past the window
```

## Layout

```
app/
  api/          Route handlers; each checks the session itself
  auth/         Sign in and sign up
  dashboard/    The eleven console screens
components/
  dashboard/    Screen-level pieces, tables, dialogs
  ui/           Primitives — button, badge, dialog, sidebar
lib/
  applications.ts  Pipeline derivations: next step, action queue, stats, calendar
  job-match.ts     Resume-to-listing scoring
  db/              Drizzle schema and queries
  auth.ts          NextAuth configuration
hooks/            useApplications, useTheme, usePasskeyAuth
proxy.ts          Route guard
```

Every projection on a screen is derived from one read of the pipeline, so the counts on the strip, the queue and the table cannot disagree.

## Deployment

Built as a Docker image (`output: 'standalone'`, `node:22-alpine`) and deployed to Coolify, which redeploys on push to `master`. A health check is served at `/api/health`.

Releases are cut by semantic-release from conventional commits on push to `master` — `feat` minor, `fix`/`perf`/`refactor` patch, `BREAKING CHANGE` major.

## Contributing

Commits follow [Conventional Commits](https://www.conventionalcommits.org/); commitlint enforces this. Branch, commit, and open a pull request against `master`.

## License

MIT — see [LICENSE](LICENSE).

---

Built by [CodenificienT](https://tioye.dev)
