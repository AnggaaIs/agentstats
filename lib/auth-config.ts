import "server-only";

export const PLAYER_CONSENT_VERSION = "2026-06-11";

export function isRsoConfigured(): boolean {
  return (
    process.env.NEXT_PUBLIC_FEATURE_AUTH === "true" &&
    Boolean(process.env.AUTH_SECRET?.trim()) &&
    Boolean(process.env.RIOT_CLIENT_ID?.trim()) &&
    Boolean(process.env.RIOT_CLIENT_SECRET?.trim()) &&
    Boolean(process.env.DATABASE_URL?.trim())
  );
}
