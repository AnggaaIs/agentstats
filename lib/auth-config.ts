import "server-only";

export function isRsoConfigured(): boolean {
  return (
    process.env.NEXT_PUBLIC_FEATURE_AUTH === "true" &&
    Boolean(process.env.AUTH_SECRET?.trim()) &&
    Boolean(process.env.RIOT_CLIENT_ID?.trim()) &&
    Boolean(process.env.RIOT_CLIENT_SECRET?.trim()) &&
    Boolean(process.env.DATABASE_URL?.trim())
  );
}
