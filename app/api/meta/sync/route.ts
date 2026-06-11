import { revalidatePath } from "next/cache";

import { apiError, apiSuccess } from "@/lib/api-response";
import { syncAgentMatchObservations } from "@/lib/agent-meta";
import { REGIONS, type Region } from "@/lib/constants";
import { prisma } from "@/lib/db";
import { ProfileVisibility } from "@/lib/generated/prisma/enums";
import { getRecentMatches, RiotApiError } from "@/lib/riot";

const STALE_AFTER_MS = 15 * 60 * 1_000;
const MAX_USERS_PER_RUN = 10;
const MATCHES_PER_USER = 20;

function isRegion(value: string): value is Region {
  return REGIONS.some((region) => region === value);
}

function isAuthorized(request: Request): boolean {
  const secret = process.env.AGENTSTATS_CRON_SECRET?.trim();
  if (!secret) return false;

  return request.headers.get("authorization") === `Bearer ${secret}`;
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return apiError("Meta sync is not authorized.", 401);
  }

  const staleBefore = new Date(Date.now() - STALE_AFTER_MS);
  const users = await prisma.user.findMany({
    where: {
      puuid: { not: null },
      consentedAt: { not: null },
      visibility: ProfileVisibility.PUBLIC,
      OR: [
        { lastProfileSyncAt: null },
        { lastProfileSyncAt: { lt: staleBefore } },
      ],
    },
    orderBy: [{ lastProfileSyncAt: "asc" }, { publishedAt: "asc" }],
    take: MAX_USERS_PER_RUN,
    select: {
      id: true,
      puuid: true,
      region: true,
      gameName: true,
      tagLine: true,
    },
  });
  let observations = 0;
  const failed: Array<{ userId: string; reason: string }> = [];

  for (const user of users) {
    if (!user.puuid || !isRegion(user.region)) continue;

    try {
      const matches = await getRecentMatches(
        user.puuid,
        user.region,
        MATCHES_PER_USER,
      );
      observations += await syncAgentMatchObservations({
        sourceUserId: user.id,
        region: user.region,
        matches,
      });
      if (user.gameName && user.tagLine) {
        revalidatePath(
          `/player/${user.region}/${encodeURIComponent(user.gameName)}/${encodeURIComponent(user.tagLine)}`,
        );
      }
    } catch (error) {
      failed.push({
        userId: user.id,
        reason:
          error instanceof RiotApiError
            ? error.message
            : "Could not sync this profile.",
      });
    }
  }

  revalidatePath("/");

  return apiSuccess({
    users: users.length,
    observations,
    failed,
  });
}
