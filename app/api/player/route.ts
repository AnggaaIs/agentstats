import { apiError, apiSuccess } from "@/lib/api-response";
import { findRiotAccount, getRiotAccount, RiotApiError } from "@/lib/riot";
import { playerLookupSchema } from "@/lib/schemas";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const input = playerLookupSchema.safeParse({
    name: url.searchParams.get("name"),
    tag: url.searchParams.get("tag"),
    region: url.searchParams.get("region"),
  });

  if (!input.success) {
    return apiError(input.error.issues[0]?.message ?? "Invalid player search.", 400);
  }

  try {
    if (input.data.region === "auto") {
      return apiSuccess(
        await findRiotAccount(input.data.name, input.data.tag),
      );
    }

    const account = await getRiotAccount(
      input.data.name,
      input.data.tag,
      input.data.region,
    );
    return apiSuccess({ account, region: input.data.region });
  } catch (error) {
    if (error instanceof RiotApiError) {
      return apiError(error.message, error.status);
    }
    return apiError("Internal server error.", 500);
  }
}
