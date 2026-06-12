CREATE TYPE "ObservationScope" AS ENUM ('SELF', 'MATCH_CONTEXT');

-- Existing rows did not distinguish the consenting player from other match
-- participants. Rebuild the aggregate sample under the stricter model.
DELETE FROM "agent_match_observations";

ALTER TABLE "agent_match_observations"
ADD COLUMN "scope" "ObservationScope" NOT NULL DEFAULT 'SELF';

CREATE INDEX "agent_match_observations_scope_actId_queueId_idx"
ON "agent_match_observations"("scope", "actId", "queueId");
