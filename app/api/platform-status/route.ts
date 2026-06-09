import { apiError, apiSuccess } from "@/lib/api-response";
import { REGIONS, type Region } from "@/lib/constants";
import { getPlatformStatus, RiotApiError } from "@/lib/riot";

function isRegion(value: string | null): value is Region {
  return REGIONS.some((region) => region === value);
}

export async function GET(request: Request) {
  const region = new URL(request.url).searchParams.get("region");

  if (!isRegion(region)) {
    return apiError("Region is not valid.", 400);
  }

  try {
    return apiSuccess(await getPlatformStatus(region));
  } catch (error) {
    if (error instanceof RiotApiError) {
      return apiError(error.message, error.status);
    }
    return apiError("Riot service status could not be loaded.", 500);
  }
}
