import { apiError, apiSuccess } from "@/lib/api-response";
import { REGIONS, type Region } from "@/lib/constants";
import { getPlayerAccess } from "@/lib/player-access";
import { getRecentMatches, RiotApiError } from "@/lib/riot";

function isRegion(value: string | null): value is Region {
  return REGIONS.some((region) => region === value);
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const puuid = url.searchParams.get("puuid");
  const region = url.searchParams.get("region");
  const count = Number(url.searchParams.get("count") ?? "10");

  if (!puuid || !isRegion(region) || !Number.isInteger(count) || count < 1 || count > 20) {
    return apiError("Player, region, or match count is not valid.", 400);
  }

  try {
    const access = await getPlayerAccess(puuid);
    if (!access.canViewStats) {
      return apiError("This player's match history is private.", 403);
    }
    return apiSuccess(await getRecentMatches(puuid, region, count));
  } catch (error) {
    if (error instanceof RiotApiError) {
      return apiError(error.message, error.status);
    }
    return apiError("Match history could not be loaded.", 500);
  }
}
