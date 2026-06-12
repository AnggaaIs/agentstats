import { apiSuccess } from "@/lib/api-response";
import { isRsoConfigured } from "@/lib/auth-config";

export function GET() {
  const checks = {
    riotApi: Boolean(process.env.RIOT_API_KEY),
    publicUrl: Boolean(process.env.NEXT_PUBLIC_APP_URL),
    legalContact: Boolean(process.env.NEXT_PUBLIC_LEGAL_EMAIL),
    database: Boolean(process.env.DATABASE_URL),
  };
  const authConfigured = isRsoConfigured();

  return apiSuccess({
    app: "AgentStats",
    ready: Object.values(checks).every(Boolean),
    mode: authConfigured ? "player-opt-in" : "review-prototype",
    authConfigured,
    checks,
    timestamp: new Date().toISOString(),
  });
}
