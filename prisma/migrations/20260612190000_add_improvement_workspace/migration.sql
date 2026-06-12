CREATE TYPE "ImprovementMetric" AS ENUM (
    'OPENING_CONVERSION',
    'SURVIVAL_RATE',
    'KAST',
    'PISTOL_WIN_RATE',
    'ECONOMY_DAMAGE',
    'CONSISTENCY'
);

CREATE TYPE "ImprovementPlanStatus" AS ENUM (
    'ACTIVE',
    'COMPLETED',
    'ARCHIVED'
);

CREATE TYPE "TeamRole" AS ENUM ('OWNER', 'MEMBER');

CREATE TABLE "improvement_plans" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "metric" "ImprovementMetric" NOT NULL,
    "baselineValue" DOUBLE PRECISION NOT NULL,
    "targetValue" DOUBLE PRECISION NOT NULL,
    "durationDays" INTEGER NOT NULL,
    "status" "ImprovementPlanStatus" NOT NULL DEFAULT 'ACTIVE',
    "startsAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "improvement_plans_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "match_journals" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "focus" TEXT NOT NULL,
    "mood" INTEGER NOT NULL,
    "stackSize" INTEGER NOT NULL,
    "note" TEXT NOT NULL,
    "vodUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "match_journals_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "share_reports" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "anonymized" BOOLEAN NOT NULL DEFAULT true,
    "snapshot" JSONB NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "share_reports_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "teams" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "joinCode" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "teams_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "team_members" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "TeamRole" NOT NULL DEFAULT 'MEMBER',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "team_members_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "improvement_plans_userId_status_createdAt_idx"
ON "improvement_plans"("userId", "status", "createdAt");

CREATE UNIQUE INDEX "match_journals_userId_matchId_key"
ON "match_journals"("userId", "matchId");

CREATE INDEX "match_journals_userId_updatedAt_idx"
ON "match_journals"("userId", "updatedAt");

CREATE UNIQUE INDEX "share_reports_token_key"
ON "share_reports"("token");

CREATE INDEX "share_reports_userId_createdAt_idx"
ON "share_reports"("userId", "createdAt");

CREATE INDEX "share_reports_token_revokedAt_idx"
ON "share_reports"("token", "revokedAt");

CREATE UNIQUE INDEX "teams_joinCode_key"
ON "teams"("joinCode");

CREATE INDEX "teams_ownerId_createdAt_idx"
ON "teams"("ownerId", "createdAt");

CREATE UNIQUE INDEX "team_members_teamId_userId_key"
ON "team_members"("teamId", "userId");

CREATE INDEX "team_members_userId_joinedAt_idx"
ON "team_members"("userId", "joinedAt");

ALTER TABLE "improvement_plans"
ADD CONSTRAINT "improvement_plans_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "users"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "match_journals"
ADD CONSTRAINT "match_journals_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "users"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "share_reports"
ADD CONSTRAINT "share_reports_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "users"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "teams"
ADD CONSTRAINT "teams_ownerId_fkey"
FOREIGN KEY ("ownerId") REFERENCES "users"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "team_members"
ADD CONSTRAINT "team_members_teamId_fkey"
FOREIGN KEY ("teamId") REFERENCES "teams"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "team_members"
ADD CONSTRAINT "team_members_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "users"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
