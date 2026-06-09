# AGENT PROMPT — AgentStats

# Version: 1.0.0

# Scope: Full-stack Next.js 15 application, production-grade

---

## ROLE & OBJECTIVE

You are a senior full-stack engineer building a production-grade **Valorant Stats Web Application** called **AgentStats**. Your job is to implement every feature described in this document with zero shortcuts, following company engineering standards throughout. Every file you create must be immediately deployable, testable, and maintainable by another engineer who has never seen this codebase.

---

## TECH STACK (NON-NEGOTIABLE)

| Layer         | Technology                                                    |
| ------------- | ------------------------------------------------------------- |
| Framework     | Next.js 15 (App Router, React 19)                             |
| Language      | TypeScript 5 — strict mode, no `any`                          |
| Styling       | Tailwind CSS v4 + shadcn/ui (primitives only)                 |
| HTTP (server) | Native `fetch` with `next: { revalidate }` tags               |
| HTTP (client) | `axios` or native fetch via custom hooks                      |
| State         | Zustand (global), React Query / TanStack Query (server state) |
| Auth          | NextAuth.js v5 with Riot RSO (OAuth)                          |
| ORM           | Prisma + PostgreSQL (Neon or Supabase)                        |
| Validation    | Zod — all API input/output schemas                            |
| Testing       | Vitest + React Testing Library + Playwright (E2E)             |
| Linting       | ESLint (Next.js config) + Prettier                            |
| CI/CD         | GitHub Actions → Vercel                                       |

---

## PROJECT STRUCTURE

```
agentstats/
├── .github/
│   └── workflows/
│       ├── ci.yml                    # lint, typecheck, test on every PR
│       └── deploy.yml                # deploy to Vercel on merge to main
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── public/
│   └── placeholder-agent.png
├── src/
│   ├── app/
│   │   ├── layout.tsx                # Root layout — ThemeProvider, fonts, metadata
│   │   ├── page.tsx                  # Home — hero search bar
│   │   ├── not-found.tsx
│   │   ├── error.tsx
│   │   ├── loading.tsx
│   │   │
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx        # Login with Riot SSO
│   │   │   └── callback/page.tsx     # OAuth callback handler
│   │   │
│   │   ├── player/
│   │   │   └── [region]/
│   │   │       └── [name]/
│   │   │           └── [tag]/
│   │   │               ├── page.tsx          # Player profile overview
│   │   │               ├── loading.tsx       # Skeleton loader
│   │   │               ├── error.tsx
│   │   │               └── matches/
│   │   │                   └── page.tsx      # Full match history
│   │   │
│   │   ├── match/
│   │   │   └── [matchId]/
│   │   │       ├── page.tsx          # Match detail — full scoreboard
│   │   │       └── loading.tsx
│   │   │
│   │   ├── leaderboard/
│   │   │   └── page.tsx              # Ranked leaderboard by region/act
│   │   │
│   │   ├── agents/
│   │   │   ├── page.tsx              # Agent tier list & stats
│   │   │   └── [uuid]/
│   │   │       └── page.tsx          # Single agent detail page
│   │   │
│   │   ├── weapons/
│   │   │   ├── page.tsx              # All weapons with stats
│   │   │   └── [uuid]/
│   │   │       └── page.tsx          # Weapon detail + skin gallery
│   │   │
│   │   ├── maps/
│   │   │   └── page.tsx              # Map pool overview
│   │   │
│   │   └── api/
│   │       ├── auth/[...nextauth]/
│   │       │   └── route.ts          # NextAuth handler
│   │       ├── player/
│   │       │   └── route.ts          # GET ?name=&tag=&region=
│   │       ├── matches/
│   │       │   ├── route.ts          # GET ?puuid=&region=
│   │       │   └── [matchId]/
│   │       │       └── route.ts      # GET single match
│   │       ├── leaderboard/
│   │       │   └── route.ts          # GET ?region=&actId=&size=
│   │       └── status/
│   │           └── route.ts          # GET server status
│   │
│   ├── components/
│   │   ├── ui/                       # shadcn output — DO NOT edit manually
│   │   │
│   │   ├── layout/
│   │   │   ├── Navbar.tsx
│   │   │   ├── Footer.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   └── ThemeToggle.tsx
│   │   │
│   │   ├── search/
│   │   │   ├── SearchBar.tsx         # Main player search input
│   │   │   ├── SearchSuggestions.tsx # Debounced dropdown
│   │   │   └── RecentSearches.tsx    # Persisted via localStorage
│   │   │
│   │   ├── player/
│   │   │   ├── PlayerHeader.tsx      # Name, tag, region, rank, avatar
│   │   │   ├── PlayerBanner.tsx      # Player card image as banner
│   │   │   ├── RankCard.tsx          # Current rank + peak rank
│   │   │   ├── RankBadge.tsx         # Inline rank icon + tier label
│   │   │   ├── StatsSummary.tsx      # Win rate, K/D/A, HS%, ACS overview
│   │   │   ├── AgentStats.tsx        # Per-agent win rate + playtime table
│   │   │   ├── WeaponStats.tsx       # Most used weapon + accuracy
│   │   │   ├── MapStats.tsx          # Win rate per map chart
│   │   │   └── PerformanceTrend.tsx  # RR over last N matches (recharts)
│   │   │
│   │   ├── match/
│   │   │   ├── MatchHistoryList.tsx  # Virtualized list of MatchCards
│   │   │   ├── MatchCard.tsx         # Single match row — outcome/score/agent
│   │   │   ├── MatchDetail.tsx       # Full match view container
│   │   │   ├── Scoreboard.tsx        # Team split scoreboard table
│   │   │   ├── PlayerRow.tsx         # Single player row in scoreboard
│   │   │   ├── RoundTimeline.tsx     # Round-by-round outcome visualization
│   │   │   ├── EconomyChart.tsx      # Per-round economy (recharts bar)
│   │   │   └── KillFeed.tsx          # Kill events timeline
│   │   │
│   │   ├── agents/
│   │   │   ├── AgentCard.tsx         # Grid card with portrait + role
│   │   │   ├── AgentPortrait.tsx     # Optimized Image wrapper
│   │   │   ├── AgentAbilityList.tsx  # 4 abilities with icon + description
│   │   │   ├── AgentRoleIcon.tsx     # Role icon (Controller/Duelist/etc)
│   │   │   └── AgentTierBadge.tsx    # Community tier (S/A/B/C)
│   │   │
│   │   ├── weapons/
│   │   │   ├── WeaponCard.tsx        # Grid card with render image
│   │   │   ├── WeaponStats.tsx       # Damage table per range
│   │   │   ├── WeaponSkinGallery.tsx # Skin list with chroma picker
│   │   │   └── SkinChromaViewer.tsx  # Chroma image switcher
│   │   │
│   │   ├── maps/
│   │   │   ├── MapCard.tsx           # Splash image + name
│   │   │   └── MapMinimap.tsx        # Minimap image display
│   │   │
│   │   ├── leaderboard/
│   │   │   ├── LeaderboardTable.tsx  # Full ranked table
│   │   │   └── LeaderboardRow.tsx    # Single player rank row
│   │   │
│   │   └── shared/
│   │       ├── KdaDisplay.tsx        # K / D / A with color coding
│   │       ├── WinRateBadge.tsx      # Win% pill with color
│   │       ├── AcsBadge.tsx          # Average Combat Score badge
│   │       ├── HeadshotBar.tsx       # Headshot% progress bar
│   │       ├── OutcomeBadge.tsx      # WIN / LOSS / DRAW pill
│   │       ├── RegionSelector.tsx    # ap / na / eu / kr / br / latam
│   │       ├── QueueFilter.tsx       # competitive / unrated / deathmatch
│   │       ├── ActSelector.tsx       # Current/past act dropdown
│   │       ├── EmptyState.tsx        # No data illustration + CTA
│   │       ├── ErrorState.tsx        # Error illustration + retry
│   │       └── LoadingSkeleton.tsx   # Generic skeleton variants
│   │
│   ├── lib/
│   │   ├── riot/
│   │   │   ├── client.ts             # Base fetch wrapper with auth headers
│   │   │   ├── account.ts            # getAccount, getAccountByPuuid
│   │   │   ├── match.ts              # getMatchList, getMatch
│   │   │   ├── ranked.ts             # getLeaderboard
│   │   │   ├── status.ts             # getPlatformStatus
│   │   │   └── regions.ts            # region/shard mapping constants
│   │   │
│   │   ├── valorant-api/
│   │   │   ├── client.ts             # Base fetch with default cache
│   │   │   ├── agents.ts             # getAgents, getAgentByUuid
│   │   │   ├── weapons.ts            # getWeapons, getWeaponByUuid
│   │   │   ├── maps.ts               # getMaps, getMapByUuid
│   │   │   ├── competitive-tiers.ts  # getCompetitiveTiers
│   │   │   ├── seasons.ts            # getSeasons
│   │   │   └── player-cards.ts       # getPlayerCards
│   │   │
│   │   ├── db/
│   │   │   ├── client.ts             # Prisma singleton
│   │   │   └── queries/
│   │   │       ├── favorites.ts      # addFavorite, removeFavorite
│   │   │       └── search-history.ts # saveSearch, getRecentSearches
│   │   │
│   │   ├── auth/
│   │   │   └── config.ts             # NextAuth config with Riot RSO provider
│   │   │
│   │   ├── cache/
│   │   │   └── keys.ts               # Centralized cache tag constants
│   │   │
│   │   └── utils/
│   │       ├── cn.ts                 # clsx + tailwind-merge
│   │       ├── format.ts             # formatKDA, formatACS, formatWinRate
│   │       ├── rank.ts               # tierToName, tierToColor
│   │       └── queue.ts              # queueIdToLabel
│   │
│   ├── hooks/
│   │   ├── usePlayer.ts              # Fetch player by riot id
│   │   ├── useMatches.ts             # Paginated match history
│   │   ├── useAgents.ts              # All agents from valorant-api.com
│   │   ├── useWeapons.ts             # All weapons
│   │   ├── useRecentSearches.ts      # localStorage recent searches
│   │   └── useDebounce.ts            # Generic debounce hook
│   │
│   ├── stores/
│   │   ├── ui.store.ts               # sidebar open, theme preference
│   │   └── search.store.ts           # active search state
│   │
│   ├── types/
│   │   ├── riot/
│   │   │   ├── account.ts
│   │   │   ├── match.ts
│   │   │   ├── ranked.ts
│   │   │   └── status.ts
│   │   ├── valorant-api/
│   │   │   ├── agent.ts
│   │   │   ├── weapon.ts
│   │   │   ├── map.ts
│   │   │   └── season.ts
│   │   └── app/
│   │       ├── player.ts             # Enriched player type (Riot + assets)
│   │       └── match.ts              # Enriched match type
│   │
│   └── schemas/
│       ├── riot/
│       │   ├── account.schema.ts     # Zod schemas for Riot API responses
│       │   └── match.schema.ts
│       └── api/
│           ├── player.schema.ts      # Zod for Route Handler input validation
│           └── leaderboard.schema.ts
│
├── tests/
│   ├── unit/
│   │   ├── utils/format.test.ts
│   │   └── utils/rank.test.ts
│   ├── integration/
│   │   ├── api/player.test.ts
│   │   └── api/matches.test.ts
│   └── e2e/
│       ├── search.spec.ts
│       └── player-profile.spec.ts
│
├── .env.local.example
├── .env.test
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── vitest.config.ts
├── playwright.config.ts
├── prisma/schema.prisma
└── package.json
```

---

## ENVIRONMENT VARIABLES

```bash
# .env.local.example — commit this file, never commit .env.local

# Riot Games API
RIOT_API_KEY=RGAPI-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-here

# Riot RSO (OAuth — from Riot Developer Portal)
RIOT_CLIENT_ID=your-rso-client-id
RIOT_CLIENT_SECRET=your-rso-client-secret

# Database
DATABASE_URL=postgresql://user:password@host:5432/agentstats

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=AgentStats
```

---

## DATABASE SCHEMA (Prisma)

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id            String    @id @default(cuid())
  puuid         String    @unique         // Riot PUUID
  gameName      String
  tagLine       String
  region        String
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  favorites     Favorite[]
  searchHistory SearchHistory[]

  @@index([puuid])
}

model Favorite {
  id            String   @id @default(cuid())
  userId        String
  targetPuuid   String
  targetName    String
  targetTag     String
  targetRegion  String
  createdAt     DateTime @default(now())

  user          User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, targetPuuid])
  @@index([userId])
}

model SearchHistory {
  id        String   @id @default(cuid())
  userId    String
  query     String                          // "TenZ#NA1"
  region    String
  createdAt DateTime @default(now())

  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, createdAt])
}
```

---

## FEATURES — COMPLETE SPECIFICATION

### FEATURE 1 — HOME PAGE

**Route:** `app/page.tsx`

**UI:**

- Full-viewport hero section, dark background
- AgentStats logo + tagline: "Track your Valorant stats. No fluff."
- Large search bar — input format: `PlayerName#TAG` or separate Name + Tag fields
- Region dropdown next to search: AP / NA / EU / KR / BR / LATAM
- Recent searches shown below input (max 5, stored in localStorage)
- Trending searched players section (optional placeholder for now)

**Behavior:**

- On submit → navigate to `/player/{region}/{name}/{tag}`
- Validate: name min 3 chars, tag 2–5 chars, region required
- Show inline error if format invalid
- Save valid searches to localStorage with timestamp

---

### FEATURE 2 — PLAYER PROFILE PAGE

**Route:** `app/player/[region]/[name]/[tag]/page.tsx`

**Data sources:**

- Riot `/riot/account/v1/accounts/by-riot-id/{name}/{tag}` → get `puuid`
- Riot `/val/match/v1/matchlists/by-puuid/{puuid}` → get last 20 match IDs
- Riot `/val/ranked/v1/leaderboards/by-act/{actId}` → check if player is in top ladder
- valorant-api.com `/competitivetiers` → rank icons + tier names
- valorant-api.com `/playercards` → player banner image
- valorant-api.com `/agents` → enrich agent data

**Sections (tabs):**

#### 2a. OVERVIEW TAB

- `PlayerHeader` — name, tag, region, account level badge
- `PlayerBanner` — player card image as wide banner (from `playerCardId` in match data)
- `RankCard` — current rank icon + tier name + RR + peak rank this act
- `StatsSummary` — aggregate from last 20 matches:
  - Win Rate (%), K/D ratio, Average ACS, Average HS%, Average Damage/Round
  - Display as 5 metric cards in a grid
- `PerformanceTrend` — line chart of RR gain/loss over last 20 competitive matches (recharts)
- `AgentStats` — table of top 5 agents played: agent portrait, agent name, games played, win rate, avg KDA, avg ACS — sortable columns
- `MapStats` — horizontal bar chart of win rate per map
- `WeaponStats` — top 3 weapons used: weapon icon, name, kills, headshot%

#### 2b. MATCHES TAB

- Filter bar: queue type (competitive / unrated / deathmatch / spike rush / all)
- Virtualized list of `MatchCard` components (react-virtual or CSS)
- Each `MatchCard` shows:
  - WIN/LOSS/DRAW badge (color-coded)
  - Agent portrait (from valorant-api.com bustPortrait URL)
  - Map name + map splash (small)
  - Score: "13 – 7"
  - KDA: "22 / 10 / 5"
  - ACS: "287"
  - HS%: "34%"
  - Time ago: "2 hours ago" (date-fns)
  - Queue type badge
  - Click → navigate to `/match/{matchId}`
- Load more button (pagination — 20 per page)

#### 2c. AGENTS TAB (detailed)

- Full table: all agents played this act
- Columns: Agent, Games, Win%, KDA, ACS, HS%, DDΔ (damage delta)
- Sortable by any column
- Agent portrait thumbnail

#### 2d. WEAPONS TAB (detailed)

- All weapons used in tracked matches
- Columns: Weapon, Kills, HS%, Body%, Leg%, Avg Kills/Game
- Weapon icon from valorant-api.com

---

### FEATURE 3 — MATCH DETAIL PAGE

**Route:** `app/match/[matchId]/page.tsx`

**Data sources:**

- Riot `/val/match/v1/matches/{matchId}` → full match object
- valorant-api.com `/agents` → portraits for all 10 players
- valorant-api.com `/maps` → map splash image
- valorant-api.com `/weapons` → weapon icons in kill events

**Sections:**

#### 3a. MATCH HEADER

- Map name + map splash image as background
- Queue type + date + duration
- Final score: "Team A 13 — 8 Team B"
- Winning team label

#### 3b. SCOREBOARD

- Split by team (Attackers / Defenders at round 1)
- Each player row (`PlayerRow`):
  - Agent portrait
  - Player name (linked to their profile)
  - ACS | K | D | A | HS% | First Bloods | Plants | Defuses | Economy Rating
- MVP badge on top ACS player of winning team
- Team totals row at bottom

#### 3c. ROUND TIMELINE

- 25-round horizontal timeline
- Each round: outcome bubble (win=blue/loss=red), spike status icon, round type (pistol/eco/full buy/force)
- Hover on round → tooltip with round economy and round winner

#### 3d. ECONOMY CHART

- Stacked bar chart per round per team (recharts)
- Shows spent credits per team per round
- Color: green team vs red team

#### 3e. KILL FEED

- Chronological list of all kills in the match
- Each entry: killer name → weapon icon → victim name → (headshot badge if HS)
- Filterable by player

---

### FEATURE 4 — LEADERBOARD PAGE

**Route:** `app/leaderboard/page.tsx`

**Data sources:**

- Riot `/val/ranked/v1/leaderboards/by-act/{actId}` → top 200 players
- valorant-api.com `/competitivetiers` → Radiant/Immortal icons

**UI:**

- Region selector (AP / NA / EU / KR / BR / LATAM)
- Act selector (current + past acts from `/seasons`)
- Table: Rank # | Player Name | RR | Win% | Games Played | Region
- Top 3 rows highlighted (gold/silver/bronze tint)
- Click player name → navigate to their profile
- Server-side rendered, revalidate every 10 minutes

---

### FEATURE 5 — AGENTS PAGE

**Route:** `app/agents/page.tsx`

**Data source:** valorant-api.com `/agents?isPlayableCharacter=true`

**UI:**

- Role filter tabs: All / Duelist / Controller / Initiator / Sentinel
- Grid of `AgentCard` components
- Each card: full portrait image, agent name, role icon, role label
- Click → `/agents/{uuid}`

**Agent Detail Page** — `app/agents/[uuid]/page.tsx`

- Large agent art (fullPortrait)
- Agent name, role, origin description
- Ability list (Q/E/C/X) with icon, name, description, cost
- Background lore text

---

### FEATURE 6 — WEAPONS PAGE

**Route:** `app/weapons/page.tsx`

**Data source:** valorant-api.com `/weapons`

**UI:**

- Filter by category: Sidearms / SMGs / Shotguns / Rifles / Snipers / Machine Guns / Melee
- Grid of `WeaponCard` components
- Each card: weapon render image, name, category, base cost
- Click → `/weapons/{uuid}`

**Weapon Detail Page** — `app/weapons/[uuid]/page.tsx`

- Full weapon render image
- Stats table: fire rate, magazine size, reload time, equip time
- Damage table: Head / Body / Leg per distance zone (0-15m / 15-30m / 30-50m / 50m+)
- Skin gallery — all skins in a grid
  - Click skin → show chromas
  - Click chroma → update displayed skin image

---

### FEATURE 7 — MAPS PAGE

**Route:** `app/maps/page.tsx`

**Data source:** valorant-api.com `/maps`

**UI:**

- Grid of `MapCard` — splash image + map name
- Click → expand to show full splash + minimap side by side
- Map callouts section (listed from valorant-api.com callout data)

---

### FEATURE 8 — AUTH + FAVORITES (Optional — RSO Required)

**Route:** `app/(auth)/login/page.tsx`

**Flow:**

- "Login with Riot" button → redirect to Riot SSO
- On return, create User in DB (upsert by PUUID)
- Store session via NextAuth

**Favorites:**

- Logged-in users can favorite players
- Favorites shown in sidebar / navbar
- Stored in DB (Favorite model)
- Toggle heart icon on PlayerHeader

---

## API ROUTE HANDLERS — SPECIFICATION

All Route Handlers must:

1. Validate input with Zod before processing
2. Return consistent JSON shape: `{ data, error, status }`
3. Use proper HTTP status codes
4. Never expose RIOT_API_KEY in response
5. Rate limit consideration — add headers `X-RateLimit-*` if needed

```typescript
// Standard response shape
type ApiResponse<T> = {
  data: T | null;
  error: string | null;
  status: number;
};
```

### `GET /api/player`

**Input:** `?name=string&tag=string&region=string`
**Validation:** Zod schema — name min 3 max 16, tag min 2 max 5, region enum
**Process:** Fetch Riot account → return `{ puuid, gameName, tagLine }`
**Cache:** `revalidate: 300` (5 min)
**Errors:** 400 invalid params | 404 player not found | 429 rate limited | 500 upstream

### `GET /api/matches`

**Input:** `?puuid=string&region=string&queue=string&start=number&count=number`
**Process:** Fetch match list → for each ID fetch match detail → enrich with agent/map assets
**Cache:** `revalidate: 300`
**Note:** Batch fetch match details with `Promise.all` (max 5 concurrent)

### `GET /api/matches/[matchId]`

**Process:** Fetch single match → enrich all player characterIds with agent data
**Cache:** `revalidate: false` (match data is immutable)

### `GET /api/leaderboard`

**Input:** `?region=string&actId=string&size=number`
**Default size:** 200 (Riot API max)
**Cache:** `revalidate: 600` (10 min)

### `GET /api/status`

**Process:** Fetch Riot platform status
**Cache:** `revalidate: 60` (1 min — this can change fast)

---

## CACHING STRATEGY

```typescript
// src/lib/cache/keys.ts
export const CACHE_TAGS = {
  AGENTS: "agents",
  WEAPONS: "weapons",
  MAPS: "maps",
  SEASONS: "seasons",
  COMPETITIVE_TIERS: "competitive-tiers",
  PLAYER: (puuid: string) => `player-${puuid}`,
  MATCH: (matchId: string) => `match-${matchId}`,
  LEADERBOARD: (region: string, actId: string) =>
    `leaderboard-${region}-${actId}`,
} as const;

// Revalidation times (seconds)
export const CACHE_TTL = {
  STATIC_ASSETS: 86400, // 24h — agents, weapons, maps (only change on patch)
  LEADERBOARD: 600, // 10min
  MATCH_LIST: 300, // 5min
  MATCH_DETAIL: false, // immutable — never revalidate
  PLATFORM_STATUS: 60, // 1min
} as const;
```

---

## ERROR HANDLING STANDARD

Every async server function must use this pattern:

```typescript
// lib/utils/result.ts
export type Result<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; statusCode: number };

export async function tryCatch<T>(fn: () => Promise<T>): Promise<Result<T>> {
  try {
    const data = await fn();
    return { ok: true, data };
  } catch (err) {
    if (err instanceof RiotApiError) {
      return { ok: false, error: err.message, statusCode: err.status };
    }
    return { ok: false, error: "Internal server error", statusCode: 500 };
  }
}
```

Custom error classes:

```typescript
// lib/errors.ts
export class RiotApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly endpoint: string,
  ) {
    super(message);
    this.name = "RiotApiError";
  }
}

export class ValidationError extends Error {
  constructor(
    message: string,
    public readonly fields: Record<string, string>,
  ) {
    super(message);
    this.name = "ValidationError";
  }
}
```

---

## ZOD SCHEMAS — EXAMPLES

```typescript
// src/schemas/api/player.schema.ts
import { z } from "zod";

export const REGIONS = ["ap", "na", "eu", "kr", "br", "latam"] as const;

export const PlayerSearchSchema = z.object({
  name: z.string().min(3).max(16).trim(),
  tag: z
    .string()
    .min(2)
    .max(5)
    .trim()
    .regex(/^[a-zA-Z0-9]+$/, "Tag must be alphanumeric"),
  region: z.enum(REGIONS),
});

export const MatchListQuerySchema = z.object({
  puuid: z.string().uuid(),
  region: z.enum(REGIONS),
  queue: z
    .enum(["competitive", "unrated", "deathmatch", "spikerush", "ggteam", ""])
    .optional(),
  start: z.coerce.number().min(0).default(0),
  count: z.coerce.number().min(1).max(20).default(20),
});

export type PlayerSearchInput = z.infer<typeof PlayerSearchSchema>;
export type MatchListQuery = z.infer<typeof MatchListQuerySchema>;
```

---

## COMPONENT CONVENTIONS

### File structure per component:

```
components/player/PlayerCard.tsx     # component code
components/player/PlayerCard.test.tsx # unit test co-located
```

### Component template:

```typescript
// Every component follows this exact structure

import { type FC } from 'react'
import { cn } from '@/lib/utils/cn'

// 1. Props interface — always explicit, no implicit any
interface PlayerCardProps {
  puuid: string
  gameName: string
  tagLine: string
  region: string
  className?: string
}

// 2. Named export (never default for components)
export const PlayerCard: FC<PlayerCardProps> = ({
  puuid,
  gameName,
  tagLine,
  region,
  className,
}) => {
  return (
    <div className={cn('rounded-xl border border-white/10 bg-neutral-900 p-4', className)}>
      {/* ... */}
    </div>
  )
}
```

### Rules:

- Named exports only for components (no `export default`)
- Props interface always defined explicitly above the component
- `className?: string` prop on all layout components for composability
- `cn()` utility for all conditional class merging
- No inline styles — Tailwind only
- Server Components by default — add `'use client'` only when needed (event handlers, hooks, browser APIs)

---

## NEXT.JS IMAGE CONFIGURATION

```typescript
// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "media.valorant-api.com",
        pathname: "/**",
      },
    ],
    formats: ["image/avif", "image/webp"],
  },
  // Enable partial prerendering in Next 15
  experimental: {
    ppr: true,
  },
};

export default nextConfig;
```

---

## DESIGN SYSTEM

### Color tokens (Tailwind CSS custom theme):

```typescript
// tailwind.config.ts
const config = {
  theme: {
    extend: {
      colors: {
        valorant: {
          red: "#FF4655", // Valorant brand red
          white: "#ECE8E1", // Off-white
          black: "#0F1923", // Deep background
          gray: "#1F2731", // Card background
          muted: "#7B8FA3", // Secondary text
        },
        rank: {
          iron: "#4B4B4B",
          bronze: "#8B4513",
          silver: "#A8A9AD",
          gold: "#FFD700",
          platinum: "#00B4C8",
          diamond: "#9B6FFF",
          ascendant: "#00FF94",
          immortal: "#FF4655",
          radiant: "#FFFFC0",
        },
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "monospace"],
      },
    },
  },
};
```

### Spacing conventions:

- Component padding: `p-4` (16px) — cards
- Section gaps: `gap-6` (24px) — between sections
- List item gaps: `gap-3` (12px) — between rows
- Inner element gaps: `gap-2` (8px) — icon + text pairs

---

## UTILITY FUNCTIONS — REQUIRED

```typescript
// src/lib/utils/format.ts

export function formatKDA(
  kills: number,
  deaths: number,
  assists: number,
): string {
  const kd = deaths === 0 ? kills : (kills / deaths).toFixed(2);
  return `${kills} / ${deaths} / ${assists} (${kd})`;
}

export function formatACS(acs: number): string {
  return Math.round(acs).toString();
}

export function formatWinRate(wins: number, total: number): string {
  if (total === 0) return "0%";
  return `${Math.round((wins / total) * 100)}%`;
}

export function formatHeadshotPercent(
  headshots: number,
  total: number,
): string {
  if (total === 0) return "0%";
  return `${Math.round((headshots / total) * 100)}%`;
}

export function formatTimeAgo(isoDate: string): string {
  // use date-fns formatDistanceToNow
}

export function formatMatchDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}
```

```typescript
// src/lib/utils/rank.ts

const TIER_NAMES: Record<number, string> = {
  0: "Unranked",
  3: "Iron 1",
  4: "Iron 2",
  5: "Iron 3",
  6: "Bronze 1",
  7: "Bronze 2",
  8: "Bronze 3",
  9: "Silver 1",
  10: "Silver 2",
  11: "Silver 3",
  12: "Gold 1",
  13: "Gold 2",
  14: "Gold 3",
  15: "Platinum 1",
  16: "Platinum 2",
  17: "Platinum 3",
  18: "Diamond 1",
  19: "Diamond 2",
  20: "Diamond 3",
  21: "Ascendant 1",
  22: "Ascendant 2",
  23: "Ascendant 3",
  24: "Immortal 1",
  25: "Immortal 2",
  26: "Immortal 3",
  27: "Radiant",
};

export function tierToName(tier: number): string {
  return TIER_NAMES[tier] ?? "Unranked";
}

export function tierToColorClass(tier: number): string {
  if (tier >= 27) return "text-yellow-300";
  if (tier >= 24) return "text-red-400";
  if (tier >= 21) return "text-emerald-400";
  if (tier >= 18) return "text-violet-400";
  if (tier >= 15) return "text-cyan-400";
  if (tier >= 12) return "text-yellow-500";
  if (tier >= 9) return "text-gray-400";
  if (tier >= 6) return "text-amber-700";
  return "text-neutral-500";
}
```

---

## TESTING REQUIREMENTS

### Unit tests (Vitest):

- All `lib/utils/*` functions must have 100% coverage
- All Zod schemas must have tests for valid + invalid inputs
- All custom hooks must have tests with mocked API responses

### Integration tests (Vitest + MSW):

- All Route Handlers (`app/api/*`) must be tested
- Mock Riot API and valorant-api.com with MSW (Mock Service Worker)
- Test happy path + 404 + 429 + 500 error cases

### E2E tests (Playwright):

- Search flow: type name → submit → see profile page
- Match card click → see match detail
- Leaderboard: region switch → table updates
- Responsive: test at 375px / 768px / 1280px

---

## ACCESSIBILITY REQUIREMENTS

- All images must have meaningful `alt` text (agent name, weapon name, etc.)
- All interactive elements must be keyboard-navigable
- Color is never the only indicator — pair with text or icon
- Focus rings must be visible (`focus-visible:ring-2`)
- ARIA labels on icon-only buttons
- Reduced motion respected via `prefers-reduced-motion` media query
- Minimum contrast ratio 4.5:1 for body text

---

## PERFORMANCE REQUIREMENTS

- LCP < 2.5s on 3G connection
- CLS < 0.1 — use skeleton loaders with fixed dimensions, never layout shifts
- INP < 200ms — debounce search inputs (300ms), virtualize long lists
- All agent/weapon/map images: use `next/image` with `priority` on above-fold images
- Code split: each route is a separate bundle, no barrel imports from components/

---

## CI/CD PIPELINE

```yaml
# .github/workflows/ci.yml
name: CI
on: [push, pull_request]
jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: "20", cache: "npm" }
      - run: npm ci
      - run: npm run typecheck # tsc --noEmit
      - run: npm run lint # eslint
      - run: npm run test # vitest run
      - run: npm run test:e2e # playwright test
```

---

## PACKAGE.JSON SCRIPTS

```json
{
  "scripts": {
    "dev": "next dev --turbopack",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:e2e": "playwright test",
    "test:coverage": "vitest run --coverage",
    "db:migrate": "prisma migrate dev",
    "db:generate": "prisma generate",
    "db:studio": "prisma studio",
    "db:seed": "tsx prisma/seed.ts"
  }
}
```

---

## IMPLEMENTATION RULES FOR THE AGENT

1. **Never use `any`** — use `unknown` and narrow with type guards or Zod parse
2. **Never expose API keys** — all Riot API calls happen in server-side code only
3. **Never use `export default` for components** — named exports only
4. **Always handle loading and error states** — every async component has a `loading.tsx` and `error.tsx` sibling
5. **Always validate API inputs with Zod** — before any processing in Route Handlers
6. **Use Server Components by default** — only add `'use client'` when strictly needed
7. **Co-locate tests** — `ComponentName.test.tsx` next to `ComponentName.tsx`
8. **No barrel index.ts files in `components/`** — import directly from the file path
9. **All feature flags via env var** — `NEXT_PUBLIC_FEATURE_AUTH=true`
10. **Consistent commit message format:** `feat:` / `fix:` / `chore:` / `refactor:` / `test:`

---

## IMPLEMENTATION ORDER (Suggested)

Build features in this order to have a working app at each milestone:

```
Phase 1 — Foundation (days 1-2)
  ✓ Project init, folder structure, env setup
  ✓ next.config.ts, tailwind.config.ts, tsconfig.json
  ✓ lib/valorant-api/* (agents, weapons, maps — no auth needed)
  ✓ lib/utils/* with unit tests
  ✓ Shared UI components (KdaDisplay, RankBadge, EmptyState, etc.)

Phase 2 — Core Features (days 3-5)
  ✓ Home page + SearchBar
  ✓ lib/riot/* client with Route Handlers
  ✓ Player profile page (Overview tab)
  ✓ Match history list

Phase 3 — Match & Rankings (days 6-8)
  ✓ Match detail page (scoreboard + timeline)
  ✓ Leaderboard page
  ✓ Charts (recharts — PerformanceTrend, EconomyChart, MapStats)

Phase 4 — Game Data Pages (days 9-10)
  ✓ Agents page + detail
  ✓ Weapons page + detail + skin gallery
  ✓ Maps page

Phase 5 — Auth + Polish (days 11-14)
  ✓ NextAuth + Riot RSO
  ✓ Favorites system
  ✓ E2E tests
  ✓ Accessibility audit
  ✓ Performance optimization
  ✓ Deploy to Vercel
```

---

## FINAL CHECKLIST BEFORE DEPLOY

- [ ] All TypeScript errors resolved (`npm run typecheck` exits 0)
- [ ] All lint errors resolved (`npm run lint` exits 0)
- [ ] All unit tests passing with >80% coverage
- [ ] All E2E tests passing in CI
- [ ] `.env.local.example` committed with all required variable names (no values)
- [ ] `RIOT_API_KEY` not present anywhere in committed code
- [ ] `next/image` used for all external images (not `<img>`)
- [ ] `loading.tsx` and `error.tsx` exist for every dynamic route
- [ ] Lighthouse score: Performance >85, Accessibility >95
- [ ] Responsive tested: 375px, 768px, 1024px, 1280px+
- [ ] Dark mode working on all pages
- [ ] No `console.log` in production code
- [ ] Prisma migrations run cleanly on fresh DB
