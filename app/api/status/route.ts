import { apiSuccess } from "@/lib/api-response";

export function GET() {
  const checks = {
    riotApi: Boolean(process.env.RIOT_API_KEY),
    publicUrl: Boolean(process.env.NEXT_PUBLIC_APP_URL),
    legalContact: Boolean(process.env.NEXT_PUBLIC_LEGAL_EMAIL),
  };

  return apiSuccess({
    app: "AgentStats",
    ready: Object.values(checks).every(Boolean),
    mode:
      process.env.RIOT_CLIENT_ID && process.env.RIOT_CLIENT_SECRET
        ? "player-opt-in"
        : "review-prototype",
    checks,
    timestamp: new Date().toISOString(),
  });
}
