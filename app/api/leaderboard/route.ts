import { apiError, apiSuccess } from "@/lib/api-response";
import { REGIONS, type Region } from "@/lib/constants";
import { getLeaderboard, RiotApiError } from "@/lib/riot";
import { getCurrentAct } from "@/lib/valorant-api";

function isRegion(value: string | null): value is Region {
  return REGIONS.some((region) => region === value);
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const region = url.searchParams.get("region");
  const requestedSize = Number(url.searchParams.get("size") ?? "200");

  if (
    !isRegion(region) ||
    !Number.isInteger(requestedSize) ||
    requestedSize < 1 ||
    requestedSize > 200
  ) {
    return apiError("Region or list size is not valid.", 400);
  }

  try {
    const act = await getCurrentAct();
    return apiSuccess({
      act,
      leaderboard: await getLeaderboard(region, act.uuid, requestedSize),
    });
  } catch (error) {
    if (error instanceof RiotApiError) {
      return apiError(error.message, error.status);
    }
    return apiError("Leaderboard could not be loaded.", 500);
  }
}
