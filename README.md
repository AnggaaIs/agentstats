# AgentStats

AgentStats is a production-oriented Valorant statistics web application built with Next.js 16, React 19, TypeScript, and Tailwind CSS 4.

## Current milestone

The repository currently implements the public product foundation:

- Responsive home and player search experience
- Agent, weapon, and map catalog routes backed by `valorant-api.com`
- Flexible two-weapon comparison across economy, handling, damage ranges,
  penetration, ADS, and alternate fire
- Anonymous community favorites with one agent choice per role, one map,
  one weapon, and one skin per weapon, with protected voting and live category
  leaderboards
- Agent meta dashboard with live patch, roster distribution, and a direct link
  to official patch notes
- Dedicated Riot platform status page covering every supported region
- Historical Act selection and exact Immortal/Radiant ladder distribution by
  region on the competitive leaderboard
- Dynamic agent and weapon detail routes
- Player, match, and leaderboard route foundations
- Consistent loading, error, and not-found states
- Server-side Riot API client boundary and validated route handlers
- Accessible navigation, form controls, focus states, and reduced-motion support
- Privacy, terms, cookies, acceptable use, disclaimer, and data-request pages

Riot platform notices use the official `VAL-STATUS-V1` endpoint. AgentStats does
not present fabricated pick or win rates: those metrics require an approved,
opt-in match dataset and sufficient sample sizes.

Riot account, match, ranked, authentication, favorites, and database-backed
player features require approved Riot credentials. Community favorites use the
configured PostgreSQL database and do not require a Riot account.

## Local development

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

## Validation

```bash
pnpm lint
pnpm typecheck
pnpm build
pnpm db:deploy
```

## Environment

Copy `.env.local.example` to `.env.local` and add credentials only when the
related integration is enabled. Never commit secrets.

This project uses:
- `.env.local` for development
- `.env` for production migrations run from your laptop

Set `NEXT_PUBLIC_LEGAL_EMAIL` to the public address that should receive legal,
privacy, and misuse reports before deploying the site publicly.

## Database migrations

Use `DATABASE_URL` for the pooled application connection. For Supabase, set
`DIRECT_URL` to the direct database connection on port `5432`; Prisma uses it
for migrations. Keep both values private.

```bash
DATABASE_URL=postgresql://...pooler...:6543/postgres
DIRECT_URL=postgresql://...direct...:5432/postgres
AUTH_SECRET=a-long-random-secret
```

### Development

After changing `prisma/schema.prisma`, create and apply a migration locally:

```bash
pnpm db:migrate --name describe_your_change
pnpm db:generate
```

Inspect the generated SQL in `prisma/migrations`, test the app, and commit the
schema and migration files together. To open the database viewer:

```bash
pnpm db:studio
```

Do not use `prisma db push` for changes that will reach production because it
does not create a migration history.

### Production

Add `DATABASE_URL`, `DIRECT_URL`, and `AUTH_SECRET` to the production
environment. Apply only committed migrations:

```bash
pnpm install --frozen-lockfile
pnpm db:deploy
pnpm build
```

`pnpm db:deploy` is configured to read production database values from `.env`.
`pnpm db:migrate` and `pnpm db:studio` stay on `.env.local`.

On Vercel, run `pnpm db:deploy` from CI or your terminal before promoting the
deployment. Do not run `prisma migrate dev` against the production database.
The `postinstall` script already generates Prisma Client during installation.

## Product contract

`AGENT_PROMPT.md` is the complete product specification. The canonical product name is **AgentStats**; package names, paths, and database identifiers use `agentstats`.
