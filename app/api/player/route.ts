import { apiError, apiSuccess } from "@/lib/api-response";
import { getRiotAccount, RiotApiError } from "@/lib/riot";
import { playerSearchSchema } from "@/lib/schemas";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const input = playerSearchSchema.safeParse({
    name: url.searchParams.get("name"),
    tag: url.searchParams.get("tag"),
    region: url.searchParams.get("region"),
  });

  if (!input.success) {
    return apiError(input.error.issues[0]?.message ?? "Invalid player search.", 400);
  }

  try {
    const account = await getRiotAccount(
      input.data.name,
      input.data.tag,
      input.data.region,
    );
    return apiSuccess(account);
  } catch (error) {
    if (error instanceof RiotApiError) {
      return apiError(error.message, error.status);
    }
    return apiError("Internal server error.", 500);
  }
}
