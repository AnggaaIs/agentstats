CREATE TYPE "MatchResult" AS ENUM ('WIN', 'LOSS', 'DRAW');

CREATE TABLE "agent_match_observations" (
    "id" TEXT NOT NULL,
    "sourceUserId" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "participantHash" TEXT NOT NULL,
    "region" TEXT NOT NULL,
    "actId" TEXT,
    "queueId" TEXT NOT NULL,
    "mapId" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "competitiveTier" INTEGER,
    "teamId" TEXT NOT NULL,
    "result" "MatchResult" NOT NULL,
    "matchStartedAt" TIMESTAMP(3) NOT NULL,
    "observedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "roundsPlayed" INTEGER NOT NULL,
    "roundsWon" INTEGER NOT NULL,
    "roundsLost" INTEGER NOT NULL,
    "score" INTEGER NOT NULL,
    "kills" INTEGER NOT NULL,
    "deaths" INTEGER NOT NULL,
    "assists" INTEGER NOT NULL,
    "damage" INTEGER NOT NULL,
    "damageReceived" INTEGER NOT NULL,
    "headshots" INTEGER NOT NULL,
    "bodyshots" INTEGER NOT NULL,
    "legshots" INTEGER NOT NULL,
    "kastRounds" INTEGER NOT NULL,
    "firstBloods" INTEGER NOT NULL,
    "plants" INTEGER NOT NULL,
    "defuses" INTEGER NOT NULL,
    "playtimeMillis" INTEGER NOT NULL,

    CONSTRAINT "agent_match_observations_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "agent_match_observations_matchId_participantHash_key"
ON "agent_match_observations"("matchId", "participantHash");

CREATE INDEX "agent_match_observations_sourceUserId_matchStartedAt_idx"
ON "agent_match_observations"("sourceUserId", "matchStartedAt");

CREATE INDEX "agent_match_observations_actId_queueId_region_idx"
ON "agent_match_observations"("actId", "queueId", "region");

CREATE INDEX "agent_match_observations_agentId_actId_idx"
ON "agent_match_observations"("agentId", "actId");

CREATE INDEX "agent_match_observations_matchStartedAt_idx"
ON "agent_match_observations"("matchStartedAt");

ALTER TABLE "agent_match_observations"
ADD CONSTRAINT "agent_match_observations_sourceUserId_fkey"
FOREIGN KEY ("sourceUserId") REFERENCES "users"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
