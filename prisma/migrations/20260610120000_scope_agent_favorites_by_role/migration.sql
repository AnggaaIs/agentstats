DELETE FROM "community_vote_events"
WHERE "category" = 'AGENT';

DELETE FROM "community_votes"
WHERE "category" = 'AGENT';

ALTER TABLE "community_votes"
ADD COLUMN "scopeKey" TEXT NOT NULL DEFAULT 'default';

ALTER TABLE "community_vote_events"
ADD COLUMN "scopeKey" TEXT NOT NULL DEFAULT 'default';

DROP INDEX "community_votes_deviceHash_category_key";
DROP INDEX "community_votes_category_targetId_idx";
DROP INDEX "community_vote_events_category_createdAt_idx";

CREATE UNIQUE INDEX "community_votes_deviceHash_category_scopeKey_key"
ON "community_votes"("deviceHash", "category", "scopeKey");

CREATE INDEX "community_votes_category_scopeKey_targetId_idx"
ON "community_votes"("category", "scopeKey", "targetId");

CREATE INDEX "community_vote_events_category_scopeKey_createdAt_idx"
ON "community_vote_events"("category", "scopeKey", "createdAt");
