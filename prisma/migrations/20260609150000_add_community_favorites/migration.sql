CREATE TYPE "FavoriteCategory" AS ENUM ('AGENT', 'MAP', 'WEAPON');
CREATE TYPE "VoteAction" AS ENUM ('CREATED', 'CHANGED');

CREATE TABLE "community_votes" (
    "id" TEXT NOT NULL,
    "deviceHash" TEXT NOT NULL,
    "category" "FavoriteCategory" NOT NULL,
    "targetId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "community_votes_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "community_vote_events" (
    "id" BIGSERIAL NOT NULL,
    "deviceHash" TEXT NOT NULL,
    "networkHash" TEXT NOT NULL,
    "category" "FavoriteCategory" NOT NULL,
    "targetId" TEXT NOT NULL,
    "action" "VoteAction" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "community_vote_events_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "community_votes_deviceHash_category_key"
ON "community_votes"("deviceHash", "category");

CREATE INDEX "community_votes_category_targetId_idx"
ON "community_votes"("category", "targetId");

CREATE INDEX "community_vote_events_deviceHash_createdAt_idx"
ON "community_vote_events"("deviceHash", "createdAt");

CREATE INDEX "community_vote_events_networkHash_createdAt_idx"
ON "community_vote_events"("networkHash", "createdAt");

CREATE INDEX "community_vote_events_category_createdAt_idx"
ON "community_vote_events"("category", "createdAt");
