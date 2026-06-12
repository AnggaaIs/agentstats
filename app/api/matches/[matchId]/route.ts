import { apiError, apiSuccess } from "@/lib/api-response";
import { REGIONS, type Region } from "@/lib/constants";
import { redactMatch } from "@/lib/match-privacy";
import { getMatchAccess } from "@/lib/player-access";
import { getMatch, RiotApiError } from "@/lib/riot";

function isRegion(value: string | null): value is Region {
  return REGIONS.some((region) => region === value);
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ matchId: string }> },
) {
  const { matchId } = await params;
  const region = new URL(request.url).searchParams.get("region");

  if (!matchId || !isRegion(region)) {
    return apiError("Match or region is not valid.", 400);
  }

  try {
    const match = await getMatch(matchId, region);
    const access = await getMatchAccess(match);
    if (!access.canView) {
      return apiError("This match is private.", 403);
    }
    return apiSuccess(
      access.canSeeFullScoreboard
        ? match
        : redactMatch(match, access.publicPuuids),
    );
  } catch (error) {
    if (error instanceof RiotApiError) {
      return apiError(error.message, error.status);
    }
    return apiError("Match detail could not be loaded.", 500);
  }
}
