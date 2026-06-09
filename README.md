# AgentStats

AgentStats is a production-oriented Valorant statistics web application built with Next.js 16, React 19, TypeScript, and Tailwind CSS 4.

## Current milestone

The repository currently implements the public product foundation:

- Responsive home and player search experience
- Agent, weapon, and map catalog routes backed by `valorant-api.com`
- Agent meta dashboard with live patch, roster distribution, patch comparison,
  and Riot platform notices
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
features require approved Riot credentials and infrastructure. They must not be
represented as live data without those dependencies.

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
```

## Environment

Copy `.env.local.example` to `.env.local` and add credentials only when the related integration is enabled. Never commit secrets.

Set `NEXT_PUBLIC_LEGAL_EMAIL` to the public address that should receive legal,
privacy, and misuse reports before deploying the site publicly.

## Product contract

`AGENT_PROMPT.md` is the complete product specification. The canonical product name is **AgentStats**; package names, paths, and database identifiers use `agentstats`.
